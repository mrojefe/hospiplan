# CORS Expliqué — Pourquoi Ça Coince ?

## Le Problème

Tu codes tranquillement, frontend sur `localhost:5173`, backend sur `localhost:8000`.

Tu fais un appel API et...

```
Access to XMLHttpRequest at 'http://localhost:8000/api/staff/' 
from origin 'http://localhost:5173' has been blocked by CORS policy.
```

**Pourquoi ?** C'est la **politique de même origine** (Same-Origin Policy).

---

## Same-Origin Policy — La Base

**Règle du navigateur** : Une page web ne peut pas faire de requêtes vers un **domaine différent** du sien.

**Origine** = protocole + domaine + port

| URL | Même origine ? | Raison |
|-----|----------------|--------|
| `http://localhost:5173/page` | ✅ Oui | Même origine |
| `http://localhost:8000/api/` | ❌ Non | Port différent (8000 ≠ 5173) |
| `https://example.com/api/` | ❌ Non | Domaine différent |
| `http://localhost:5173:8080/` | ❌ Non | Port différent |

**Analogie** : Comme un immeuble avec gardien. Tu habites au 5173, tu ne peux pas aller chercher du courrier au 8000 sans autorisation.

---

## CORS — Cross-Origin Resource Sharing

**Solution** : Le serveur **autorise explicitement** les requêtes d'autres origines.

### Comment ça marche ?

```
┌─────────────┐         Preflight OPTIONS         ┌─────────────┐
│  Frontend   │ ─────────────────────────────────>│   Backend   │
│ localhost:  │    "Peux-je faire un POST depuis    │  localhost: │
│    5173     │     localhost:5173 ?"               │    8000     │
└─────────────┘                                     └─────────────┘
       │                                                    │
       │    Access-Control-Allow-Origin: http://localhost:5173
       │    Access-Control-Allow-Methods: GET, POST, OPTIONS
       │<───────────────────────────────────────────────────
       │                                                    │
       │         POST /api/staff/                           │
       │ ─────────────────────────────────────────────────>│
       │                                                    │
       │              201 Created                           │
       │<───────────────────────────────────────────────────
```

### Headers CORS importants

| Header | Rôle |
|--------|------|
| `Access-Control-Allow-Origin` | Origines autorisées (`*` ou `http://localhost:5173`) |
| `Access-Control-Allow-Methods` | Méthodes autorisées (GET, POST, etc.) |
| `Access-Control-Allow-Headers` | Headers autorisés (Content-Type, Authorization) |
| `Access-Control-Allow-Credentials` | Autorise les cookies/session |

---

## Configuration Django

### Avec django-cors-headers

**Installation** :
```bash
pip install django-cors-headers
```

**settings.py** :
```python
INSTALLED_APPS = [
    ...
    'corsheaders',
    ...
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ← Le plus haut possible
    'django.middleware.common.CommonMiddleware',
    ...
]

# Mode développement (permissif)
CORS_ALLOW_ALL_ORIGINS = True

# Mode production (strict)
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://hospiplan.example.com",
]

# Méthodes autorisées (défaut : tous)
CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

# Headers autorisés
CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-requested-with',
]
```

---

## Résolution des Problèmes CORS

### Diagnostic

**1. Vérifier la réponse du backend** :
```bash
curl -I -X OPTIONS http://localhost:8000/api/staff/ \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"
```

Doit contenir :
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: POST, OPTIONS
```

**2. Vérifier les logs Django** :
```
"OPTIONS /api/staff/ HTTP/1.1" 200 0
```

### Solutions par scénario

| Problème | Cause | Solution |
|----------|-------|----------|
| `No 'Access-Control-Allow-Origin'` | CORS non configuré | Installer `django-cors-headers` |
| `Method PUT is not allowed` | Méthode non autorisée | Ajouter à `CORS_ALLOW_METHODS` |
| `Request header field authorization is not allowed` | Header interdit | Ajouter à `CORS_ALLOW_HEADERS` |
| `The value of the 'Access-Control-Allow-Origin' header in the response must not be the wildcard '*'` | Credentials + `*` | Spécifier origine exacte |

---

## Configuration Production

### Scénario — Frontend et Backend sur même domaine

**Solution** : Reverse proxy (Nginx)

```nginx
# /api/* → backend
# /* → frontend

server {
    listen 80;
    server_name hospiplan.example.com;

    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://localhost:5173/;
    }
}
```

**Résultat** :
- Frontend : `https://hospiplan.example.com/`
- API : `https://hospiplan.example.com/api/`
- **Même origine** → Plus de CORS nécessaire !

---

## Exercice — Diagnostiquer CORS

**Scénario** : Tu déploies HospiPlan et vois cette erreur :

```
Access to fetch at 'https://api.hospiplan.com/staff/' 
from origin 'https://app.hospiplan.com' has been blocked.
The value of the 'Access-Control-Allow-Origin' header in the 
response must not be the wildcard '*' when the request's 
credentials mode is 'include'.
```

**Questions** :
1. Quelle est l'origine de la requête ?
2. Quelle est l'origine de la réponse ?
3. Pourquoi `*` pose problème ici ?
4. Quelle configuration Django résoud ce problème ?

<details>
<summary>Solutions</summary>

1. **Origine requête** : `https://app.hospiplan.com`
2. **Origine réponse** : `https://api.hospiplan.com`
3. **Problème `*`** : Quand `withCredentials: true` (cookies), le navigateur refuse `*` pour la sécurité
4. **Configuration** :
```python
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    "https://app.hospiplan.com",
]
CORS_ALLOW_CREDENTIALS = True
```

</details>

---

## Points Clés à Retenir

1. **Same-Origin Policy** = Règle de sécurité du navigateur
2. **CORS** = Mécanisme pour contourner cette règle avec permission explicite
3. **Preflight** = Requête OPTIONS automatique pour vérifier les autorisations
4. **`django-cors-headers`** = Solution standard pour Django
5. **Production** = Utiliser un reverse proxy pour éviter CORS
