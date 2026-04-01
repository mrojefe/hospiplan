# Tutoriel 03 : Comment Modifier le Projet Tout Seul (TP Pratique) 🛠️

Maintenant que vous avez les rudiments de Phase 1 (SQL) et Phase 2 (Django Python), vous voulez sûrement personnaliser HospiPlan ou ajouter vos propres idées au projet (sans avoir besoin de mon aide !).

Faisons un Travail Pratique (TP) étape par étape : 
**Objectif : Ajouter la colonne "Adresse Postale" au Staff de l'hôpital.**

## ÉTAPE 1 : Modifier le "Modèle" Python (Base de Données)
On ne touche plus au SQL brut (`db/schema.sql`). On modifie directement l'objet Python !
1. Ouvrez avec VS Code ou votre éditeur : `backend/api/models.py`.
2. Trouvez la classe `Staff` (vers la ligne 5).
3. Ajoutez cette nouvelle variable juste sous `email` ou `phone` :
```python
    address = models.CharField(max_length=500, null=True, blank=True)
```
*(Traduction : Un champ de texte (500 caractères), optionnel (null=True, blank=True)).*

## ÉTAPE 2 : Dire à Django de mettre à jour le SQL ("Makemigrations")
Vous venez d'ajouter une ligne en Python, mais votre fichier de Base de Données (`db.sqlite3`) ne le sait pas encore !
1. Ouvrez un terminal. Allez dans le dossier `backend/`.
2. Tapez la commande de magie bleue de Django :
```bash
python manage.py makemigrations
```
*(Le terminal écrira en vert : "Add field address to staff").*
3. Maintenant, exécutez la construction SQL :
```bash
python manage.py migrate
```
**Félicitations, la base de données vient d'accueillir la colonne `address` !**

## ÉTAPE 3 : Rendre la colonne visible pour le Frontend (Le Serializer)
Il faut mettre l'adresse dans "l'Assiette de JSON".
1. Ouvrez `backend/api/serializers.py`.
2. Parcourez le code pour trouver `StaffSerializer`.
3. Ajoutez l'adresse dans la liste des champs affichés (`fields`) :
```python
class StaffSerializer(serializers.ModelSerializer):
    class Meta:
        model = Staff
        # Ajoutez 'address' à la fin du tableau
        fields = ['id', 'first_name', 'last_name', 'email', 'phone', 'is_active', 'roles', 'address']
```

## ÉTAPE 4 : Afficher l'adresse sur le bel écran React (Frontend)
1. Ouvrez `frontend/src/components/Soignants.jsx`.
2. Trouvez l'en-tête du tableau en HTML (Ligne `<thead>...<th>`). Ajoutez-y la colonne "Adresse".
```html
<th style={{ padding: '1rem' }}>Adresse</th>
```
3. Descendez de quelques lignes pour trouver le `{staffList.map(s => ...)}` (L'endroit où le tableau se remplit tout seul de soignants).
4. Ajoutez la case ("Cellule de tableau" <td>) correspondante :
```html
<td style={{ padding: '1rem' }}>{s.address || 'Aucune'}</td>
```

## ÉTAPE FINALE : Testez !
Ouvrez (ou si c'était déjà le cas, regardez juste, Vite React se met à jour tout seul !) votre navigateur et allez sur `http://localhost:5173/`. 
**Magie, la colonne Adresse apparaît.** Votre hôpital est personnalisé.

---
> [!TIP]
> **Le Pouvoir du Full-Stack !**
> Bravo ! En une addition de 4 petites lignes de code sur 3 fichiers différents (Modèle, Serializer, Interface React), vous venez d'apprendre comment être un développeur Autonome sur la **Stack Complète (Full-Stack)**. Vous maîtrisez maintenant les bases du flux MVC !
