# Views vs ViewSets — L'Architecture DRF

## Django REST Framework (DRF) en 2 Minutes

**DRF** = Bibliothèque qui transforme Django en API REST.

**Pourquoi l'utiliser ?**
- Génère automatiquement les endpoints CRUD
- Sérialise Python ↔ JSON automatiquement
- Gère l'authentification, les permissions, la pagination

---

## ViewSet — Le Couteau Suisse

Un **ViewSet** regroupe toutes les opérations sur une ressource.

```python
from rest_framework import viewsets
from .models import Staff
from .serializers import StaffSerializer

class StaffViewSet(viewsets.ModelViewSet):
    """
    Gère automatiquement :
    - GET    /api/staff/      → list()    (liste)
    - GET    /api/staff/1/    → retrieve() (détail)
    - POST   /api/staff/      → create()   (créer)
    - PUT    /api/staff/1/    → update()   (modifier)
    - DELETE /api/staff/1/    → destroy()  (supprimer)
    """
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
```

**Mappings automatiques** :

| Méthode HTTP | URL | Méthode ViewSet | Action |
|--------------|-----|-----------------|--------|
| GET | `/staff/` | `list()` | Liste paginée |
| GET | `/staff/1/` | `retrieve()` | Détail |
| POST | `/staff/` | `create()` | Créer |
| PUT | `/staff/1/` | `update()` | Modifier tout |
| PATCH | `/staff/1/` | `partial_update()` | Modifier partiel |
| DELETE | `/staff/1/` | `destroy()` | Supprimer (soft) |

---

## Router — L'Auto-Routage

**Problème** : Dois-je écrire 6 URLs par ressource ?

**Solution** : Le **Router** génère automatiquement les URLs.

```python
# urls.py
from rest_framework.routers import DefaultRouter
from .views import StaffViewSet, ShiftViewSet

router = DefaultRouter()
router.register(r'staff', StaffViewSet)
router.register(r'shifts', ShiftViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
```

**URLs générées automatiquement** :
```
/api/staff/          → StaffViewSet.list()
/api/staff/1/        → StaffViewSet.retrieve()
/api/staff/1/.json   → Même chose mais format JSON forcé
```

---

## Personnaliser un ViewSet

### Filtrer le queryset

```python
class StaffViewSet(viewsets.ModelViewSet):
    serializer_class = StaffSerializer
    
    def get_queryset(self):
        """Ne retourner que les staff actifs par défaut"""
        queryset = Staff.objects.filter(deleted_at__isnull=True)
        
        # Paramètre optionnel ?active=false pour voir les inactifs
        if self.request.query_params.get('active') == 'false':
            queryset = Staff.objects.filter(deleted_at__isnull=False)
        
        return queryset
```

### Override d'une méthode

```python
class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    
    def destroy(self, request, pk=None):
        """Soft delete au lieu de hard delete"""
        staff = self.get_object()
        staff.deleted_at = timezone.now()
        staff.save()
        return Response({'status': 'staff soft-deleted'})
```

### Actions personnalisées

```python
from rest_framework.decorators import action

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    
    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        GET /api/staff/5/assignments/
        Retourne les affectations d'un staff spécifique
        """
        staff = self.get_object()
        assignments = staff.shift_assignments.all()
        serializer = ShiftAssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """
        GET /api/staff/active/
        Retourne tous les staff actifs
        """
        active_staff = Staff.objects.filter(is_active=True)
        serializer = self.get_serializer(active_staff, many=True)
        return Response(serializer.data)
```

---

## Permissions — Sécuriser l'API

```python
from rest_framework.permissions import IsAuthenticated, IsAdminUser

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer
    permission_classes = [IsAuthenticated]  # ← Doit être connecté

class ShiftAssignmentViewSet(viewsets.ModelViewSet):
    queryset = ShiftAssignment.objects.all()
    serializer_class = ShiftAssignmentSerializer
    permission_classes = [IsAdminUser]  # ← Doit être admin
```

---

## Exercice — Créer un ViewSet Avancé

**Contexte** : Tu dois créer un endpoint pour gérer les **congés** (absences).

**Spécifications** :
1. CRUD standard sur `/api/leaves/` (utilise le modèle `Absence` existant)
2. Endpoint `/api/leaves/pending/` → Liste des congés non approuvés
3. Endpoint POST `/api/leaves/5/approve/` → Approuver un congé
4. Override `create()` pour vérifier que le staff n'a pas déjà un congé sur ces dates

**À faire** :
```python
# Complète ce ViewSet
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from .models import Absence
from .serializers import AbsenceSerializer

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all()
    serializer_class = AbsenceSerializer
    
    # 1. Endpoint /api/leaves/pending/
    # Les absences avec actual_end_date IS NULL
    @action(detail=____, methods=[____])
    def pending(self, request):
        # À compléter
        pass
    
    # 2. Endpoint /api/leaves/5/approve/
    @action(detail=____, methods=[____])
    def approve(self, request, pk=None):
        leave = self.get_object()
        # Mettre actual_end_date = expected_end_date
        # À compléter
        pass
    
    # 3. Override create pour vérifier les chevauchements
    def create(self, request, *args, **kwargs):
        staff_id = request.data.get('staff')
        start_date = request.data.get('start_date')
        expected_end = request.data.get('expected_end_date')
        
        # Vérifier si chevauchement existant
        # À compléter
        
        return super().create(request, *args, **kwargs)
```

<details>
<summary>Solution complète</summary>

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from django.db.models import Q
from django.utils import timezone
from .models import Absence
from .serializers import AbsenceSerializer

class LeaveViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all()
    serializer_class = AbsenceSerializer
    
    # GET /api/leaves/pending/
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Congés en attente (pas encore terminés/confirmés)"""
        pending = Absence.objects.filter(
            actual_end_date__isnull=True,
            expected_end_date__gte=timezone.now().date()
        )
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
    
    # POST /api/leaves/5/approve/
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approuver un congé (marquer comme terminé avec les dates prévues)"""
        leave = self.get_object()
        
        if leave.actual_end_date:
            return Response(
                {'error': 'Leave already approved/ended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave.actual_end_date = leave.expected_end_date
        leave.save()
        
        serializer = self.get_serializer(leave)
        return Response({
            'status': 'leave approved',
            'leave': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        staff_id = request.data.get('staff')
        start_date = request.data.get('start_date')
        expected_end = request.data.get('expected_end_date')
        
        # Vérifier les chevauchements
        overlap = Absence.objects.filter(
            staff_id=staff_id,
            start_date__lte=expected_end,
            expected_end_date__gte=start_date
        ).filter(
            Q(actual_end_date__isnull=True) | 
            Q(actual_end_date__gte=start_date)
        ).exists()
        
        if overlap:
            raise ValidationError(
                'Staff already has a leave request overlapping these dates'
            )
        
        return super().create(request, *args, **kwargs)
```

**Router** :
```python
# urls.py
router.register(r'leaves', LeaveViewSet, basename='leave')
```

</details>

---

## Points Clés à Retenir

1. **ViewSet** = Regroupe CRUD + actions custom en une classe
2. **Router** = Génère URLs automatiquement
3. **`@action`** = Ajouter endpoints non-CRUD facilement
4. **`detail=True`** → URL contient l'ID (`/leaves/5/approve/`)
5. **`detail=False`** → URL sans ID (`/leaves/pending/`)
6. **Override** `get_queryset()`, `create()`, etc. pour personnaliser
