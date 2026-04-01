# Tutoriel 07 : Sécuriser la Base contre les Fantômes (Verrous) 🔐

Voici une des leçons de conception logicielle ("Software Architecture") les plus importantes pour votre vie professionnelle. On appelle ça le problème des **Race Conditions** (Les conflits d'accès).

## 1. La Métaphore de la Cabine d'Essayage
Imaginez qu'il n'y ait plus qu'une cabine d'essayage libre dans un magasin.
1. Le Client A demande "Est-ce que la cabine est libre ?". Le vendeur dit "Oui".
2. À la milliseconde près, le Client B (de l'autre bout du magasin) demande "Est-ce qu'elle est libre?". Un autre vendeur dit "Oui".
3. Les deux clients marchent, rentrent de force en même temps et tombent nez à nez.

Dans nos ordinateurs, c'est **pareil**.
Si deux Directeurs d'Hôpital se connectent au site et cliquent exactement à 12:00:00:01 sur l'Assignement du Médecin X :
- Le Serveur Python (Directeur A) va vérifier s'il a déjà une garde demain. La BDD répondra : "Non il a 0 garde".
- Le Serveur Python B (Directeur B 0,1s plus tard) va vérifier s'il a déjà une garde. La BDD répondra toujours : "Non il a 0 garde".
**Résultat :** Le médecin se retrouve illégalement mis sur 2 gardes simultanées !

## 2. Le Remède : `select_for_update()` dans Django
Allez inspecter le fichier `backend/api/views.py`. Vous allez y voir ceci :
```python
@transaction.atomic
def perform_create(self, serializer):
    # VERROU DE LA BDD (Anti Race-Condition)
    staff = Staff.objects.select_for_update().get(id=staff_id)
    # ... ensuite je vérifie les contraintes ...
```

C'est là la magie d'un **Verrou (Lock)**. On l'appelle un Verrou Pessimiste.
En SQL pur, cela se traduit par : `SELECT * FROM staff WHERE id = 5 FOR UPDATE;`

### Comment le verrou sauve le magasin :
1. Le Serveur A (Directeur A) demande à la BDD de verrouiller le Médecin X de façon "exécutive". Seul le Directeur A aura la permission de le manipuler le temps de son traitement.
2. Le Serveur B essaye au même moment de le manipuler.
3. **Le Python B tombe en file d'attente (Il attend).** Il dit "Ah zut, le serveur A me bloque l'accès".
4. Le Serveur A vérifie que X a 0 garde, l'enregistre à une garde et **Libère le verrou**.
5. Le Serveur B entre (le médecin X est libéré) et le vérifie : Mais cette fois, la base de de données lui dit : "Ah non, il a 1 garde ! Il ne peut pas prendre ton assignation !", et l'annule !

## 3. Qu'est-ce que `@transaction.atomic` ?
C'est le videur de la boîte de nuit. Un processus atomique, c'est du TOUT ou RIEN.
Si on écrit 500 validations logiques mais qu'à la dernière ligne une d'entre elle plante, la transaction **Rollback** : elle s'annule, comme si vous n'aviez jamais exécuté ce code.

Ces connaissances vous serviront de tremplin sur le monde professionnel du Backend. Vous ne ferez plus des jouets, mais des applications critiques robustes (Enterprise grade) comme celles construites avec la Stack de ce projet HospiPlan.
