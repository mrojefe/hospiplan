# Serializers — Python ↔ JSON

## Qu'est-ce qu'un Serializer ?

**Problème** : Le frontend veut du JSON, le backend manipule des objets Python.

**Solution** : Le **Serializer** convertit dans les deux sens.

```
Objet Python (Model Instance)
         ↓
   Serializer
         ↓
    JSON (API Response)
```

---

## Serializer Basique

```python
from rest_framework import serializers
from .models import Staff

class StaffSerializer(serializers.ModelSerializer):
    """
    Convertit Staff <-> JSON automatiquement
    """
    class Meta:
        model = Staff          # ← Quel modèle ?
        fields = '__all__'     # ← Tous les champs
```

**Entrée** (objet Python) :
```python
marie = Staff(
    id=5,
    first_name='Marie',
    last_name='Dupont',
    email='marie@hopital.fr'
)
```

**Sortie** (JSON) :
```json
{
  "id": 5,
  "first_name": "Marie",
  "last_name": "Dupont",
  "email": "marie@hopital.fr"
}
```

---

## Champs Personnalisés

### SerializerMethodField — Calcul à la volée

```python
class StaffSerializer(serializers.ModelSerializer):
    # Champ calculé qui n'existe pas dans la DB
    full_name = serializers.SerializerMethodField()
    assignment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name', 'full_name', 'assignment_count']
    
    def get_full_name(self, obj):
        """Retourne 'Marie Dupont'"""
        return f"{obj.first_name} {obj.last_name}"
    
    def get_assignment_count(self, obj):
        """Compte les affectations actives"""
        return obj.shift_assignments.filter(deleted_at__isnull=True).count()
```

**Résultat JSON** :
```json
{
  "id": 5,
  "first_name": "Marie",
  "last_name": "Dupont",
  "full_name": "Marie Dupont",
  "assignment_count": 12
}
```

---

## Champs Liés (Related Fields)

### StringRelatedField — Afficher le nom

```python
class StaffSerializer(serializers.ModelSerializer):
    roles = serializers.StringRelatedField(many=True, read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'roles']
```

**Résultat** :
```json
{
  "id": 5,
  "first_name": "Marie",
  "roles": ["Infirmier", "Chef de service"]
}
```

### SlugRelatedField — Champ spécifique

```python
class ShiftSerializer(serializers.ModelSerializer):
    care_unit_name = serializers.SlugRelatedField(
        source='care_unit',        # ← Quelle relation ?
        slug_field='name',          # ← Quel champ afficher ?
        read_only=True
    )
    
    class Meta:
        model = Shift
        fields = ['id', 'start_datetime', 'care_unit_name']
```

**Résultat** :
```json
{
  "id": 10,
  "start_datetime": "2024-04-15T20:00:00Z",
  "care_unit_name": "Urgences Salle 1"
}
```

### Nested Serializer — Objet complet

```python
class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class StaffSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name', 'roles']
```

**Résultat** :
```json
{
  "id": 5,
  "first_name": "Marie",
  "last_name": "Dupont",
  "roles": [
    {"id": 1, "name": "Infirmier"},
    {"id": 3, "name": "Chef de service"}
  ]
}
```

---

## Validation des Données

### validate_<field> — Validation par champ

```python
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = '__all__'
    
    def validate_email(self, value):
        """Vérifie que l'email n'est pas du domaine personnel"""
        banned_domains = ['gmail.com', 'yahoo.com', 'hotmail.com']
        domain = value.split('@')[1]
        
        if domain in banned_domains:
            raise serializers.ValidationError(
                'Use professional email (hopital.fr domain required)'
            )
        return value
    
    def validate_phone(self, value):
        """Vérifie le format téléphone français"""
        if value and not value.startswith('+33'):
            raise serializers.ValidationError(
                'Phone must start with +33 (French format)'
            )
        return value
```

### validate — Validation globale

```python
class ShiftAssignmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftAssignment
        fields = ['shift', 'staff']
    
    def validate(self, data):
        """
        Validation globale : vérifier que le staff 
        n'est pas déjà assigné à un shift chevauchant
        """
        staff = data['staff']
        shift = data['shift']
        
        overlap = ShiftAssignment.objects.filter(
            staff=staff,
            shift__start_datetime__lt=shift.end_datetime,
            shift__end_datetime__gt=shift.start_datetime
        ).exists()
        
        if overlap:
            raise serializers.ValidationError({
                'shift': 'Staff already assigned to an overlapping shift'
            })
        
        return data
```

---

## Read-Only vs Write-Only

```python
class StaffSerializer(serializers.ModelSerializer):
    # Affiché dans les réponses, ignoré dans les requêtes POST/PUT
    assignment_count = serializers.SerializerMethodField(read_only=True)
    
    # Envoyé dans les requêtes, jamais retourné (ex: mot de passe)
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'password', 'assignment_count']
```

---

## Exercice — Serializer Complexe

**Contexte** : Créer un serializer pour les affectations avec toutes les infos utiles.

**Spécifications** :
```json
{
  "id": 123,
  "assigned_at": "2024-04-15T10:30:00Z",
  "staff": {
    "id": 5,
    "full_name": "Marie Dupont",
    "email": "marie@hopital.fr"
  },
  "shift": {
    "id": 10,
    "datetime_display": "15/04/2024 20:00 - 16/04/2024 08:00",
    "care_unit": "Urgences Salle 1",
    "duration_hours": 12
  }
}
```

**Modèles disponibles** :
```python
class Staff(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()

class Shift(models.Model):
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    care_unit = models.ForeignKey(CareUnit, on_delete=models.CASCADE)

class ShiftAssignment(models.Model):
    staff = models.ForeignKey(Staff, on_delete=models.RESTRICT)
    shift = models.ForeignKey(Shift, on_delete=models.RESTRICT)
    assigned_at = models.DateTimeField(auto_now_add=True)
```

**Complète** :
```python
class StaffMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'email']
    
    def get_full_name(self, obj):
        # À compléter
        pass

class ShiftDetailSerializer(serializers.ModelSerializer):
    care_unit = serializers.____  # Nom de l'unité
    duration_hours = serializers.____  # Calculer (end - start)
    datetime_display = serializers.____  # Format "JJ/MM/AAAA HH:MM"
    
    class Meta:
        model = Shift
        fields = ['id', '____', '____', '____']
    
    def get_duration_hours(self, obj):
        # À compléter
        pass
    
    def get_datetime_display(self, obj):
        # Format: "15/04/2024 20:00 - 16/04/2024 08:00"
        # À compléter
        pass

class ShiftAssignmentDetailSerializer(serializers.ModelSerializer):
    staff = ____  # Utiliser StaffMiniSerializer
    shift = ____  # Utiliser ShiftDetailSerializer
    
    class Meta:
        model = ShiftAssignment
        fields = ['id', 'assigned_at', '____', '____']
```

<details>
<summary>Solution complète</summary>

```python
class StaffMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Staff
        fields = ['id', 'full_name', 'email']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class ShiftDetailSerializer(serializers.ModelSerializer):
    care_unit = serializers.StringRelatedField(read_only=True)
    duration_hours = serializers.SerializerMethodField()
    datetime_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Shift
        fields = ['id', 'care_unit', 'duration_hours', 'datetime_display']
    
    def get_duration_hours(self, obj):
        delta = obj.end_datetime - obj.start_datetime
        return int(delta.total_seconds() / 3600)
    
    def get_datetime_display(self, obj):
        start = obj.start_datetime.strftime('%d/%m/%Y %H:%M')
        end = obj.end_datetime.strftime('%d/%m/%Y %H:%M')
        return f"{start} - {end}"

class ShiftAssignmentDetailSerializer(serializers.ModelSerializer):
    staff = StaffMiniSerializer(read_only=True)
    shift = ShiftDetailSerializer(read_only=True)
    
    class Meta:
        model = ShiftAssignment
        fields = ['id', 'assigned_at', 'staff', 'shift']
```

</details>

---

## Points Clés à Retenir

1. **`fields = '__all__'`** = Tous les champs du modèle
2. **`read_only=True`** = Affiché dans la réponse, ignoré en écriture
3. **`write_only=True`** = Accepté en entrée, jamais retourné
4. **`SerializerMethodField`** = Champ calculé custom
5. **`StringRelatedField`** = Affiche `__str__()` de l'objet lié
6. **Nested Serializer** = Embarquer un objet complet (attention aux requêtes N+1 !)
7. **`validate()`** = Validation globale de tous les champs ensemble
