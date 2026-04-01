# HospiPlan 🏥

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) 

HospiPlan est une application de génération et de gestion de plannings hospitaliers conçue pour l'hôpital Al Amal. Ce projet respecte à la perfection des contraintes complexes de planification du personnel (Besoins métiers, quotas horaires, repos obligatoires post-nuit).

## 🚀 Fonctionnalités Actuelles (Phase 1 & Phase 2)
### Architecture des Données
- Base de données robuste reposant sur une architecture avancée de **24 tables**.
- **Sécurisation des données** : Présence de *Soft Deletes* (`deleted_at`) partout pour garantir la traçabilité médico-légale de l'hôpital (Aucun historique effacé en base !).
- **Temporalité Parfaite** : Gestion totale du pattern *SCD Type 2* (Historisation par intervalles) avec Indexation optimisée (Partial Indices) sur les lignes actives.
- Conception modulaire et paramétrable (Moteur de règles dynamique via la table `rule`).

### Backend (Django REST Framework)
- API complète couvrant l'interaction entre `Staff`, `Shift`, `Contract` et `Absence`.
- Tolérance zéro aux erreurs : **Protection au niveau transactionnel (`SELECT FOR UPDATE`)** empêchant les Race Conditions si deux managers assignent une ressource à la même milliseconde !
- Valide intelligemment en Python jusqu'à 6 contraintes strictes ("Contraintes dures") avant chaque enregistrement.

### Frontend (React + Vite)
- Interface de supervision qualitative avec design en *Glassmorphism*.
- Gestion des erreurs renvoyées par l'API (Rendu des `400 Bad Request` en cas d'affectation violant une règle métier de l'hôpital).

## 🛠️ Installation & Démarrage (Autonome)

Ce projet utilise le gestionnaire d'environnement nouvelle génération **`uv`**.

### 1. Cloner le Projet
```bash
git clone https://github.com/mrojefe/hospiplan.git
cd hospiplan
```

### 2. Démarrer le Serveur Backend (Django)
Ouvrez un terminal et tapez :
```bash
cd backend
uv venv
source .venv/bin/activate
uv pip install django djangorestframework django-cors-headers
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 8000
```
L'API fonctionnera sur `http://127.0.0.1:8000/api/`.

### 3. Démarrer l'Interface Frontend (React)
Ouvrez un DEUXIÈME terminal (Laissez tourner le premier !) :
```bash
cd frontend
npm install
npm run dev
```
L'application web sera accessible via le lien localhost indiqué (Généralement `http://localhost:5173/`).

## 📚 Documentation (Pour les Développeurs)
Ne laissez aucune zone d'ombre. Vous trouverez toute la documentation pédagogique justifiant l'architecture du projet dans le dossier principal **`docs/explications/`**. Vous y découvrirez pourquoi certains motifs de modélisation ont été choisis pour répondre adéquatement aux exigences hospitalières (Explications sur l'*Adjacency List*, la gestion `Axios`, la boucle de vérification Django, etc.).

---

Développé dans le cadre de l'intégration BootCamp - Phase 1 et 2.
