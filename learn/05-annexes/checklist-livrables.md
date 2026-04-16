# Checklist Livrables — HospiPlan

## Phase 1 — Modélisation ✅

- [x] 24 tables créées
- [x] Soft deletes (`deleted_at` sur toutes les tables)
- [x] SCD Type 2 (historisation avec intervalles)
- [x] Relations correctement définies (FK, Many-to-Many)
- [x] Index optimisés (partial indices)

## Phase 2 — Backend API ✅

- [x] Django REST Framework installé
- [x] Endpoints CRUD : Staff, Shift, Assignment, Absence
- [x] 8 contraintes dures implémentées:
  1. [x] Chevauchement horaire
  2. [x] Certifications requises
  3. [x] Repos post-nuit
  4. [x] Contrat actif
  5. [x] Absences
  6. [x] Quota hebdomadaire
  7. [x] F-07 Préférences
  8. [x] Seuil sécurité service
- [x] Verrou BDD (`SELECT FOR UPDATE`)
- [x] Transactions atomiques
- [x] Gestion des erreurs (HTTP 400 avec messages clairs)

## Phase 3 — Frontend ✅

- [x] React + Vite configuré
- [x] Client Axios configuré
- [x] Pages : Staff, Shifts, Assignments
- [x] Composants UI : Card, Table, Badge, Alert, Button
- [x] Hooks personnalisés (`useFetch`)
- [x] Gestion des erreurs API (affichage des 400)

## Phase 4 — Intégration ✅

- [x] Docker Compose (db, backend, frontend)
- [x] CORS configuré
- [x] Variables d'environnement
- [x] Health checks
- [x] README complet

## Phase 5 — Documentation ✅

- [x] Dossier `learn/` créé avec cours complet:
  - [x] 00-introduction (contexte, lexique, architecture)
  - [x] 01-fondations (modélisation, ORM, exercices)
  - [x] 02-backend-api (viewsets, serializers, contraintes)
  - [x] 03-frontend (hooks, axios, composants)
  - [x] 04-integration (cors, docker)
  - [x] 05-annexes (glossaire, questions, checklist)

## Livrables Optionnels

- [ ] Déploiement en ligne (Render, Railway, etc.)
- [ ] Tests unitaires complets (coverage > 80%)
- [ ] Documentation API (Swagger/OpenAPI)
- [ ] Authentification JWT
- [ ] Interface administrateur avancée
