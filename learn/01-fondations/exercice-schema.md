# Exercice — Schéma de Données Avancé

## Contexte

L'hôpital Al Amal veut ajouter un système de **primes de garde** (suppléments pour nuits/week-ends/fêtes).

Tu dois modéliser :
1. Les types de primes possibles
2. Les primes appliquées à chaque shift
3. Le calcul automatique du montant

## Règles Métier

- Prime de **nuit** : +30% du salaire horaire
- Prime de **week-end** : +20%
- Prime de **jour férié** : +50%
- **Cumul possible** : Nuit + Week-end = +50% (30+20)
- **Plafond** : JAMAIS plus de +60% même avec toutes les primes

## Ta Mission

### Partie 1 — Modélisation (30 min)

Crée les modèles Django pour gérer ces primes.

**Tables nécessaires** :
- `bonus_type` : Types de primes (nuit, week-end, férié)
- `shift_bonus` : Liaison shift ↔ primes appliquées
- `bonus_rule` : Règles de calcul (% par type, plafond max)

**À réfléchir** :
- Comment stocker le % de chaque type ?
- Comment lier une prime à un shift ?
- Où stocker le plafond de 60% ?

### Partie 2 — Requêtes (20 min)

Écris les requêtes pour :
1. Lister tous les shifts avec primes pour avril 2024
2. Calculer le total des primes d'un staff sur un mois
3. Vérifier si un shift dépasse le plafond

---

## Corrigé Partie 1 — Modèles

<details>
<summary>Voir le corrigé modèles</summary>

```python
# models.py

class BonusType(models.Model):
    """Types de primes : Nuit, Week-end, Férié"""
    code = models.CharField(max_length=20, unique=True)  # 'NIGHT', 'WEEKEND'
    name = models.CharField(max_length=100)               # 'Prime de nuit'
    description = models.TextField(blank=True)
    
    class Meta:
        db_table = 'bonus_type'


class BonusRule(models.Model):
    """Règles de calcul des primes (paramétrables)"""
    bonus_type = models.ForeignKey(BonusType, on_delete=models.CASCADE)
    percentage = models.DecimalField(max_digits=5, decimal_places=2)  # 30.00 = 30%
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'bonus_rule'


class GlobalRule(models.Model):
    """Règles globales comme le plafond"""
    rule_type = models.CharField(max_length=50)  # 'MAX_BONUS_PERCENTAGE'
    value = models.DecimalField(max_digits=5, decimal_places=2)
    valid_from = models.DateField()
    valid_to = models.DateField(null=True, blank=True)
    
    class Meta:
        db_table = 'global_rule'


class ShiftBonus(models.Model):
    """Primes appliquées à un shift spécifique"""
    shift = models.ForeignKey(Shift, on_delete=models.CASCADE, related_name='bonuses')
    bonus_type = models.ForeignKey(BonusType, on_delete=models.CASCADE)
    calculated_percentage = models.DecimalField(max_digits=5, decimal_places=2)
    applied_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'shift_bonus'
        # Un shift ne peut avoir qu'une fois chaque type de prime
        unique_together = ['shift', 'bonus_type']
```

**Pourquoi cette structure ?**
- `BonusType` : Liste fixe des types (enum-like)
- `BonusRule` : Évolution dans le temps (% change selon les conventions)
- `ShiftBonus` : Instance concrète sur un shift donné
- `GlobalRule` : Stocke le plafond de 60%

</details>

---

## Corrigé Partie 2 — Requêtes

<details>
<summary>Voir le corrigé requêtes</summary>

```python
from django.db.models import Sum, F, Q
from decimal import Decimal

# 1. Shifts avec primes pour avril 2024
shifts_with_bonuses = Shift.objects.filter(
    start_datetime__year=2024,
    start_datetime__month=4,
    bonuses__isnull=False  # Au moins une prime
).distinct().prefetch_related('bonuses__bonus_type')


# 2. Total primes d'un staff sur un mois
# Méthode 1 : Via les shifts
staff_shifts = ShiftAssignment.objects.filter(
    staff=marie,
    shift__start_datetime__year=2024,
    shift__start_datetime__month=4
).select_related('shift')

total_bonus_percent = sum(
    shift.bonuses.aggregate(total=Sum('calculated_percentage'))['total'] or 0
    for shift in [a.shift for a in staff_shifts]
)


# 3. Vérifier si un shift dépasse le plafond
def check_bonus_cap(shift):
    """Retourne True si le plafond est respecté"""
    # Récupérer le plafond actuel
    cap_rule = GlobalRule.objects.filter(
        rule_type='MAX_BONUS_PERCENTAGE',
        valid_from__lte=shift.start_datetime.date(),
    ).filter(
        Q(valid_to__isnull=True) | Q(valid_to__gte=shift.start_datetime.date())
    ).first()
    
    cap = cap_rule.value if cap_rule else Decimal('60.00')
    
    # Calculer total des primes sur ce shift
    total = ShiftBonus.objects.filter(shift=shift).aggregate(
        total=Sum('calculated_percentage')
    )['total'] or Decimal('0')
    
    # Retourner le plus petit (plafonné)
    applied = min(total, cap)
    
    return {
        'raw_total': total,
        'capped_total': applied,
        'is_capped': total > cap,
        'cap': cap
    }


# Utilisation
result = check_bonus_cap(shift_nuit_weekend)
print(f"Total brut: {result['raw_total']}%")
print(f"Total plafonné: {result['capped_total']}%")
print(f"Plafond atteint: {result['is_capped']}")
```

</details>

---

## Bonus — Fonction de Calcul Complète

```python
def calculate_shift_bonus(shift, bonus_types_to_apply):
    """
    Calcule et applique les primes à un shift.
    
    Args:
        shift: Instance Shift
        bonus_types_to_apply: Liste de BonusType (ex: [night, weekend])
    
    Returns:
        dict: Détail du calcul
    """
    from django.db import transaction
    
    with transaction.atomic():
        # 1. Récupérer le plafond
        cap = GlobalRule.objects.filter(
            rule_type='MAX_BONUS_PERCENTAGE'
        ).first()
        max_percent = cap.value if cap else Decimal('60.00')
        
        # 2. Calculer brut
        raw_percent = Decimal('0')
        applied_bonuses = []
        
        for bonus_type in bonus_types_to_apply:
            rule = BonusRule.objects.filter(
                bonus_type=bonus_type,
                valid_from__lte=shift.start_datetime.date()
            ).first()
            
            if rule:
                raw_percent += rule.percentage
                applied_bonuses.append({
                    'type': bonus_type.code,
                    'percentage': rule.percentage
                })
        
        # 3. Appliquer plafond
        final_percent = min(raw_percent, max_percent)
        
        # 4. Créer les ShiftBonus
        for bonus in applied_bonuses:
            ShiftBonus.objects.create(
                shift=shift,
                bonus_type=BonusType.objects.get(code=bonus['type']),
                calculated_percentage=bonus['percentage']
            )
        
        return {
            'shift_id': shift.id,
            'raw_percentage': raw_percent,
            'final_percentage': final_percent,
            'capped': raw_percent > max_percent,
            'applied': applied_bonuses
        }
```

---

## Points Clés à Retenir

1. **Modélisation temporelle** : `valid_from` / `valid_to` permettent l'évolution des règles
2. **Découplage** : BonusType (fixe) vs BonusRule (évolutif) vs ShiftBonus (instance)
3. **Plafonnement** : Toujours calculer puis appliquer `min(total, cap)`
4. **Atomicité** : Utiliser `@transaction.atomic` pour les calculs complexes
