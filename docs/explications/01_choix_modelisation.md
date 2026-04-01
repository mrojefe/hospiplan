# 01 - Comprendre les Choix de Modélisation (Base de Données)

Ce document explique pourquoi le schéma à 24 tables (en anglais) de votre professeur est architecturé de cette manière. C'est l'essence même de la **Phase 1**.

## 1. La Hiérarchie Récursive (Adjacency List)
Dans la table `specialty`, on retrouve une colonne `parent_id` qui référence l'ID de la même table `specialty`.
**Pourquoi ?** 
Cela permet de créer une arborescence (une branche) infinie de spécialités sans avoir à créer une table `sous_specialite`, `sous_sous_specialite` etc. Par exemple :
- ID 1 : Médecine Générale (parent_id: NULL)
- ID 2 : Cardiologie (parent_id: NULL)
- ID 3 : Cardiologie Pédiatrique (parent_id: 2)

## 2. Le Polymorphisme et la Séparation des Rôles
Plutôt que d'avoir une table `Medecin` et une table `Infirmier` distinctes, l'architecture a fait le choix d'avoir une seule table `staff` (les informations physiques de la personne : nom, prénom, email), et une table **N_à_N** (ManyToMany) `staff_role`.
**Pourquoi ?**
Dans le monde médical réel, une personne peut changer de rôle (ex: une aide-soignante qui devient infirmière après ses études, ou un infirmier qui est à ½ temps soignant et ½ temps cadre manager). Cette modélisation offre une incroyable robustesse face aux évolutions de carrière.

## 3. Le Patron de Conception "Temporal Property"
Avez-vous remarqué que les absences (`absence`), l'appartenance à un service (`staff_service_assignment`) et même les contrats (`contract`) possèdent tous un `start_date` et un `end_date` ?
C'est ce qu'on appelle "historisation par intervalles". Au lieu d'écraser (UPDATE) le service d'origine lorsqu'un agent est muté, on ajoute une NOUVELLE ligne avec son nouveau service, et on met la date de fin (`end_date`) sur l'ancienne ligne.
- Avantage 1 : Si un soignant mute en 2024, le reporting (*Requête Q-02*) de 2023 rattachera bien ses heures générées à son ANCIEN service.
- Avantage 2 : Un `end_date` qui vaut `NULL` veut tout simplement dire "C'est la situation en cours".

## 4. La Flexibilité des Contraintes (Table `rule`)
La présence de la table `rule` (qui contient des colonnes comme `rule_type`, `value` et `unit`) est une pratique très professionnelle. 
Au lieu de coder "11 heures de repos" ou "48h max" directement dans le code source de l'application (en "dur"), on lit cette variable en base de données. 
S'il y a un changement de convention collective, il suffira de mettre à jour cette ligne dans la base, **sans recompiler ou redéployer le code**. C'est l'essence du *paramétrage logiciel*.
