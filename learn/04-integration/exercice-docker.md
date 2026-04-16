# Exercice — Dockerisation Complète

## Contexte

Tu dois containeriser une application complète avec :
- **Frontend** : React + Vite
- **Backend** : Django REST Framework
- **Database** : PostgreSQL
- **Reverse Proxy** : Nginx (production)

---

## Partie 1 — Dockerfiles

### 1.1 Backend Django

Crée `backend/Dockerfile` qui :
- Utilise `python:3.11-slim`
- Installe les dépendances depuis `requirements.txt`
- Copie tout le code
- Expose le port 8000
- Lance avec Gunicorn en production

**À compléter** :
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Installation des dépendances système (pour psycopg2)
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code
COPY . .

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Gunicorn pour production
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### 1.2 Frontend React

Crée `frontend/Dockerfile` avec **multi-stage build** :
- Étape 1 : Build de l'application
- Étape 2 : Serveur Nginx pour servir les fichiers statiques

**À compléter** :
```dockerfile
# Étape 1 : Build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 : Serveur
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Partie 2 — Docker Compose

### 2.1 Configuration Complète

Crée `docker-compose.yml` avec 4 services :
1. `db` — PostgreSQL
2. `backend` — Django
3. `frontend` — Nginx servant le build React
4. `nginx` — Reverse proxy (optionnel pour dev)

**Spécifications** :
- Réseau isolé `hospiplan_network`
- Volume persistant `postgres_data`
- Variables d'environnement dans `.env`
- Health checks sur la DB
- Ordre de démarrage : db → backend → frontend

**À compléter** :
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    env_file:
      - .env
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - hospiplan_network

  backend:
    build: ./backend
    env_file:
      - .env
    environment:
      DB_HOST: db
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - static_volume:/app/staticfiles
      - media_volume:/app/media
    networks:
      - hospiplan_network
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    networks:
      - hospiplan_network

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - static_volume:/var/www/static
      - media_volume:/var/www/media
    depends_on:
      - backend
      - frontend
    networks:
      - hospiplan_network

volumes:
  postgres_data:
  static_volume:
  media_volume:

networks:
  hospiplan_network:
    driver: bridge
```

---

## Partie 3 — Configuration Nginx

Crée `nginx/nginx.conf` pour :
- Servir le frontend sur `/`
- Proxy vers le backend sur `/api/`
- Servir les fichiers statiques Django sur `/static/`

```nginx
server {
    listen 80;
    server_name localhost;

    # Frontend (React build)
    location / {
        proxy_pass http://frontend:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques Django
    location /static/ {
        alias /var/www/static/;
    }

    # Media files
    location /media/ {
        alias /var/www/media/;
    }
}
```

---

## Partie 4 — Fichier .env

Crée `.env` avec toutes les variables nécessaires :

```bash
# Django
DEBUG=False
SECRET_KEY=change-me-in-production-very-long-secret-key
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=hospiplan
DB_USER=hospiuser
DB_PASSWORD=secure-password-here
DB_HOST=db
DB_PORT=5432
DATABASE_URL=postgres://hospiuser:secure-password-here@db:5432/hospiplan

# Frontend
VITE_API_URL=/api
```

---

## Partie 5 — Commandes de Test

### 5.1 Vérification du Setup

```bash
# 1. Build et démarrage
docker-compose up --build -d

# 2. Vérifier les services
docker-compose ps

# 3. Vérifier les logs
docker-compose logs -f

# 4. Tester le backend
curl http://localhost/api/staff/

# 5. Tester le frontend
# Ouvrir http://localhost dans le navigateur
```

### 5.2 Créer un Superuser

```bash
docker-compose exec backend python manage.py createsuperuser
```

### 5.3 Exécuter les Migrations

```bash
docker-compose exec backend python manage.py migrate
```

### 5.4 Backup de la Database

```bash
# Créer un backup
docker-compose exec db pg_dump -U hospiuser hospiplan > backup.sql

# Restaurer un backup
docker-compose exec -T db psql -U hospiuser hospiplan < backup.sql
```

---

## Partie 6 — CI/CD avec GitHub Actions

Crée `.github/workflows/docker.yml` :

```yaml
name: Docker Build and Push

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2
    
    - name: Build Backend
      uses: docker/build-push-action@v4
      with:
        context: ./backend
        push: false
        tags: hospiplan-backend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Build Frontend
      uses: docker/build-push-action@v4
      with:
        context: ./frontend
        push: false
        tags: hospiplan-frontend:latest
        cache-from: type=gha
        cache-to: type=gha,mode=max
    
    - name: Test Docker Compose
      run: |
        docker-compose up -d
        sleep 30
        docker-compose ps
        curl -f http://localhost/api/staff/ || exit 1
        docker-compose down
```

---

## Checklist de Validation

- [ ] Dockerfiles fonctionnels (`docker build .` réussit)
- [ ] Docker Compose démarre sans erreur
- [ ] Backend accessible sur `/api/`
- [ ] Frontend accessible sur `/`
- [ ] Fichiers statiques servis correctement
- [ ] Base de données persistante (redémarrage conserve les données)
- [ ] Variables d'environnement externalisées
- [ ] Health checks configurés
- [ ] Réseau Docker isolé créé
- [ ] CI/CD pipeline fonctionnelle
