# Azure DevOps Sprint Backlog Tools

Extension Chrome qui améliore l'expérience utilisateur d'Azure DevOps avec des fonctionnalités supplémentaires pour les backlogs de sprint.

## Fonctionnalités

Cette extension ajoute plusieurs fonctionnalités à Azure DevOps :

1. **Agrégation par statut** - Affiche des totaux de story points par statut dans les backlogs
2. **Dérive des tâches** - Visualise la dérive entre l'estimation originale et le travail réel
3. **Filtre rapide** - Permet de filtrer les tâches par assignation lors des daily meetings
4. **Amélioration du Wiki** - Ajoute des templates personnalisés pour simplifier l'édition du wiki

## Architecture

L'extension utilise une architecture modulaire pour faciliter la maintenance et l'évolution du code :

### Structure des dossiers

```
ado-tools/
├── background/          # Scripts de fond pour l'extension
├── popup/               # Interface popup de l'extension
│   └── components/      # Composants réutilisables pour le popup
├── options/             # Page de configuration complète
│   └── components/      # Composants réutilisables pour les options
├── features/            # Fonctionnalités injectées dans les pages Azure DevOps
│   ├── core/            # Modules partagés par toutes les fonctionnalités
│   ├── status-aggregation/  # Fonctionnalité d'agrégation par statut
│   ├── task-drift/      # Fonctionnalité de dérive des tâches
│   ├── quick-filter/    # Fonctionnalité de filtre rapide
│   └── better-wiki/     # Fonctionnalité d'amélioration du wiki
└── libs/                # Bibliothèques externes
```

### Organisation du code

Chaque fonctionnalité suit la même structure :

- `index.js` : Point d'entrée principal de la fonctionnalité
- `helpers/` : Utilitaires spécifiques à la fonctionnalité
- `components/` : Composants UI réutilisables pour la fonctionnalité

### Comment ajouter une nouvelle fonctionnalité

1. Créer un nouveau dossier dans `features/` avec le nom de votre fonctionnalité
2. Créer un fichier `index.js` qui étend la classe `FeatureBase`
3. Implémenter la méthode `initFeature()` avec la logique spécifique
4. Ajouter les helpers et composants nécessaires dans les sous-dossiers appropriés
5. Mettre à jour `background.js` pour inclure la nouvelle fonctionnalité
6. Ajouter les options de configuration dans `options.js`

Exemple de structure pour une nouvelle fonctionnalité :

```javascript
import FeatureBase from '../core/feature-base.js';

class MyNewFeature extends FeatureBase {
  constructor(config) {
    super('myNewFeature', config);
  }

  initFeature() {
    // Logique d'initialisation spécifique
  }
}

chrome.runtime.onMessage.addListener((message) => {
  const config = message.config;
  if (!config?.myNewFeature?.enabled) return;
  
  const feature = new MyNewFeature(config);
  feature.init();
});

export default MyNewFeature;
```

## Installation et développement

1. Cloner ce dépôt
2. Ouvrir Chrome et aller à `chrome://extensions/`
3. Activer le "Mode développeur"
4. Cliquer sur "Charger l'extension non empaquetée" et sélectionner le dossier du projet
5. L'extension est maintenant installée et prête à être utilisée

## Configuration

Cliquez sur l'icône de l'extension pour ouvrir le popup, ou accédez aux options complètes pour configurer :

- Les projets et organisations Azure DevOps
- Les fonctionnalités à activer pour chaque projet
- Les paramètres spécifiques à chaque fonctionnalité