# Glossaire Complet — HospiPlan

## A

**API (Application Programming Interface)** — Interface de communication entre programmes. Dans HospiPlan, l'API REST permet au frontend React de dialoguer avec le backend Django.

**Atomicité** — Propriété d'une transaction où toutes les opérations réussissent ou échouent ensemble. Implémentée via `@transaction.atomic` dans Django.

## C

**CORS (Cross-Origin Resource Sharing)** — Mécanisme permettant à une page web d'accéder à des ressources d'un autre domaine. Contournement de la Same-Origin Policy.

**CRUD** — Create, Read, Update, Delete. Les 4 opérations de base sur des données.

## D

**Docker** — Plateforme de conteneurisation permettant d'emballer une application avec toutes ses dépendances.

**DRF (Django REST Framework)** — Bibliothèque pour créer des APIs REST avec Django.

## E

**Endpoint** — URL spécifique d'une API correspondant à une fonctionnalité (ex: `/api/staff/`).

## H

**Hook React** — Fonction React (`useState`, `useEffect`) permettant d'utiliser le state et le cycle de vie dans les composants fonctionnels.

## M

**Migration** — Script de modification du schéma de base de données dans Django.

**Modèle Django** — Classe Python représentant une table SQL.

## O

**ORM (Object-Relational Mapping)** — Couche d'abstraction traduisant les objets Python en requêtes SQL.

## Q

**QuerySet** — Collection d'objets retournée par une requête Django ORM.

## R

**Race Condition** — Situation où deux processus concurrents accèdent simultanément aux mêmes données, causant des incohérences. Solution: `SELECT FOR UPDATE`.

## S

**SCD Type 2 (Slowly Changing Dimension)** — Pattern de modélisation conservant l'historique des modifications via des intervalles de validité.

**Serializer** — Convertisseur Python ↔ JSON dans Django REST Framework.

**Soft Delete** — Suppression logique (marquage `deleted_at`) plutôt que suppression physique.

## T

**Transaction** — Groupe d'opérations SQL atomiques (tout ou rien).

## V

**ViewSet** — Classe DRF regroupant les opérations CRUD sur une ressource.

**Volume Docker** — Stockage persistant indépendant du cycle de vie des conteneurs.
