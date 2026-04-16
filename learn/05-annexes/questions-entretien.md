# Questions d'Entretien — Révision HospiPlan

## Questions Générales Architecture

1. **Explique l'architecture 3-tiers de HospiPlan.**
   - Frontend (React) → Backend (Django) → Database (PostgreSQL)

2. **Pourquoi utiliser des contraintes dures plutôt que des warnings ?**
   - Sécurité patient, conformité réglementaire

3. **Qu'est-ce qu'une race condition et comment l'éviter ?**
   - Condition de concurrence → Solution: `SELECT FOR UPDATE` + transactions

## Questions Base de Données

4. **Différence entre clé primaire et clé étrangère ?**
   - PK = identifiant unique, FK = référence vers une autre table

5. **Pourquoi utiliser une table de liaison pour Many-to-Many ?**
   - Permet d'ajouter des attributs sur la relation et évite la redondance

6. **Qu'est-ce que le Soft Delete et pourquoi l'utiliser ?**
   - Marquage `deleted_at` au lieu de DELETE → traçabilité médico-légale

## Questions Backend Django

7. **Rôle du Serializer dans DRF ?**
   - Conversion Python ↔ JSON + validation

8. **Différence entre View et ViewSet ?**
   - ViewSet regroupe automatiquement les opérations CRUD

9. **Comment fonctionne `@transaction.atomic` ?**
   - Garantit que toutes les opérations réussissent ou échouent ensemble

## Questions Frontend React

10. **Différence entre `useState` et `useEffect` ?**
    - `useState` = données réactives, `useEffect` = effets de bord (API, timers)

11. **Pourquoi utiliser `useCallback` ou `useMemo` ?**
    - Optimisation des performances (mémorisation)

## Questions Docker

12. **Différence entre Image et Conteneur ?**
    - Image = template, Conteneur = instance running

13. **À quoi sert `depends_on` dans docker-compose ?**
    - Contrôle l'ordre de démarrage des services

## Questions CORS

14. **Pourquoi CORS existe-t-il ?**
    - Sécurité: empêche un site malveillant d'appeler une API sur un autre domaine

15. **Comment résoudre une erreur CORS en développement ?**
    - `CORS_ALLOW_ALL_ORIGINS = True` ou spécifier les origines autorisées
