# 04 - Regard Critique sur l'Architecture (Limites et Dangers)

Le cahier des charges de la **Phase 1** et **Phase 2** (avec le schéma imposé des 24 tables) propose une excellente structure académique. Cependant, dans un contexte de déploiement "Réel" pour un véritable hôpital complexe tournant 24h/24 comme Al Amal, cette architecture présente des failles béantes que tout ingénieur/architecte technique se doit d'identifier. 

Voici un audit critique de la base de code actuelle et de la modélisation, avec des pistes de solutions.

## 1. La Faille de Concurrence (Race Conditions) de la Phase 2
Dans notre API Django (Phase 2), la vérification des **Contraintes Dures** (ex: Empêcher un soignant d'avoir un chevauchement horaire) est faite au niveau applicatif (en code Python) avant de faire la commande `save()`.

**Le Problème :** Si deux managers (Manager A et Manager B) cliquent sur "Affecter" exactement à la même milliseconde pour le même médecin, les deux instances Django de notre serveur vont lire la base au *même moment*.
- Serveur A : "Combien de gardes a Dupont demain ?" -> Réponse : 0.
- Serveur B : "Combien de gardes a Dupont demain ?" -> Réponse : 0.
- Serveur A : "D'accord, j'enregistre au Shift 1."
- Serveur B : "D'accord, j'enregistre au Shift 2."

**Résultat** : Un médecin est affecté à deux postes simultanés malgré notre grosse boucle `.filter(...)`. 
**Solution d'Architecture :** Les contraintes de chevauchement temporel ne doivent **jamais** être uniquement gérées au niveau script. Il faut utiliser les contraintes `EXCLUDE` (PostgreSQL) directement en base, ou poser un verrou de base de données (`SELECT FOR UPDATE`) en Python.

## 2. Le Dangereux Choix des `CASCADE` (Perte d'Audit)
Dans le Script SQL (Phase 1), beaucoup de liens clés (ex: de `shift` vers `shift_assignment`) sont montés avec `ON DELETE CASCADE`.
**Le Problème :** Si un administrateur supprime accidentellement ou intentionnellement un `Shift` (poste), **toutes** les affectations, historiques, et heures travaillées du personnel liés à ce poste sont instantanément vaporisées de la base. Dans la santé, c'est illégal. L'historique d'affectation doit être immuable pour des raisons médicolégales (Assurances, Erreurs médicales, Paye).
**Solution d'Architecture :** Il faut remplacer les Deletes par des **Soft Deletes**. On n'efface jamais une ligne, on ajoute une colonne `deleted_at (TIMESTAMP)` qu'on met à jour, et toutes les requêtes (`SELECT`) filtrent `WHERE deleted_at IS NULL`.

## 3. Le "Faux Paramétrage" (Table `Rule`)
Le cahier des charges impose une table de "règles configurables" (Table `rule`) pour ne pas hardcoder les valeurs. C’est le Saint-Graal en théorie.
**Le Problème :** En pratique (Phase 2), si la valeur du repos (11h) est bien lue en BDD, le **nom de la règle** (`REST_TIME_POST_NIGHT`) est "Hardcodé" en gros dans le Python. 
Si le chef de service renomme accidentellement la règle en base (`TEMPS_REPOS_NUIT`), le code backend plantera silencieusement en renseignant la valeur par défaut. On a juste déplacé la dette technique du "code" vers les "données en base".
**Solution d'Architecture :** Les règles complexes (comme des calculs d'heures dynamiques avec fenêtres glissantes) passent mieux avec un vrai moteur de règles symbolique (Moteur de Règles Métier : *Drools*, *Business Rule Engine Python*) plutôt qu'une bête table stockant la clé `MAX_HOURS = 48`.

## 4. La Performance des Enregistrements Temporels
L'utilisation de `start_date` et `end_date` partout (`contract`, `service_assignment`, `absence`) est la bonne approche (Pattern: *Temporal Property* / *SCD Type 2*).
**Le Problème :** Après 10 ans d'activité, un employé aura des dizaines de contrats et centaines d'absences dans la base complète. Interroger "Quel est le contrat en cours de Jean aujourd'hui ?" oblige la base à trier tout ça et exécuter la condition lente : `end_date IS NULL OR end_date > CURRENT_DATE`.
**Solution d'Architecture :** La création immédiate d'**Index Partiels** (Partial Indexes dans PostgreSQL) uniquement sur les lignes actives :
`CREATE INDEX idx_active_contract ON contract(staff_id) WHERE end_date IS NULL;`
Cela garantira une réponse en O(1) pour l'API même avec des millions de lignes d'historique !

## Conclusion
Le modèle des 24 tables de la Phase 1 est un tremplin solide pour un MVP (Minimum Viable Product). Mais la Phase 2 nous démontre les faiblesses d'appliquer aveuglément des "Règles Métier" dans le code backend sans utiliser les systèmes défensifs de PostgreSQL. Pour la **Phase 3** (L'algorithme de génération de Planning), on risque d'exposer d'autant plus les problèmes de performance dus à l'absence de certains index sur la base !
