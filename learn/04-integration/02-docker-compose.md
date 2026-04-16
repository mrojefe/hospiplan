# Docker & Docker Compose — Orchestration

## Introduction — Pourquoi Docker ?

**Problème** : "Ça marche sur ma machine !" mais pas sur celle d'un collègue.

**Solution** : Docker encapsule l'application + toutes ses dépendances dans un conteneur isolé.

**Analogie** : Un conteneur maritime — ton application voyage avec tout son environnement pré-configuré.

---

## Concepts Clés

| Terme | Définition | Analogie |
|-------|------------|----------|
| **Image** | Template immuable pour créer des conteneurs | Plan d'architecture |
| **Conteneur** | Instance running d'une image | Maison construite |
| **Dockerfile** | Script pour construire une image | Liste de matériaux et instructions |
| **docker-compose** | Orchestrateur multi-conteneurs | Chef d'orchestre qui coordonne plusieurs services |
| **Volume** | Stockage persistant hors conteneur | Garage externe qui survit à la démolition |

---

## Dockerfile — Backend Django

```dockerfile
# backend/Dockerfile

# Image de base avec Python 3.11
FROM python:3.11-slim

# Répertoire de travail dans le conteneur
WORKDIR /app

# Copier et installer les dépendances
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 8000

# Commande de démarrage
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

### Explications ligne par ligne

| Instruction | Rôle |
|-------------|------|
| `FROM` | Image de base (comme hériter d'une classe) |
| `WORKDIR` | Crée et se place dans ce répertoire |
| `COPY` | Copie un fichier depuis l'hôte vers l'image |
| `RUN` | Exécute une commande pendant la construction |
| `EXPOSE` | Documente quel port le conteneur écoute |
| `CMD` | Commande exécutée au démarrage du conteneur |

---

## Dockerfile — Frontend React

```dockerfile
# frontend/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copier package.json et installer
COPY package*.json ./
RUN npm install

# Copier le reste du code
COPY . .

EXPOSE 5173

# Mode développement avec hot reload
CMD ["npm", "run", "dev", "--", "--host"]
```

**Pourquoi `package*.json` d'abord ?**
- Docker met en cache les layers
- Si seul le code change (pas les dépendances), `npm install` est réutilisé du cache
- Build 10x plus rapide après la première fois

---

## Docker Compose — Orchestration

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hospiplan
      POSTGRES_USER: hospiuser
      POSTGRES_PASSWORD: hospipass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospiuser -d hospiplan"]
      interval: 5s
      timeout: 5s
      retries: 5

  backend:
    build: ./backend
    environment:
      DEBUG: "True"
      DATABASE_URL: postgres://hospiuser:hospipass@db:5432/hospiplan
      ALLOWED_HOSTS: "localhost,127.0.0.1,0.0.0.0"
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app  # ← Hot reload en développement
    depends_on:
      db:
        condition: service_healthy
    command: >
      sh -c "python manage.py migrate &&
             python manage.py runserver 0.0.0.0:8000"

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules  # ← Exclure node_modules de l'override
    environment:
      VITE_API_URL: "http://localhost:8000/api"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## Réseau Docker — Communication Inter-Services

```
┌─────────────────────────────────────────────────────────────┐
│                    Réseau Docker par défaut                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌───────────┐         ┌───────────┐         ┌──────────┐ │
│   │  frontend │────────→│  backend  │────────→│    db    │ │
│   │  :5173    │         │  :8000    │         │  :5432   │ │
│   └───────────┘         └───────────┘         └──────────┘ │
│        │                     │                     │        │
│        │                     │                     │        │
│        └─────────────────────┴─────────────────────┘        │
│                     Host (ton ordinateur)                    │
│                    http://localhost:5173                     │
│                    http://localhost:8000                     │
└─────────────────────────────────────────────────────────────┘
```

**Résolution DNS interne** :
- `db` → IP du conteneur PostgreSQL
- `backend` → IP du conteneur Django
- `frontend` → IP du conteneur React

**Exemple** : Le backend se connecte à la DB via :
```python
DATABASE_URL = "postgres://hospiuser:hospipass@db:5432/hospiplan"
#                                            ↑
#                                    Nom du service dans docker-compose
```

---

## Commandes Essentielles

### Premier Lancement

```bash
# Build des images + démarrage
docker-compose up --build

# En arrière-plan (detached)
docker-compose up -d --build
```

### Développement Quotidien

```bash
# Voir les logs
docker-compose logs

# Logs d'un service spécifique
docker-compose logs -f backend

# Liste des conteneurs actifs
docker-compose ps

# Exécuter une commande dans un conteneur
docker-compose exec backend python manage.py shell

# Exécuter les migrations
docker-compose exec backend python manage.py migrate

# Créer un superuser
docker-compose exec backend python manage.py createsuperuser
```

### Arrêt et Nettoyage

```bash
# Arrêter les services
docker-compose down

# Arrêter et supprimer les volumes (⚠️ efface la DB)
docker-compose down -v

# Redémarrer un service
docker-compose restart backend

# Rebuild complet (si changements majeurs)
docker-compose down
docker-compose up --build
```

---

## Variables d'Environnement

### Backend (settings.py)

```python
import os
from dotenv import load_dotenv

load_dotenv()

DEBUG = os.getenv('DEBUG', 'False') == 'True'
SECRET_KEY = os.getenv('SECRET_KEY', 'dev-key-change-in-prod')
ALLOWED_HOSTS = os.getenv('ALLOWED_HOSTS', '').split(',')

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME', 'hospiplan'),
        'USER': os.getenv('DB_USER', 'hospiuser'),
        'PASSWORD': os.getenv('DB_PASSWORD', 'hospipass'),
        'HOST': os.getenv('DB_HOST', 'db'),  # ← Nom du service Docker
        'PORT': os.getenv('DB_PORT', '5432'),
    }
}
```

### Fichier .env (non versionné)

```bash
# .env
DEBUG=True
SECRET_KEY=dev-secret-key-do-not-use-in-production
DB_NAME=hospiplan
DB_USER=hospiuser
DB_PASSWORD=change-me-in-production
DB_HOST=db
DB_PORT=5432
```

### Frontend (Vite)

```javascript
// .env
VITE_API_URL=http://localhost:8000/api

// Utilisation dans le code
const API_URL = import.meta.env.VITE_API_URL;
```

**Règle** : Variables commençant par `VITE_` sont exposées au frontend.

---

## Health Checks — Démarrage Ordonné

**Problème** : Le backend démarre avant que PostgreSQL soit prêt.

**Solution** : `depends_on` + `condition: service_healthy`

```yaml
services:
  db:
    image: postgres:15-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hospiuser -d hospiplan"]
      interval: 5s      # Vérifier toutes les 5s
      timeout: 5s       # Timeout de 5s
      retries: 5        # 5 échecs max avant "unhealthy"
      start_period: 10s # Délai initial

  backend:
    depends_on:
      db:
        condition: service_healthy  # ← Attendre que db soit prête
```

**Séquence de démarrage** :
1. Docker démarre `db`
2. Healthcheck vérifie PostgreSQL toutes les 5s
3. Une fois `healthy`, Docker démarre `backend`
4. `backend` attend que `db` réponde pour les migrations

---

## Exercice — Ajouter un Service Redis

**Contexte** : Ajouter Redis pour le cache et les sessions.

**À faire** :
1. Ajouter le service Redis dans `docker-compose.yml`
2. Configurer Django pour utiliser Redis
3. Vérifier la connexion

<details>
<summary>Solution</summary>

```yaml
# docker-compose.yml
services:
  # ... services existants ...
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  backend:
    # ... config existante ...
    depends_on:
      - db
      - redis
    environment:
      REDIS_URL: redis://redis:6379/0

volumes:
  postgres_data:
  redis_data:
```

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': os.getenv('REDIS_URL', 'redis://redis:6379/0'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Session storage
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

</details>

---

## Points Clés à Retenir

1. **Dockerfile** = Recette pour construire une image
2. **docker-compose.yml** = Orchestrateur multi-services
3. **Volumes** = Persistance des données (DB, uploads)
4. **Bind mounts** (`./backend:/app`) = Hot reload en dev
5. **Réseau interne** = Les services se parlent par leur nom
6. **Health checks** = Démarrage ordonné et fiable
7. **`.env`** = Configuration externalisée (ne pas versionner !)
