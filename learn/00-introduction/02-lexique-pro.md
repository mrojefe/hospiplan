# Lexique Technique Professionnel

Ce glossaire est ta **feuille de triche** pour comprendre chaque terme technique utilisé dans le projet.

---

## A — API & Architecture

### **API REST** (Representational State Transfer)
**Définition** : Interface de communication entre deux programmes via HTTP.

**Analgie** : Un serveur qui parle en JSON au lieu de renvoyer du HTML. Comme un garçon de café qui prend ta commande (requête) et rapporte ton plat (réponse).

**Exemple dans HospiPlan** :
```
GET  /api/staff/       → Liste des soignants (JSON)
POST /api/assignments/ → Créer une affectation
```

### **Endpoint**
**Définition** : Une URL spécifique d'une API qui réalise une action.

**Exemple** : `/api/staff/` est l'endpoint pour gérer les soignants.

---

## C — Clés & Contraintes

### **Clé Primaire (PK)**
**Définition** : Identifiant unique d'une ligne en base de données.

**Analogie** : Numéro de sécurité sociale — unique pour chaque personne.

**Exemple** : `staff.id = 42` identifie Marie Dupont de façon unique.

### **Clé Étrangère (FK)**
**Définition** : Champ qui référence la clé primaire d'une autre table (crée une relation).

**Analogie** : Le "numéro de dossier" sur un document qui pointe vers le classeur original.

**Exemple** : `shift.care_unit_id = 5` → Ce poste appartient à l'unité #5.

### **Contrainte dure (Hard Constraint)**
**Définition** : Règle métier qui **ne peut jamais** être violée. L'application refuse l'opération.

**Exemple HospiPlan** : Un soignant sans certification "Urgences" ne peut JAMAIS être affecté aux urgences.

### **Contrainte molle (Soft Constraint)**
**Définition** : Règle souhaitable mais violable si nécessaire. Le système essaie de les minimiser.

**Exemple HospiPlan** : Marie préfère les jours de semaine, mais peut travailler le weekend si aucun autre choix.

---

## D — Django & Database

### **ORM** (Object-Relational Mapping)
**Définition** : Couche qui traduit du code Python en requêtes SQL.

**Analogie** : Un interprète qui traduit ta pensée (Python) en langue étrangère (SQL) que la base de données comprend.

**Exemple** :
```python
# Python (ORM Django)
staff_list = Staff.objects.filter(is_active=True)

# Devient automatiquement en SQL :
# SELECT * FROM staff WHERE is_active = TRUE;
```

### **Migration**
**Définition** : Script Python qui modifie le schéma de la base de données (ajoute/modifie des tables).

**Analogie** : Un plan de rénovation d'appartement — il dit quels murs abattre, quelles pièces créer.

**Commande Django** :
```bash
python manage.py makemigrations  # Crée le plan de rénovation
python manage.py migrate         # Exécute la rénovation
```

### **QuerySet**
**Définition** : Collection d'objets récupérés de la base de données via l'ORM.

**Exemple** :
```python
assignments = ShiftAssignment.objects.filter(staff_id=42)  # QuerySet
```

---

## J — JSON & JavaScript

### **JSON** (JavaScript Object Notation)
**Définition** : Format de données texte utilisé pour échanger entre systèmes.

**Exemple** :
```json
{
  "id": 42,
  "first_name": "Marie",
  "last_name": "Dupont",
  "is_active": true
}
```

### **Hook React**
**Définition** : Fonction React qui permet d'accéder au state et au cycle de vie.

**Principaux hooks** :
- `useState` : Gérer des données qui changent (ex: contenu d'un formulaire)
- `useEffect` : Exécuter du code après le rendu (ex: appel API)

---

## M — Modèles & Many-to-Many

### **Modèle (Model)**
**Définition** : Classe Python qui représente une table SQL.

**Exemple** :
```python
class Staff(models.Model):
    first_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
```
→ Crée automatiquement la table `staff` avec colonnes `first_name`, `email`.

### **Many-to-Many (N:N)**
**Définition** : Relation où plusieurs entités A sont liées à plusieurs entités B.

**Analogie** : Des étudiants et des cours — un étudiant suit plusieurs cours, un cours a plusieurs étudiants.

**Exemple HospiPlan** : Un soignant peut avoir plusieurs rôles, un rôle peut être tenu par plusieurs soignants.

```python
class Role(models.Model):
    staff = models.ManyToManyField(Staff, db_table='staff_role')
```

---

## S — Sérializers & SQL

### **Serializer (DRF)**
**Définition** : Convertisseur entre objets Python et JSON (et inversement).

**Analogie** : Un traducteur qui transforme ton objet Python en format JSON compréhensible par le frontend.

**Exemple** :
```python
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        fields = ['id', 'first_name', 'last_name']
```

### **SQL** (Structured Query Language)
**Définition** : Langage pour interroger et manipuler les bases de données relationnelles.

**Exemples** :
```sql
SELECT * FROM staff WHERE is_active = TRUE;
INSERT INTO shift (start_datetime) VALUES ('2024-04-15 20:00:00');
```

### **SELECT FOR UPDATE**
**Définition** : Requête SQL qui verrouille des lignes pendant une transaction (empêche les accès concurrents).

**Analogie** : Réservation exclusive d'une place de parking — personne d'autre ne peut la prendre tant que tu ne libères pas.

**Exemple HospiPlan** :
```python
staff = Staff.objects.select_for_update().get(id=staff_id)
# Le staff #42 est verrouillé jusqu'à la fin de la transaction
```

---

## T — Transaction & Types

### **Transaction**
**Définition** : Groupe d'opérations SQL qui réussissent ensemble ou échouent ensemble (ACID).

**Analogie** : Un virement bancaire — débiter le compte A ET créditer le compte B, ou rien du tout.

**Exemple Django** :
```python
@transaction.atomic
def create_assignment():
    # Si une erreur survient ici, RIEN n'est enregistré en base
    assignment.save()
```

### **Type de garde (ShiftType)**
**Définition** : Catégorie de poste définissant sa durée et ses caractéristiques.

**Exemples** : Jour (8h), Nuit (12h), Week-end, Garde d'astreinte.

---

## Exercice de Révision

Associe chaque terme à sa définition correcte :

| Terme | Définition |
|-------|------------|
| ORM | A. Format d'échange de données |
| JSON | A. Format d'échange de données |
| Clé étrangère | B. Crée une relation entre tables |
| SELECT FOR UPDATE | C. Verrouille une ligne en base |
| Transaction | D. Traduit Python en SQL |
| Serializer | E. Groupe d'opérations atomiques |

<details>
<summary>Réponses</summary>

- ORM → D (Traduit Python en SQL)
- JSON → A (Format d'échange)
- Clé étrangère → B (Relation entre tables)
- SELECT FOR UPDATE → C (Verrouille une ligne)
- Transaction → E (Opérations atomiques)
- Serializer → F (Python ↔ JSON)

</details>
