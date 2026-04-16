# Exercice — Implémenter une Contrainte Dure

## Contexte du Challenge

L'hôpital Al Amal souhaite ajouter une nouvelle contrainte réglementaire :

> **"Un soignant ne peut pas être affecté à un shift débutant moins de 12h après la fin de son dernier shift, sauf si c'est une urgence déclarée par le chef de service."**

Cette règle est destinée à prévenir la fatigue chronique.

---

## Spécifications Techniques

### 1. Contrainte à Implémenter

**Nom** : `MINIMUM_REST_BETWEEN_SHIFTS`

**Règle** :
- Après tout shift (pas seulement nuit), 12h de repos minimum
- Si urgence (flag `is_emergency=True` sur le shift) → dérogation possible
- Récupérer la durée depuis `Rule` avec `rule_type='MIN_REST_BETWEEN_SHIFTS'`

### 2. Modèle Modifié

```python
# Ajouter à Shift
class Shift(models.Model):
    # ... champs existants ...
    is_emergency = models.BooleanField(default=False)  # ← NOUVEAU
```

### 3. Comportement Attendu

| Scénario | Dernier shift fini à | Nouveau shift commence à | Urgence ? | Résultat |
|----------|---------------------|--------------------------|-----------|----------|
| Normal | 15/04 08:00 | 15/04 18:00 | Non | ❌ Refusé (10h < 12h) |
| Normal | 15/04 08:00 | 15/04 20:00 | Non | ✅ Accepté (12h repos) |
| Urgence | 15/04 08:00 | 15/04 10:00 | Oui | ✅ Accepté (dérogation) |

---

## Partie 1 — Modèle et Migration

**1.1** Modifie le modèle `Shift` pour ajouter `is_emergency`.

**1.2** Crée et applique la migration.

<details>
<summary>Solution Partie 1</summary>

```python
# backend/api/models.py
class Shift(models.Model):
    care_unit = models.ForeignKey(CareUnit, on_delete=models.CASCADE)
    shift_type = models.ForeignKey(ShiftType, on_delete=models.CASCADE)
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    min_staff = models.IntegerField(default=1)
    max_staff = models.IntegerField(null=True, blank=True)
    required_certifications = models.ManyToManyField(Certification, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_emergency = models.BooleanField(default=False)  # ← AJOUT

    class Meta:
        db_table = 'shift'
```

```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

</details>

---

## Partie 2 — Implémentation de la Contrainte

**2.1** Ajoute une méthode `validate_minimum_rest` dans `ShiftAssignmentViewSet`.

**2.2** Appelle cette méthode dans `validate_assignment_hard_constraints`.

**Indices** :
- Chercher le dernier shift assigné au staff (quel que soit le type)
- Calculer le temps écoulé entre fin du dernier et début du nouveau
- Vérifier le flag `is_emergency` pour la dérogation
- Utiliser `Rule` pour la durée configurable

<details>
<summary>Solution Partie 2</summary>

```python
def validate_minimum_rest(self, staff, shift):
    """
    Vérifie le repos minimum entre deux shifts.
    Dérogation possible si le nouveau shift est marqué urgence.
    """
    # Récupérer la règle de repos (défaut: 12h)
    rest_rule = Rule.objects.filter(
        rule_type='MIN_REST_BETWEEN_SHIFTS',
        valid_from__lte=shift.start_datetime.date()
    ).filter(
        Q(valid_to__isnull=True) |
        Q(valid_to__gte=shift.start_datetime.date())
    ).first()
    min_hours = float(rest_rule.value) if rest_rule else 12.0
    
    # Trouver le dernier shift du staff (n'importe quel type)
    last_assignment = ShiftAssignment.objects.filter(
        staff=staff,
        shift__end_datetime__lte=shift.start_datetime
    ).order_by('-shift__end_datetime').first()
    
    if last_assignment:
        hours_since_last = (
            shift.start_datetime - last_assignment.shift.end_datetime
        ).total_seconds() / 3600.0
        
        # Si pas assez de repos ET pas une urgence → bloquer
        if hours_since_last < min_hours and not shift.is_emergency:
            raise ValidationError(
                f"Minimum rest of {min_hours}h between shifts required. "
                f"Only {hours_since_last:.1f}h since last shift. "
                f"Mark as emergency to override."
            )

# Dans validate_assignment_hard_constraints, ajouter:
def validate_assignment_hard_constraints(self, staff, shift):
    # ... contraintes 1-8 existantes ...
    
    # 9. Repos minimum entre shifts
    self.validate_minimum_rest(staff, shift)
```

</details>

---

## Partie 3 — Tests de la Contrainte

**3.1** Crée un test unitaire pour vérifier la contrainte.

**Scénarios à tester** :
- Refus si repos insuffisant (non-urgence)
- Acceptation si repos suffisant
- Acceptation si urgence (même avec repos insuffisant)

<details>
<summary>Solution Partie 3</summary>

```python
# backend/api/tests.py
from django.test import TestCase
from django.utils import timezone
from datetime import datetime, timedelta
from rest_framework.exceptions import ValidationError

from .models import Staff, Shift, ShiftType, CareUnit, Service
from .views import ShiftAssignmentViewSet

class MinimumRestConstraintTest(TestCase):
    def setUp(self):
        self.service = Service.objects.create(
            name='Test Service', bed_capacity=10
        )
        self.care_unit = CareUnit.objects.create(
            service=self.service, name='Test Unit'
        )
        self.shift_type = ShiftType.objects.create(
            name='Day', duration_hours=8, requires_rest_after=False
        )
        self.staff = Staff.objects.create(
            first_name='Test', last_name='Nurse', email='test@hopital.fr'
        )
        self.viewset = ShiftAssignmentViewSet()
    
    def test_refuses_insufficient_rest(self):
        """Doit refuser si moins de 12h de repos"""
        # Créer un shift précédent qui finit à 08:00
        last_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 0, 0),  # 00h-08h
            end_datetime=datetime(2024, 4, 15, 8, 0),
        )
        
        # Nouveau shift à 18:00 le même jour (10h après)
        new_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 18, 0),
            end_datetime=datetime(2024, 4, 16, 2, 0),
            is_emergency=False
        )
        
        # Simuler l'affectation précédente
        from .models import ShiftAssignment
        ShiftAssignment.objects.create(staff=self.staff, shift=last_shift)
        
        # Doit lever ValidationError
        with self.assertRaises(ValidationError) as context:
            self.viewset.validate_minimum_rest(self.staff, new_shift)
        
        self.assertIn('Minimum rest of 12h', str(context.exception))
    
    def test_accepts_sufficient_rest(self):
        """Doit accepter si 12h ou plus de repos"""
        last_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 0, 0),
            end_datetime=datetime(2024, 4, 15, 8, 0),
        )
        
        # Nouveau shift à 20:00 (12h après)
        new_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 20, 0),
            end_datetime=datetime(2024, 4, 16, 4, 0),
        )
        
        from .models import ShiftAssignment
        ShiftAssignment.objects.create(staff=self.staff, shift=last_shift)
        
        # Ne doit PAS lever d'exception
        try:
            self.viewset.validate_minimum_rest(self.staff, new_shift)
        except ValidationError:
            self.fail("Should not raise ValidationError with 12h rest")
    
    def test_accepts_emergency_override(self):
        """Doit accepter si urgence même avec repos insuffisant"""
        last_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 0, 0),
            end_datetime=datetime(2024, 4, 15, 8, 0),
        )
        
        # Nouveau shift urgent à 10:00 (2h après)
        new_shift = Shift.objects.create(
            care_unit=self.care_unit,
            shift_type=self.shift_type,
            start_datetime=datetime(2024, 4, 15, 10, 0),
            end_datetime=datetime(2024, 4, 15, 18, 0),
            is_emergency=True  # ← URGENCE
        )
        
        from .models import ShiftAssignment
        ShiftAssignment.objects.create(staff=self.staff, shift=last_shift)
        
        # Ne doit PAS lever d'exception car urgence
        try:
            self.viewset.validate_minimum_rest(self.staff, new_shift)
        except ValidationError:
            self.fail("Should not raise ValidationError for emergency shift")
```

</details>

---

## Partie 4 — Exposition dans l'API

**4.1** Le serializer doit exposer le champ `is_emergency`.

**4.2** Le frontend doit pouvoir cocher une case "Urgence".

<details>
<summary>Solution Partie 4</summary>

```python
# serializers.py
class ShiftSerializer(serializers.ModelSerializer):
    care_unit_name = serializers.CharField(source='care_unit.name', read_only=True)
    shift_type_name = serializers.CharField(source='shift_type.name', read_only=True)
    is_emergency = serializers.BooleanField(default=False)  # ← AJOUT
    
    class Meta:
        model = Shift
        fields = ['id', 'care_unit', 'care_unit_name', 'shift_type', 
                  'shift_type_name', 'start_datetime', 'end_datetime',
                  'min_staff', 'max_staff', 'is_emergency']  # ← AJOUT
```

**Migration pour créer la règle par défaut** (optionnel, via fixture ou admin) :
```python
# Créer la règle initiale
Rule.objects.create(
    name='Repos minimum entre shifts',
    rule_type='MIN_REST_BETWEEN_SHIFTS',
    value=12.0,
    unit='hours',
    valid_from='2024-01-01'
)
```

</details>

---

## Checklist de Validation

- [ ] Modèle `Shift` a le champ `is_emergency`
- [ ] Migration créée et appliquée
- [ ] Méthode `validate_minimum_rest` implémentée
- [ ] Appelé dans `validate_assignment_hard_constraints`
- [ ] Récupération de la règle depuis la base
- [ ] Dérogation urgence fonctionne
- [ ] Tests unitaires passent
- [ ] Champ exposé dans le serializer

---

## Points de Vigilance

1. **Timezone** : S'assurer que tous les calculs utilisent la même timezone
2. **Règle absente** : Avoir une valeur par défaut (12h) si la règle n'existe pas
3. **Premier shift** : Gérer le cas où le staff n'a jamais travaillé (pas d'erreur)
4. **Emergency flag** : Seul un chef de service devrait pouvoir le cocher (permissions)
