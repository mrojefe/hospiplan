# Tutoriel 06 : La Communication Réseau avec "Axios" 📡

Maintenant que vous comprenez React (Le Frontend) et Django (Le Backend). Il nous reste un mystère : **Comment nos deux programmes discutent-ils ?** Comment React demande-t-il la liste du personnel au serveur Python qui se trouve à des kilomètres de lui ?

C'est là qu'interviennent les fameuses "API" et un outil JavaScript nommé "Axios".

## 1. Qu'est-ce qu'une API REST ?
Imaginez l'API Django comme le guichet de la Poste. 
- Vous pouvez faire une requête **GET** (Je viens récupérer un colis).
- Vous pouvez faire une requête **POST** (Je dépose un nouveau colis pour l'envoyer).
- Vous pouvez faire une requête **DELETE** (Je veux annuler et jeter un colis).

Sur HospiPlan, quand on veut récupérer les médecins, on fait un `GET` sur la route du guichet : `http://127.0.0.1:8000/api/staff/`.

## 2. Qu'est ce qu'Axios ? (`src/api/client.js`)
Si l'API est le guichet de La Poste, alors **Axios** est le facteur qui prend notre lettre et qui roule en mobylette pour aller l'apporter au guichet !

Dans notre code central :
```javascript
export const api = {
  // Le facteur fait un GET sur l'url des soignants
  getStaff: () => apiClient.get('staff/'), 
  
  // Le facteur dépose un colis (POST) contenant les données (data) d'une affection
  createAssignment: (data) => apiClient.post('assignments/', data),
};
```

## 3. Comprendre le "Try / Catch"
Si vous allez dans le fichier `src/pages/AssignmentsPage.jsx`, vous verrez cette étrange structure :
```javascript
  try {
      await api.createAssignment(formData);
      // Afficher "Bravo" !
  } catch (err) {
      // Afficher l'erreur !
  }
```

**Pourquoi fait-on ça ?**
Parce que la mobylette d'Axios roule sur internet. Et sur Internet tout peut arriver : le serveur Python est planté, votre Wifi a sauté, ou l'Agent de l'Hôpital enfreint une règle des 48h par semaine ! 
- `try` signifie : "Essaie ce bout de code. Promets-moi d'essayer."
- `catch(err)` signifie : "Si à l'intérieur du `try` un incident se produit ou que Python repousse l'assignement, alors AU LIEU de faire exploser la page avec une erreur blanche de la mort, viens te cacher prudemment dans le `catch` !". Le texte `err` contient le message du serveur Python qu'on peut formater et afficher en beau rouge à l'utilisateur.

En résumé, sans Axios, pas de communication avec l'hôpital backend. Sans le bloc `try/catch`, pas de gestion d'erreur douce lorsque la médecin-chef viole les règles de plafonds d'heures !
