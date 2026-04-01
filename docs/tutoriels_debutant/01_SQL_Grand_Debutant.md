# Tutoriel 01 : Les Bases de la Base de Données (SQL) 🗄️

Bienvenue dans ce premier guide conçu pour les grands débutants. Nous allons voir ici **comment comprendre la modélisation de notre hôpital**.

## 1. Qu'est-ce qu'une Base de Données (BDD) ?
Imaginez un fichier Excel géant. 
- La Base de Données, c'est le fichier Excel dans son ensemble.
- Chaque Feuille du fichier Excel s'appelle une **Table** (ex: `staff`, `absence`).
- Chaque colonne de la feuille s'appelle une **Colonne** ou un **Champ** (ex: `nom`, `age`).
- Chaque ligne correspond à un enregistrement unique (ex: ligne 1 : "Julien Dupont").

## 2. La Clé Primaire (Primary Key - PK)
Dans un hôpital, il peut y avoir deux "Julien Dupont". Pour que l'ordinateur ne se trompe jamais, on donne un **Numéro Unique** à chaque ligne.
C'est ça la **Primary Key (PK)**. Dans notre code SQL, vous verrez souvent :
```sql
CREATE TABLE staff ( 
    id SERIAL PRIMARY KEY,    -- C'est le numéro unique ! (1, 2, 3...)
    first_name VARCHAR(100)
);
```

## 3. La Clé Étrangère (Foreign Key - FK)
Comment dire que Julien Dupont (Numéro 5) travaille dans le département Cardiologie (Numéro 2) sans avoir à réécrire "Cardiologie" partout ?
On utilise une **Foreign Key**. Julien aura un champ `service_id = 2`.
C'est la magie du SQL (Bases de données Relationnelles), on lie les tables entre elles avec des numéros.
```sql
-- "REFERENCES" crée le lien mathématique entre la table (staff) et (service)
service_id INT REFERENCES service(id) 
```

## 4. Lire les Données (SELECT)
Quand vous ouvrez une table, vous voulez lire ("SELECTionner") les données.
```sql
-- "Affiche toutes (*) les colonnes de la table staff"
SELECT * FROM staff;

-- "Affiche juste le prénom et le mail des agents actifs"
SELECT first_name, email FROM staff WHERE is_active = true;
```

## 5. Croiser les Données (La jointure : JOIN)
C'est l'outil LE PLUS PUISSANT du SQL. 
Puisque Julien a le `service_id = 2`, et que la table `service` dit que l'ID 2 = "Cardiologie". Comment afficher "Julien - Cardiologie" d'un coup ?
Avec un **JOIN** :
```sql
SELECT staff.first_name, service.name 
FROM staff 
JOIN service ON staff.service_id = service.id;
```
*Traduction : Connecte-moi le staff avec le service, SEULEMENT aux endroits où leurs numéros (ID) correspondent parfaitement !*

---
> [!TIP]
> **Exercice Autonome**
> Essayez de changer (UPDATE) le numéro de téléphone du staff ID 1 directement dans le fichier `db/seed.sql` puis relancez le projet ! C'est la meilleure façon d'appendre.
