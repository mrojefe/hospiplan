# Tutoriel 04 : Comment Modifier le Frontend (Architecture Modulaire) 🧩

Vous remarquerez que le code source du Frontend (dans votre dossier `frontend/src`) n'est plus contenu dans 3 énormes fichiers illisibles de mille lignes. 

L'architecture vient d'être métamorphosée en quelque chose d'**Enterprise Grade**. C'est le principe des fameuses briques LEGO. Fini la peur de tout casser :

## 1. La Hiérarchie Absolue

Pour comprendre comment une page Web fonctionne, lisez cette cascade :

1. **`src/api/` (Le Réseau) :** Seul ce dossier a le droit de parler à Django. Si l'URL de votre hôpital change, vous changez `api/client.js` une seule fois, et toute l'app web est à jour !
2. **`src/hooks/` (L'État Mental) :** Contient la logique. Les hooks (ex: `useFetch`) retiennent les données "en mémoire" de votre ordinateur et disent "Chargement en cours... Ah c'est bon, voilà la donnée !".
3. **`src/components/ui/` (Les Tuiles Lego) :** Ce sont des composants bêtes ! Un composant bête comme `Button.jsx` ne fait rien, on lui dit : "Dessine du texte bleu en gras", et "Quand on te clique dessus, crie". C'est tout. C'est ça qui les rend "Hautement Réutilisables".
4. **`src/pages/` (La Notice de Montage) :** Une `Page` (ex: `StaffPage.jsx`) est intelligente. Elle prend l'État Mental (`useFetch`), prend les legos `ui` et assemble le tout : *Mets le Staff sur la table et met 3 boutons à côté*.

## 2. TP : Customiser un Bouton "Sans Rien Craindre"

Puisque les éléments sont déconnectés, **vous êtes protégé contre vous-même**. 

Mettez-vous au défi : Changez le design des tous les boutons de l'application !
1. Ouvrez `frontend/src/components/ui/Button.jsx`.
2. Dans ses attributs, changez ou ajoutez du CSS en dur ou des variables de design.
3. Sauvegardez le fichier.

**Magie :** Dans TOUTE l'application (Que ce soit dans Staff, Shifts, Assignements), les boutons ont tous changé d'apparence. La vue s'est mise à jour instantanément. C'est la beauté du composant modulable. 

## 3. Comprendre le Design Moderne (Aesthetics)
Vous remarquerez que le fichier `src/index.css` a été refondé :
- Une **Palette HSL** (Hue, Saturation, Lightness) vibrante : Un bleu SaaS (`--primary`) sombre, combiné à un fond très clair off-white (`--background`). Fini les couleurs tapent à l'œil d'urgence.
- **Micro-Animations** : Tous les événements interactifs (quand on passe sa souris sur un tableau ou on tape sur le clavier) déclenchent du *CSS Transition*, produisant cet "effet wow" où le site est doux comme du beurre.
- **La typographie System-UI :** Nous avons jeté la police par défaut classique pour une police professionnelle intégrée. Rien que vos libellés ont maintenant l'air sérieux et rassurants pour des cadres de l'hôpital Al Amal.
