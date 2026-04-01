# 02 - Comprendre le Backend Django (API et Contraintes Dures)

Le Backend est le cœur décisionnel de la **Phase 2**. Il est codé en Python avec **Django REST Framework (DRF)**.

## 1. La Translation Entité-Relationnelle (ORM)
Observez le fichier `backend/api/models.py`. 
Ce fichier est le **miroir absolu** de `schema.sql`. Django s'appelle un ORM (Object-Relational Mapper). Au lieu d'écrire de longs `INSERT INTO shift` ou `SELECT * FROM staff`, nous manipulons des Objets Python.
- Une table SQL devient une `Class`.
- Une colonne devient un attribut de la Class (ex: `models.CharField`).
- Les Clés Étrangères (`FOREIGN KEY`) deviennent des `models.ForeignKey`.

## 2. Le Concept d'API REST
Le Backend ne renvoie pas des pages HTML avec du texte formaté, il renvoie des "données brutes" sous format JSON. 
Pour cela, nous avons créé des **Serializers** (`api/serializers.py`). Ils prennent par exemple une instance complexe de `Staff` de la base de données, la transforment en liste textuelle facile à lire pour le Frontend (React).

Nous avons également défini des **ViewSets** dans `api/views.py`. Un *ViewSet* génère automatiquement par magie les 5 protocoles HTTP majeurs pour l'entité :
- `GET /api/staff/` (Liste tous les staffs)
- `POST /api/staff/` (Créer un staff)
- `GET /api/staff/1/` (Récupérer le numéro 1)
- `PUT /api/staff/1/` (Mettre à jour)
- `DELETE /api/staff/1/` (Supprimer)

## 3. L'intelligence Métier (Les "Contraintes Dures")
L'exigence stipulait de bloquer toutes les affectations illégales. Comment avons-nous codé ça ?
Dans `views.py`, au niveau du `ShiftAssignmentViewSet`, nous avons intercepté (surchargé) la fonction `perform_create(self, serializer)`. 
C'est la fonction qui s'exécute **juste avant** la sauvegarde en BDD (`serializer.save()`).

Dans notre fonction maison `validate_assignment_hard_constraints`, on fait passer le SOIGNANT ciblé et le POSTE ciblé dans des rouleaux compresseurs :
```python
# Exemple de la vérification de certification
for certif in shift.required_certifications.all():
    has_certif = StaffCertification.objects.filter(
        staff=staff, certification=certif ...
    ).exists()
    if not has_certif:
        raise ValidationError("Interdit : Il manque le diplôme !")
```
Le code interroge la BDD (avec l'ORM `objects.filter()`) pour vérifier si l'étiquette requise est possédée. 
Si le test échoue, on lève une `ValidationError`. Le Backend va alors refuser de sauvegarder l'affectation et renvoyer une erreur `400 Bad Request` directement dans la face de l'interface Frontend !
