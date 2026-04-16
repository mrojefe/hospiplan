# Contexte Métier — Pourquoi HospiPlan Existe

## Le Problème Réel

Les hôpitaux font face à un défi complexe : **planifier des centaines de soignants** sur des postes variés (urgences, chirurgie, réanimation...) tout en respectant des contraintes strictes.

### Les Enjeux

- **Sécurité patient** : Un service sous-staffé = risque médical
- **Droits du personnel** : Repos obligatoires, heures maximales, congés
- **Compétences** : Un infirmier sans certification ne peut pas être en réanimation
- **Imprévus** : Maladies, absences de dernière minute

### La Solution HospiPlan

Une **application web** qui automatise la création de plannings hospitaliers avec :
- **24 tables** modélisant l'ensemble des entités (soignants, services, contrats, certifications...)
- **8 contraintes dures** validées automatiquement à chaque affectation
- **Interface moderne** pour les managers hospitaliers

---

## Vocabulaire Métier Hospitalier

| Terme | Définition | Exemple concret |
|-------|------------|-----------------|
| **Service** | Département hospitalier | Urgences, Chirurgie, Cardiologie |
| **Unité de soins** | Sous-division d'un service | "Salle 1 Urgences", "Bloc A" |
| **Poste de garde (Shift)** | Créneau horaire à pourvoir | "Nuit du 15/04 en Urgences" |
| **Affectation** | Lien entre soignant et poste | "Marie Dupont affectée à la nuit du 15/04" |
| **Certification** | Qualification requise | "Cardio-urgences", "Anesthésie" |
| **Type de contrat** | Statut professionnel | CDI, Stage, Interim |
| **Contrainte dure** | Règle impérative (jamais violée) | "Repos de 11h après nuit" |
| **Contrainte molle** | Règle souhaitable (optimisée) | "Préférence de Marie pour les jours" |

---

## Intuition : Pourquoi C'est Complexe

Imagine que tu dois organiser une soirée avec 50 amis :
- Alice ne peut pas venir le vendredi (contrainte dure = absence)
- Bob doit partir avant minuit (contrainte dure = repos)
- Charlie ne boit pas d'alcool, donc pas au bar (contrainte dure = certification)
- David préfère le samedi mais peut venir vendredi (contrainte molle)

Multiplie ça par **100 soignants × 30 jours × 3 postes par jour** = l'enfer combinatoire.

HospiPlan est le **solveur** qui dit automatiquement "OUI" ou "NON" à chaque affectation.

---

## Architecture 3-Tiers (Vue d'Ensemble)

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Liste Staff │  │ Liste Shifts│  │ Formulaire Affect.  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│         │                │                   │              │
│         └────────────────┴───────────────────┘              │
│                         │                                  │
│                  Appels HTTP (REST API)                     │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│                    BACKEND (Django)                          │
│                         │                                    │
│    ┌────────────────────┴────────────────────┐               │
│    │         8 Contraintes Dures              │               │
│    │  • Chevauchement  • Certifications     │               │
│    │  • Repos post-nuit • Contrat actif      │               │
│    │  • Absences • Quota hebdo               │               │
│    │  • F-07 Préférences • Seuil sécurité    │               │
│    └────────────────────┬────────────────────┘               │
│                         │                                    │
│                   ORM Django / SQL                           │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                   BASE DE DONNÉES                           │
│              PostgreSQL / SQLite                            │
│           (24 tables relationnelles)                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Exercice d'Intuition

**Scénario** : L'hôpital Al Amal a besoin de staffer son service d'urgences pour le weekend du 15-16 avril.

**Données** :
- 2 infirmières qualifiées : Marie (certif "Urgences"), Paul (pas de certif)
- 1 poste de garde : Nuit du 15/04, 20h-8h, certif "Urgences" requise

**Question** : Qui peut être affecté ? Pourquoi Paul ne peut pas ?

<details>
<summary>Réponse</summary>

**Marie peut être affectée** car elle a la certification "Urgences" requise.

**Paul ne peut pas** car la contrainte dure #2 (certifications) bloque : il manque la qualification obligatoire pour ce poste.

C'est exactement ce que HospiPlan valide automatiquement via :
```python
for certif in shift.required_certifications.all():
    has_certif = StaffCertification.objects.filter(...)
```

</details>
