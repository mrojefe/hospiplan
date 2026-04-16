# Django ORM — Du Python au SQL

## L'ORM : Votre Traducteur Python ↔ SQL

**ORM** = Object-Relational Mapping

Tu écris du **Python**, Django traduit en **SQL** automatiquement.

---

## Déclarer un Modèle

```python
from django.db import models

class Staff(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=255, unique=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'staff'  # Nom exact de la table SQL
```

**Ce que Django crée automatiquement** :
```sql
CREATE TABLE staff (
    id SERIAL PRIMARY KEY,  -- ← Django ajoute l'ID auto
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Les Types de Champs Django → SQL

| Django | SQL | Usage |
|--------|-----|-------|
| `CharField(max_length=100)` | `VARCHAR(100)` | Texte court (nom, email) |
| `TextField()` | `TEXT` | Texte long (description, commentaire) |
| `IntegerField()` | `INTEGER` | Nombre entier |
| `BooleanField()` | `BOOLEAN` | Vrai/Faux |
| `DateField()` | `DATE` | Date (2024-04-15) |
| `DateTimeField()` | `TIMESTAMP` | Date + heure |
| `EmailField()` | `VARCHAR` + validation | Email avec validation |
| `ForeignKey(Model)` | `INTEGER` + `REFERENCES` | Clé étrangère |
| `ManyToManyField(Model)` | Table de liaison | Relation N:N |

---

## ForeignKey — La Clé Étrangère

```python
class Shift(models.Model):
    care_unit = models.ForeignKey(
        CareUnit,           # ← Modèle référencé
        on_delete=models.CASCADE,  # ← Que faire si l'unité est supprimée ?
        related_name='shifts'      # ← Nom inverse pour les requêtes
    )
    start_datetime = models.DateTimeField()
```

**Options `on_delete`** :
- `CASCADE` : Supprime le shift si l'unité est supprimée
- `PROTECT` : Empêche la suppression de l'unité si des shifts existent
- `SET_NULL` : Met `NULL` dans le champ (nécessite `null=True`)
- `RESTRICT` : Comme PROTECT mais plus strict

**Utilisation du `related_name`** :
```python
# Sans related_name (moche)
Shift.objects.filter(care_unit=unit)

# Avec related_name (élégant)
unit.shifts.all()  # ← "Donne-moi tous les shifts de cette unité"
```

---

## ManyToManyField — Relations N:N

```python
class Role(models.Model):
    name = models.CharField(max_length=100)
    staff = models.ManyToManyField(
        Staff,
        db_table='staff_role',        # ← Nom de la table de liaison
        related_name='roles'          # ← user.roles.all()
    )
```

**Table générée automatiquement** :
```sql
CREATE TABLE staff_role (
    id SERIAL PRIMARY KEY,
    role_id INTEGER REFERENCES role(id),
    staff_id INTEGER REFERENCES staff(id),
    UNIQUE(role_id, staff_id)  -- ← Pas de doublons
);
```

**Manipuler la relation** :
```python
marie = Staff.objects.get(id=1)
infirmier = Role.objects.get(name='Infirmier')

# Ajouter un rôle
marie.roles.add(infirmier)

# Vérifier les rôles
if marie.roles.filter(name='Infirmier').exists():
    print("Marie est infirmière")

# Tous les staff infirmiers
infirmiers = Staff.objects.filter(roles__name='Infirmier')
```

---

## QuerySets — Requêter la Base

### Récupérer des données

```python
# Un seul objet (lève une erreur si pas trouvé)
marie = Staff.objects.get(id=5)
marie = Staff.objects.get(email='marie@hopital.fr')

# Filtres multiples
actifs = Staff.objects.filter(is_active=True)
urgentistes = Staff.objects.filter(
    is_active=True,
    roles__name='Infirmier Urgences'
)

# Exclure
inactifs = Staff.objects.exclude(is_active=True)

# Premier résultat (ou None)
premier = Staff.objects.filter(is_active=True).first()
```

### Requêtes complexes avec Q

```python
from django.db.models import Q

# OU logique
staff_filtre = Staff.objects.filter(
    Q(last_name='Dupont') | Q(last_name='Martin')
)

# ET + OU combinés
complexe = Staff.objects.filter(
    Q(is_active=True) & 
    (Q(roles__name='Infirmier') | Q(roles__name='Médecin'))
)
```

### Requêtes sur relations

```python
# Staff assignés à des shifts en avril 2024
staff_avril = Staff.objects.filter(
    shift_assignments__shift__start_datetime__year=2024,
    shift_assignments__shift__start_datetime__month=4
).distinct()

# Shifts d'une unité spécifique
shifts = Shift.objects.filter(care_unit__name='Urgences Salle 1')

# Shifts d'un service (via double relation)
shifts_cardio = Shift.objects.filter(
    care_unit__service__name='Cardiologie'
)
```

---

## Exercice — Requêtes à Compléter

**Contexte** : Tu as ces modèles :

```python
class Staff(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    is_active = models.BooleanField(default=True)

class Shift(models.Model):
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    care_unit = models.ForeignKey(CareUnit, on_delete=models.CASCADE)

class ShiftAssignment(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.RESTRICT)
    shift = models.ForeignKey(Shift, on_delete=models.RESTRICT)
    assigned_at = models.DateTimeField(auto_now_add=True)
```

**Complète ces requêtes** :

1. Tous les staff actifs dont le nom commence par "D" :
```python
staff_d = Staff.objects.filter(______)
```

2. Tous les shifts du 15 avril 2024 :
```python
shifts_15 = Shift.objects.filter(
    ______
)
```

3. Staff assignés à au moins un shift (utilise `______` pour exister) :
```python
staff_affectes = Staff.objects.filter(______)
```

4. Shifts qui chevauchent 15 avril 14h-22h (start < 22h ET end > 14h) :
```python
shifts_chevauchement = Shift.objects.filter(
    Q(start_datetime__lt=______) & Q(end_datetime__gt=______)
)
```

<details>
<summary>Solutions</summary>

```python
# 1. __istartswith pour case-insensitive, ou __startswith
staff_d = Staff.objects.filter(
    last_name__istartswith='D',
    is_active=True
)

# 2. __date pour extraire la date
from datetime import date
shifts_15 = Shift.objects.filter(
    start_datetime__date=date(2024, 4, 15)
)

# 3. shift_assignments__isnull=False
staff_affectes = Staff.objects.filter(
    shift_assignments__isnull=False
).distinct()

# 4. from datetime import datetime
from datetime import datetime
debut = datetime(2024, 4, 15, 22, 0)  # 22h
fin = datetime(2024, 4, 15, 14, 0)     # 14h

shifts_chevauchement = Shift.objects.filter(
    start_datetime__lt=debut,
    end_datetime__gt=fin
)
```

</details>

---

## Migrations — Modifier le Schéma

**Workflow des modifications** :

```bash
# 1. Tu modifies models.py
# Ajout d'un champ 'birth_date' dans Staff

# 2. Créer la migration (plan de modification)
python manage.py makemigrations

# 3. Appliquer la migration (exécuter le plan)
python manage.py migrate
```

**Fichier de migration généré** :
```python
# api/migrations/0007_staff_birth_date.py
class Migration(migrations.Migration):
    dependencies = [
        ('api', '0006_auto_20240415_1030'),
    ]

    operations = [
        migrations.AddField(
            model_name='staff',
            name='birth_date',
            field=models.DateField(null=True, blank=True),
        ),
    ]
```

---

## Exercice Pratique — Créer un Modèle

**Consigne** : Crée un modèle `Training` (Formation) pour tracker les formations suivies par le staff.

**Champs requis** :
- `staff` : FK vers Staff (qui a suivi la formation)
- `name` : Nom de la formation (ex: "Soins intensifs 2024")
- `provider` : Organisme formateur
- `start_date` / `end_date` : Dates
- `certification_obtained` : FK optionnelle vers Certification (si la formation délivre une certif)
- `deleted_at` : Soft delete

**Crée aussi** :
1. Le modèle Python
2. La commande pour créer la migration
3. Une requête pour trouver toutes les formations actives d'un staff

<details>
<summary>Solution complète</summary>

```python
# models.py
class Training(models.Model):
    staff = models.ForeignKey(
        Staff, 
        on_delete=models.CASCADE,
        related_name='trainings'
    )
    name = models.CharField(max_length=200)
    provider = models.CharField(max_length=150)
    start_date = models.DateField()
    end_date = models.DateField()
    certification_obtained = models.ForeignKey(
        Certification,
        on_delete=models.SET_NULL,
        null=True, blank=True
    )
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'training'

# Commandes
python manage.py makemigrations
python manage.py migrate

# Requête
formations_actives = Training.objects.filter(
    staff=marie,
    deleted_at__isnull=True,
    end_date__gte=date.today()  # Pas encore terminées
)
```

</details>
