# Les 8 Contraintes Dures — Cœur Métier

## Introduction — Pourquoi des Contraintes Dures ?

Une **contrainte dure** (Hard Constraint) est une règle métier **impérative**.

> Si une contrainte dure est violée → L'opération est **REFUSÉE**.

**Exemples hospitaliers** :
- ❌ On n'affecte pas un infirmier aux urgences sans certification
- ❌ On ne fait pas travailler quelqu'un 2 shifts simultanément
- ❌ On respecte les 11h de repos après une nuit

---

## Vue d'Ensemble des 8 Contraintes

| # | Contrainte | Description | Table Principale |
|---|------------|-------------|------------------|
| 1 | **Chevauchement** | Pas 2 shifts simultanés | `ShiftAssignment` |
| 2 | **Certifications** | Certifs requises obligatoires | `StaffCertification` |
| 3 | **Repos post-nuit** | Délai minimal après garde de nuit | `Rule` |
| 4 | **Contrat actif** | Contrat valide autorisant ce type | `Contract` |
| 5 | **Absences** | Pas d'affectation si en congé/maladie | `Absence` |
| 6 | **Quota hebdo** | Respect des heures max du contrat | `Contract` |
| 7 | **F-07 Préférences** | Respect des contraintes impératives déclarées | `Preference` |
| 8 | **Seuil sécurité** | Maintenir ratio lits/soignants | `Service` + `Rule` |

---

## Implémentation Détaillée

### Localisation dans le Code

Toutes les contraintes sont dans `backend/api/views.py` :

```python
class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    
    @transaction.atomic
    def perform_create(self, serializer):
        # Verrou BDD
        staff = Staff.objects.select_for_update().get(id=staff_id)
        
        # Validation des 8 contraintes
        self.validate_assignment_hard_constraints(staff, shift)
        serializer.save()
    
    def validate_assignment_hard_constraints(self, staff, shift):
        # Les 8 contraintes ici
```

---

## Contrainte #1 — Chevauchement Horaire

**Règle** : Un soignant ne peut pas être à 2 endroits en même temps.

```python
# Vérifier si le staff a déjà un shift qui chevauche
chevauchement = ShiftAssignment.objects.filter(
    staff=staff,
    shift__start_datetime__lt=shift.end_datetime,   # Début existant < Fin nouveau
    shift__end_datetime__gt=shift.start_datetime   # Fin existant > Début nouveau
).exists()

if chevauchement:
    raise ValidationError(
        "The staff member already has an assignment during this time frame."
    )
```

**Logique** : Deux intervalles [A, B] et [C, D] se chevauchent si **A < D ET C < B**.

---

## Contrainte #2 — Certifications Requises

**Règle** : Le staff doit avoir toutes les certifications requises par le shift.

```python
for certif in shift.required_certifications.all():
    has_certif = StaffCertification.objects.filter(
        staff=staff,
        certification=certif,
        obtained_date__lte=shift.start_datetime.date()  # Obtenue avant
    ).filter(
        Q(expiration_date__isnull=True) |                 # Jamais expirée
        Q(expiration_date__gte=shift.end_datetime.date()) # Ou valide le jour J
    ).exists()
    
    if not has_certif:
        raise ValidationError(
            f"The staff member lacks the required certification: {certif.name}"
        )
```

**Logique** : Pour chaque certif requise, vérifier que le staff l'a **obtenue** et qu'elle n'est **pas expirée**.

---

## Contrainte #3 — Repos Post-Nuit

**Règle** : Après une garde de nuit, respecter un délai de repos (ex: 11h).

```python
# Récupérer la règle depuis la base (paramétrable)
rule_rest = Rule.objects.filter(rule_type='REST_TIME_POST_NIGHT').first()
rest_hours = float(rule_rest.value) if rule_rest else 11.0

# Trouver la dernière garde de nuit du staff
last_night_shift = ShiftAssignment.objects.filter(
    staff=staff,
    shift__shift_type__requires_rest_after=True,  # C'est une garde nécessitant repos
    shift__end_datetime__lte=shift.start_datetime  # Qui s'est terminée avant
).order_by('-shift__end_datetime').first()         # La plus récente

if last_night_shift:
    hours_rest = (
        shift.start_datetime - last_night_shift.shift.end_datetime
    ).total_seconds() / 3600.0
    
    if hours_rest < rest_hours:
        raise ValidationError(
            f"Mandatory rest period of {rest_hours}h not respected. "
            f"Only {int(hours_rest)}h passed."
        )
```

**Logique** : Si dernière garde de nuit → calculer heures écoulées → bloquer si < 11h.

---

## Contrainte #4 — Contrat Actif

**Règle** : Contrat valide couvrant la période + type de garde autorisé.

```python
# Trouver le contrat actif à la date du shift
active_contract = Contract.objects.filter(
    staff=staff,
    start_date__lte=shift.start_datetime.date()
).filter(
    Q(end_date__isnull=True) |
    Q(end_date__gte=shift.end_datetime.date())
).first()

if not active_contract:
    raise ValidationError("No active contract found for this date.")

# Vérifier autorisation de garde de nuit
if shift.shift_type.requires_rest_after and \
   not active_contract.contract_type.night_shift_allowed:
    raise ValidationError(
        f"Contract type {active_contract.contract_type.name} "
        f"does not allow night/intense shifts."
    )
```

**Logique** : Vérifier que le contrat couvre les dates ET que le type de contrat autorise ce shift.

---

## Contrainte #5 — Absences

**Règle** : Pas d'affectation si le staff est déclaré absent.

```python
in_absence = Absence.objects.filter(
    staff=staff,
    start_date__lte=shift.end_datetime.date()
).filter(
    # Absence en cours (pas encore terminée ou terminée après le shift)
    Q(actual_end_date__isnull=True, 
      expected_end_date__gte=shift.start_datetime.date()) |
    Q(actual_end_date__gte=shift.start_datetime.date())
).exists()

if in_absence:
    raise ValidationError(
        "Staff is marked as absent or on sick leave during this period."
    )
```

**Logique** : Vérifier si une absence couvre (même partiellement) la période du shift.

---

## Contrainte #6 — Quota Hebdomadaire

**Règle** : Respecter les heures max hebdomadaires du contrat.

```python
max_weekly = active_contract.contract_type.max_hours_per_week

if max_weekly:
    # Calcul début/fin de semaine (lundi-dimanche)
    start_week = shift.start_datetime - datetime.timedelta(
        days=shift.start_datetime.weekday()
    )
    end_week = start_week + datetime.timedelta(days=6)
    
    # Somme des heures déjà assignées cette semaine
    week_assignments = ShiftAssignment.objects.filter(
        staff=staff,
        shift__start_datetime__gte=start_week,
        shift__start_datetime__lte=end_week
    )
    total_hours = sum([
        (g.shift.end_datetime - g.shift.start_datetime).total_seconds() / 3600.0
        for g in week_assignments
    ])
    
    # Ajouter le nouveau shift
    future_shift_hours = (
        shift.end_datetime - shift.start_datetime
    ).total_seconds() / 3600.0
    
    if (total_hours + future_shift_hours) > float(max_weekly):
        raise ValidationError(f"Weekly maximum of {max_weekly}h exceeded.")
```

**Logique** : Calculer les heures déjà travaillées cette semaine + vérifier que l'ajout ne dépasse pas le max.

---

## Contrainte #7 — F-07 Préférences Impératives

**Règle** : Respecter les contraintes déclarées par le soignant avec `is_hard_constraint=True`.

```python
hard_constraints = Preference.objects.filter(
    staff=staff,
    is_hard_constraint=True,  # ← Seulement les contraintes dures
    start_date__lte=shift.end_datetime.date()
).filter(
    Q(end_date__isnull=True) |
    Q(end_date__gte=shift.start_datetime.date())
)

for constraint in hard_constraints:
    raise ValidationError(
        f"F-07 Hard constraint violated: {constraint.type} - "
        f"{constraint.description or 'No details'}"
    )
```

**Logique** : Si le staff a une prévention active marquée "impérative" → Refuser l'affectation.

---

## Contrainte #8 — Seuil de Sécurité

**Règle** : Maintenir un minimum de staff par service basé sur les lits.

```python
service = shift.care_unit.service

# Récupérer la règle de ratio (ex: 1 soignant pour 10 lits)
min_staff_rule = Rule.objects.filter(
    rule_type='MIN_STAFF_RATIO',
    valid_from__lte=shift.start_datetime.date()
).filter(
    Q(valid_to__isnull=True) |
    Q(valid_to__gte=shift.start_datetime.date())
).first()

if min_staff_rule:
    # Compter les affectations actuelles pour ce service ce jour
    current_assignments = ShiftAssignment.objects.filter(
        shift__care_unit__service=service,
        shift__start_datetime__date=shift.start_datetime.date()
    ).exclude(staff=staff).count()
    
    # Calculer le minimum requis
    required_staff = int(service.bed_capacity / float(min_staff_rule.value))
    
    if (current_assignments + 1) < required_staff:
        raise ValidationError(
            f"Service safety threshold violated. Service '{service.name}' "
            f"requires at least {required_staff} staff for {service.bed_capacity} beds."
        )
```

**Logique** : Calculer le staff minimum requis (lits ÷ ratio) → Vérifier qu'on ne descend pas en dessous.

---

## La Transaction — Atomicité

**Problème** : Que se passe-t-il si 2 managers affectent simultanément ?

**Solution** : `@transaction.atomic` + `SELECT FOR UPDATE`

```python
from django.db import transaction

class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    
    @transaction.atomic  # ← Tout réussit ou tout échoue
    def perform_create(self, serializer):
        shift = serializer.validated_data['shift']
        staff_id = serializer.validated_data['staff'].id
        
        # Verrouiller la ligne staff pendant la validation
        # ← Personne d'autre ne peut modifier ce staff pendant qu'on vérifie
        staff = Staff.objects.select_for_update().get(id=staff_id)
        
        # Les 8 validations
        self.validate_assignment_hard_constraints(staff, shift)
        
        # Sauvegarde
        serializer.save()
```

**Analogie** : Comme réserver une place de parking — tu bloques pendant que tu vérifies si c'est libre.

---

## Exercice — Ajouter une 9ème Contrainte

**Nouvelle règle métier** : "Un soignant ne peut pas être affecté plus de 3 nuits consécutives."

**Implémente** :
```python
def validate_no_consecutive_nights(self, staff, shift):
    """
    Vérifie que le staff n'a pas déjà fait 3 nuits consécutives
    avant ce nouveau shift.
    
    Indice: Compter les shifts de nuit dans les 3 derniers jours
    """
    # À compléter
    pass
```

<details>
<summary>Solution</summary>

```python
def validate_no_consecutive_nights(self, staff, shift):
    """Max 3 nuits consécutives"""
    if not shift.shift_type.requires_rest_after:
        return  # Pas une nuit, pas de vérification
    
    # Chercher les 3 derniers jours
    three_days_ago = shift.start_datetime - datetime.timedelta(days=3)
    
    # Compter les nuits déjà assignées dans cette fenêtre
    recent_nights = ShiftAssignment.objects.filter(
        staff=staff,
        shift__shift_type__requires_rest_after=True,
        shift__start_datetime__gte=three_days_ago,
        shift__start_datetime__lt=shift.start_datetime
    ).count()
    
    if recent_nights >= 3:
        raise ValidationError(
            f"Consecutive night shift limit exceeded. "
            f"Staff already assigned to {recent_nights} night shifts in the last 3 days."
        )
```

</details>

---

## Points Clés à Retenir

1. **Contraintes dures** = Jamais violables → `ValidationError` → HTTP 400
2. **Ordre** : Toutes les contraintes sont vérifiées avant `serializer.save()`
3. **Verrou BDD** : `select_for_update()` empêche les race conditions
4. **Transaction** : `@transaction.atomic` garantit l'intégrité
5. **Paramétrable** : Utiliser `Rule` pour les valeurs configurables (repos, ratio...)
6. **Dates** : Toujours vérifier les intervalles avec `__lte` / `__gte`
