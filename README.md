# HospiPlan 🏥

![Django](https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white) 

HospiPlan est une application de génération et de gestion de plannings hospitaliers conçue pour l'hôpital Al Amal. Ce projet respecte à la perfection des contraintes complexes de planification du personnel (Besoins métiers, quotas horaires, repos obligatoires post-nuit).

## 🚀 Fonctionnalités Actuelles (Phase 1 & Phase 2)
### Architecture des Données
- Base de données robuste reposant sur une architecture avancée de **24 tables**.
- **Sécurisation des données** : Présence de *Soft Deletes* (`deleted_at`) partout pour garantir la traçabilité médico-légale de l'hôpital (Aucun historique effacé en base !).
- **Temporalité Parfaite** : Gestion totale du pattern *SCD Type 2* (Historisation par intervalles) avec Indexation optimisée (Partial Indices) sur les lignes actives.
- Conception modulaire et paramétrable (Moteur de règles dynamique via la table `rule`).

### Backend (Django REST Framework) — Production Ready
- **Sécurité JWT** : Authentification par tokens avec refresh automatique
- **Permissions fines** : Responsables de service ne modifient que leurs services
- **Audit log complet** : Traçabilité de toutes les actions (qui, quand, quoi)
- **Protection transactionnelle** : `SELECT FOR UPDATE` anti race-conditions
- **8 contraintes dures** validées automatiquement :
  1. **Chevauchement horaire** - Un soignant ne peut pas avoir deux shifts simultanés
  2. **Certifications requises** - Vérification des qualifications obligatoires
  3. **Repos post-nuit** - Respect du délai réglementaire après une garde de nuit
  4. **Contrat actif** - Vérification de l'autorisation selon le type de contrat
  5. **Absences** - Blocage si le soignant est en congé/maladie
  6. **Quota hebdomadaire** - Respect des heures maximales du contrat
  7. **F-07 Préférences impératives** - Respect des contraintes déclarées par le soignant
  8. **Seuil de sécurité** - Maintien du ratio lits/soignants par service
- **Performance** : Pagination (100 items/page), `prefetch_related` optimisé
- **Soft deletes** : Aucune donnée perdue, traçabilité médico-légale

### Frontend (React + Vite)
- **Authentification JWT** : Login sécurisé avec tokens et refresh automatique
- **Validation frontend** : Vérification avant soumission, messages d'erreur clairs
- **Gestion des erreurs HTTP** : 400, 401, 403, 409 avec messages spécifiques
- **Design Glassmorphism** : Interface moderne et professionnelle

## � Démarrage Rapide avec Docker (Recommandé)

La méthode la plus simple pour lancer l'application complète :

```bash
# Cloner et entrer dans le projet
git clone https://github.com/mrojefe/hospiplan.git
cd hospiplan

# Lancer tous les services
docker-compose up --build
```

**URLs accessibles :**
- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:8000/api/
- **Admin Django** : http://localhost:8000/admin/

### Commandes utiles Docker
```bash
# Arrêter
docker-compose down

# Voir les logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reset complet (efface la DB)
docker-compose down -v
```

---

## 🛠️ Installation Manuelle (Développement)

### Prérequis
- Python 3.11+
- Node.js 18+
- PostgreSQL 15+ (optionnel, SQLite par défaut)

### Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configuration
cp .env.example .env  # Modifier les variables si nécessaire

# Créer un superuser pour l'authentification
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```

## 📚 Documentation (Dossier `learn/`)
Documentation pédagogique complète couvrant tous les aspects du projet :

- **`00-introduction/`** — Contexte métier, lexique professionnel, architecture 3-tiers
- **`01-fondations/`** — Modèle relationnel, ORM Django, exercices de modélisation
- **`02-backend-api/`** — ViewSets, Serializers, 8 contraintes dures avec solutions
- **`03-frontend/`** — React Hooks, Axios, composants UI avec exercices
- **`04-integration/`** — CORS expliqué, Docker Compose avancé
- **`05-annexes/`** — Glossaire, questions d'entretien, checklist livrables

---

Développé dans le cadre de l'intégration BootCamp - Phase 1 et 2.
