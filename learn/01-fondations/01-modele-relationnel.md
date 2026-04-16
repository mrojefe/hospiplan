# Le Modèle Relationnel — Comprendre les 24 Tables

## Qu'est-ce qu'une Base de Données Relationnelle ?

**Analogie simple** : Des feuilles Excel qui se parlent.

- Chaque **table** = une feuille (Staff, Shift, Service...)
- Chaque **ligne** = un enregistrement (Marie Dupont, Nuit du 15/04...)
- Chaque **colonne** = un attribut (nom, email, date...)
- Les **relations** = liens entre feuilles via des références

---

## Les 6 Familles de Tables HospiPlan

```
┌────────────────────────────────────────────────────────────────────┐
│ 1. STAFF (Ressources Humaines)                                      │
├────────────────────────────────────────────────────────────────────┤
│ • staff               → Les soignants (Marie, Paul...)                │
│ • role                → Rôles (Infirmier, Médecin, Stagiaire)        │
│ • staff_role          → Liaison N:N Staff ↔ Role                    │
│ • specialty           → Spécialités (Cardio, Pédiatrie...)          │
│ • staff_specialty     → Liaison N:N Staff ↔ Specialty               │
│ • contract            → Contrats individuels (dates, %)              │
│ • contract_type       → Types de contrats (CDI, CDD, Stage)        │
│ • certification       → Certifications possibles (Urgences, Anesth.) │
│ • staff_certification → Liaison Staff ↔ Certification + dates       │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 2. ORGANISATION (Structure Hospitalière)                           │
├────────────────────────────────────────────────────────────────────┤
│ • service             → Services (Urgences, Chirurgie...)           │
│ • care_unit           → Unités de soins (Salle 1, Bloc A...)       │
│ • service_status      → Historique des statuts des services        │
│ • staff_service_assignment → Affectations staff ↔ service          │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 3. PLANNING (Le Cœur Métier)                                        │
├────────────────────────────────────────────────────────────────────┤
│ • shift_type          → Types de postes (Jour 8h, Nuit 12h...)     │
│ • shift               → Postes de garde concrets (date, heure)      │
│ • shift_assignment    → Affectations Staff ↔ Shift (la clé !)      │
│ • shift_required_certification → Certifs requises par shift        │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 4. ABSENCES & PRÉFÉRENCES                                           │
├────────────────────────────────────────────────────────────────────┤
│ • absence_type        → Types (Maladie, Congés, Formation)           │
│ • absence             → Absences déclarées (dates, staff)            │
│ • preference          → Préférences du staff (F-07)                │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 5. RÈGLES & PARAMÈTRAGE                                            │
├────────────────────────────────────────────────────────────────────┤
│ • rule                → Règles configurables (repos post-nuit...)   │
└────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────┐
│ 6. OPÉRATIONNEL (Données temps réel)                                │
├────────────────────────────────────────────────────────────────────┤
│ • patient_load        → Taux d'occupation par unité                 │
│ • staff_loan          → Prêts de personnel entre services           │
└────────────────────────────────────────────────────────────────────┘
```

---

## Les Types de Relations

### 1. One-to-Many (1:N) — "Possède plusieurs"

**Exemple** : Un **service** possède plusieurs **unités de soins**.

```
service (1) ───────────────> care_unit (N)
Cardiologie ─┬─> Salle Cardio 1
             ├─> Salle Cardio 2
             └─> Bloc Interventionnel
```

**En SQL** :
```sql
CREATE TABLE care_unit (
    id SERIAL PRIMARY KEY,
    service_id INTEGER REFERENCES service(id),  -- ← La clé étrangère
    name VARCHAR(100)
);
```

---

### 2. Many-to-Many (N:N) — "Liés mutuellement"

**Exemple** : Un **staff** a plusieurs **rôles**, un **rôle** a plusieurs **staff**.

```
        staff_role (table de liaison)
           ┌──────────────┐
Marie ────>│ staff_id: 1  │<──── Infirmier
Paul  ────>│ role_id: 1   │
Jean  ────>│ staff_id: 2  │<──── Médecin
           │ role_id: 2   │
           └──────────────┘
```

**Pourquoi une table intermédiaire ?** Sinon impossible de stocker qu'un staff a plusieurs rôles.

---

### 3. Self-Referencing (Auto-référence)

**Exemple** : Une **spécialité** peut avoir une **spécialité parente** (hiérarchie).

```
Cardiologie (parent)
    ├── Cardio-Interventionnelle (enfant)
    ├── Cardio-Thoracique (enfant)
    └── Échographie Cardiaque (enfant)
```

**En Django** :
```python
class Specialty(models.Model):
    name = models.CharField(max_length=100)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True)
    # 'self' = référence à la même table
```

---

## Exercice : Identifier les Relations

Regarde ce schéma partiel et réponds :

```
┌─────────────┐      ┌───────────────────┐      ┌─────────────┐
│   staff     │      │ shift_assignment  │      │   shift     │
├─────────────┤      ├───────────────────┤      ├─────────────┤
│ id (PK)     │<─────│ staff_id (FK)     │─────>│ id (PK)     │
│ first_name  │      │ shift_id (FK)     │      │ start_time  │
│ last_name   │      │ assigned_at       │      │ end_time    │
└─────────────┘      └───────────────────┘      └─────────────┘
```

**Questions** :
1. Quel type de relation entre `staff` et `shift` ?
2. Pourquoi a-t-on besoin de la table `shift_assignment` ?
3. Que représente la ligne : `staff_id=5, shift_id=12` ?

<details>
<summary>Réponses</summary>

1. **Many-to-Many (N:N)** : Un staff peut avoir plusieurs shifts, un shift peut avoir plusieurs staff.

2. **Table de liaison** : Pour stocker la date d'affectation (`assigned_at`) et permettre les attributs sur la relation elle-même.

3. **Le staff #5 est affecté au shift #12**, avec timestamp de quand cela a été créé.

</details>

---

## Pattern SCD Type 2 — Historisation

**Problème** : Comment savoir que Marie était infirmière en 2023 mais est devenue chef de service en 2024 ?

**Solution** : **Slowly Changing Dimension Type 2** — Garder l'historique avec intervalles de validité.

```
staff_service_assignment:
┌────┬──────────┬──────────┬────────────┬────────────┐
│ id │ staff_id │ service  │ start_date │ end_date   │
├────┼──────────┼──────────┼────────────┼────────────┤
│ 1  │ 5 (Marie)│ Urgences │ 2023-01-01 │ 2024-03-31 │ ← Ancien
│ 2  │ 5 (Marie)│ Chirurgie│ 2024-04-01 │ NULL       │ ← Actuel (NULL = en cours)
└────┴──────────┴──────────┴────────────┴────────────┘
```

**Clé** : La ligne avec `end_date=NULL` est la version **actuelle**.

**En pratique** :
```python
# Récupérer l'affectation actuelle de Marie
StaffServiceAssignment.objects.filter(
    staff=marie,
    end_date__isnull=True  # ← Actuellement actif
)
```

---

## Soft Delete — Suppression Logique

**Problème** : Si on supprime un soignant, on perd l'historique de ses anciennes affectations.

**Solution** : Ne jamais vraiment supprimer (`deleted_at` au lieu de DELETE).

```
Avant suppression :              Après "suppression" :
┌────────┬───────────┐          ┌────────┬───────────┬──────────────────┐
│ id     │ name      │          │ id     │ name      │ deleted_at       │
├────────┼───────────┤          ├────────┼───────────┼──────────────────┤
│ 5      │ Marie     │    →     │ 5      │ Marie     │ 2024-04-15 10:30 │ ← Date de "suppression"
└────────┴───────────┘          └────────┴───────────┴──────────────────┘
```

**Requête pour voir les actifs uniquement** :
```python
Staff.objects.filter(deleted_at__isnull=True)
```

---

## Exercice Pratique — Schéma à Compléter

**Contexte** : L'hôpital veut ajouter des **équipements médicaux** (ECG, Scanner, etc.) et savoir quels soignants sont **certifiés** pour les utiliser.

**Crée les tables** :
1. `equipment` — id, name, type, care_unit_id
2. `equipment_certification` — Quelles certifs requises pour quel équipement
3. `staff_equipment_certification` — Quels staff ont quelles certifs équipement + dates

**Indices** :
- equipment_certification est N:N entre equipment et certification
- staff_equipment_certification ressemble à staff_certification
- Pense aux clés étrangères !

<details>
<summary>Solution</summary>

```python
# models.py
class Equipment(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50)
    care_unit = models.ForeignKey(CareUnit, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'equipment'

class EquipmentCertification(models.Model):
    """Certifications requises pour utiliser un équipement"""
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    certification = models.ForeignKey(Certification, on_delete=models.CASCADE)
    
    class Meta:
        db_table = 'equipment_certification'

class StaffEquipmentCertification(models.Model):
    """Certifications équipement qu'un staff possède"""
    staff = models.ForeignKey(Staff, on_delete=models.CASCADE)
    equipment = models.ForeignKey(Equipment, on_delete=models.CASCADE)
    obtained_date = models.DateField()
    expiration_date = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'staff_equipment_certification'
```

</details>
