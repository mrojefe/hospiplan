# Tutoriel 05 : Comprendre les Custom Hooks React 🪝

Plongeons un peu plus au cœur de React. Si vous avez ouvert les fichiers dans `src/pages/`, vous avez sûrement vu ceci :
```javascript
const { data, loading, execute } = useFetch(api.getStaff);
```
Qu'est-ce que ce `useFetch` ? C'est un **Custom Hook** (Un crochet personnalisé). Et c'est la véritable puissance des React modernes.

## 1. La métaphore du "Serveur de Café"
Dans l'ancien React (avant 2019), quand on voulait télécharger la liste des Médecins sur internet, on devait écrire beaucoup de codes dans notre page : "S'il te plaît affiche un Sablier de chargement. Ensuite télécharge. S'il y a une erreur affiche là. Sinon enlève le Sablier et affiche la liste."
On le répétait sur **TOUTES** les pages !

Un **Custom Hook** (le `useFetch`), c'est comme engager un Assistant Personnel.
Vous lui donnez juste une mission (`api.getStaff`, qui veut dire "Va me chercher le staff"), et lui, il fait le sale boulot.
- Il met son gilet jaune (il passe `loading` à `true`).
- Il part chercher les données (`execute`).
- S'il trébuche, il ressort son pansement (il remplit `error`).
- S'il revient avec, il vous met les données dans les bras (dans `data`).

## 2. Déchiffrer `useFetch.js`
Allons ouvrir ce fameux fichier `frontend/src/hooks/useFetch.js` ensemble pour regarder sous le capot de votre assistant :

### `useState` (La mémoire locale)
```javascript
const [data, setData] = useState([]);
```
En React, si une variable normale (ex: `let age = 5`) change de valeur, l'écran ne se met pas à jour. Par contre, si une variable `useState` change sa valeur, **l'interface et l'ordinateur clignotent et repeignent immédiatement l'écran** ! On s'en sert pour retenir les choses qui doivent directement s'afficher devant l'utilisateur.

### `useEffect` (L'Effet Automatique)
Dans vos pages, vous verrez souvent ça :
```javascript
useEffect(() => {
    execute();
}, []);
```
En français, ça veut tout simplement dire : **"Quand cette page finit de s'afficher sur l'écran pour la toute PREMIÈRE fois, EXÉCUTE ('execute') ce bout de code une seule fois, puis arrête-toi."**

Si vous enlevez le `useEffect()`, votre page s'affichera, mais l'assistant ne partira jamais télécharger la donnée de l'Hôpital. Votre page restera vide pour toujours !
