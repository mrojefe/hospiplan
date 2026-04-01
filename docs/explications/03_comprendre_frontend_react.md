# 03 - Comprendre le Frontend React (Interface Visuelle)

Le Frontend est la **Phase 2 (Visuelle)**. Le code réside dans le répertoire `frontend/src/`. Il est codé en Javascript modern et en React via Vite.

## 1. Comment React crée des Pages ?
Contrairement aux sites web "à l'ancienne" où l'on change de fichier `.html` en cliquant sur un lien (ex: `index.html` puis `contact.html`), React est une **SPA (Single Page Application)**.
Dans notre code `App.jsx`, la librairie `react-router-dom` analyse la barre URL (`/soignants`, `/affectations`) et vient brancher (*Mount*) un *Composant Visuel* (`<Soignants />`, `<Affectations />`) au milieu de l'écran SANS raffraîchir (recharger) la page (le fameux bouton de refresh (F5)). 

C'est pourquoi `Navbar` est écrit en "dur" en haut de `App.jsx` ; il ne se recharge jamais pendant la navigation. Il reste persistant en mémoire. 

## 2. Axios et le Lien "Frontend <-> Backend"
Par exemple, dans le composant `Soignants.jsx`, on veut lister le staff.
Le Frontend n'est qu'un écran vide au chargement ("Render initial").
Pour afficher les prénoms, on utilise cet effet au démarrage : 
```javascript
  import axios from 'axios';
  
  useEffect(() => {
    fetchStaff();
  }, []); // [] veut dire "Lancer ceci une seule fois au chargement de la vue"
```

Où est défini `fetchStaff()` ? Juste au-dessous :
```javascript
const fetchStaff = async () => {
    const response = await axios.get('http://127.0.0.1:8000/api/staff/');
    setStaffList(response.data);
};
```
Et boom ! L'application web React tire un fil (une *Requête HTTP GET*) vers l'usine (Notre super API Django de l'étape N°2) pour rapatrier le précieux JSON de réponses contenant nos agents de santé en base SQLite. `setStaffList()` charge ces données dans le code local, et l'écran se met à jour pour créer le joli tableau de membres du Staff !

## 3. Le Refus "Puni" (Gestion d'Erreur dans `Affectations.jsx`)
Que se passe-t-il si Amadou Diop (Stagiaire) tente d'être assigné en Réanimation de Nuit (Requérant Certification ACLS et Refus d'être Stagiaire ?).
Vous souvenez-vous que le Django renvoie l'erreur 400 Bad Request ? Regardons le Submit du formulaire dans React :
```javascript
const handleSubmit = async (e) => {
    try {
      await axios.post('http://127.0.0.1:8000/api/assignments/', formData);
      setSuccess("Génial !");
    } catch (err) {
      // LE BACKEND VOUS A REJETÉ
      const msg = err.response.data.detail || "Illégal !";
      setError(msg); // Affichera un beau carré d'Alerte Rouge dans l'écran React
    }
};
```
L'interface réagit en affichant l'erreur (dans une balise spéciale `alert-error`), empêchant doucement l'utilisateur de continuer, respectant complètement les conditions de réussite du projet !
