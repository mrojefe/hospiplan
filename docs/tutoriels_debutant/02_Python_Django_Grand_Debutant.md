# Tutoriel 02 : Les Bases du Backend Python (Django) 🐍

Ce deuxième guide vous explique avec des mots simples comment fonctionne notre moteur (l'API Backend). Partons du principe que vous n'avez fait qu'une initiation au Python.

## 1. L'Analogie du Restaurant
Un serveur web (le Backend Django) fonctionne exactement comme le personnel d'un restaurant :
1. **L'URL (Le Serveur)** : Le client arrive et passe une commande au serveur (ex: "Je veux la liste du Staff"). Le serveur sait vers qui se tourner, c'est le fichier **`urls.py`**.
2. **La Vue (Le Chef Cuisinier)** : Le fichier **`views.py`** reçoit la commande. Il cherche dans le frigo, mélange les ingrédients (les données de la BDD). C'est LÀ qu'on écrit toutes les vérifications ("Ah non, il n'a pas le droit d'avoir ce plat car il est allergique/non-certifié !").
3. **Le Modèle (L'Inventaire du Frigo)** : Le fichier **`models.py`** représente la structure du frigo. Ce sont exactement les tables SQL, mais écrites en Python !
4. **Le Sérialiseur (L'Assiette de Présentation)** : Le fichier **`serializers.py`** prend les données froides de la BDD et les présente sous la forme d'un joli JSON (un texte formaté) que le Frontend React recevra comme une belle assiette !

---

## 2. Décortiquer `models.py` (L'ORM)
L'ORM (Object Relational Mapping), c'est l'outil magique de Django. 
Grâce à lui, **vous n'avez plus besoin d'écrire du code SQL**.

Si on veut créer une table pour enregistrer les animaux de compagnie de l'hôpital en BDD :
**En SQL (Phase 1) on ferait :**
```sql
CREATE TABLE animal (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);
```

**En Django (Phase 2), on fait tout simplement en Python :**
```python
class Animal(models.Model):
    name = models.CharField(max_length=50)
```
Django lit cette classe Python et **génère TOUT SEUL** le script SQL de création quand on tape la fameuse commande `python manage.py makemigrations` !

---

## 3. Décortiquer `views.py` (La logique Métier)
En Phase 2, on devait empêcher qu'une garde se chevauche.
Dans Python, pour interroger la base Django, c'est très facile : 
Au lieu d'écrire `SELECT * FROM shift_assignment WHERE staff_id = 5`, on écrit :

```python
// Python
mes_gardes = ShiftAssignment.objects.filter(staff_id=5)
```

Dans notre code de validation, si on veut déclencher une alerte, on utilise la notion d'erreur (Exception) de Python :
```python
# Si j'ai trouvé une garde à ce moment là...
if chevauchement == True:
    raise ValidationError("Attention, affectation interdite !")
```
L'instruction `raise` (lever une erreur) stoppe immédiatement l'exécution du site web et empêche l'enregistrement fautif.
