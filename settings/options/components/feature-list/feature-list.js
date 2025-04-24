import Component from '../base/component.js';

/**
 * Composant pour gérer la liste des fonctionnalités
 */
export default class FeatureList extends Component {
  /**
   * Crée une instance de FeatureList
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.selectedFeature = props.selectedFeature || '';
    this.config = props.config || {}; // S'assurer que config est au moins un objet vide
  }
  /**
   * Rend le composant dans le conteneur
   */  render() {
    this.container.innerHTML = '';

    // Header avec titre (similaire à la liste des configurations)
    const header = this.createElement('div', { className: 'feature-list-header' });
    
    // Titre
    const title = this.createElement('h2', {}, {}, 'Fonctionnalités');
    header.appendChild(title);
    
    this.container.appendChild(header);
    
    // Liste des fonctionnalités
    const featureList = this.createElement('ul', { className: 'feature-list' });
    this.storeElement('featureList', featureList);
    
    // S'assurer que this.config est défini
    const config = this.config || {};
    
    // Définition des fonctionnalités avec des safeguards pour éviter les erreurs d'accès aux propriétés
    const features = [
      { id: 'general', name: 'Général', icon: 'fa-cog', toggleable: false },
      { id: 'better-wiki', name: 'Wiki amélioré', icon: 'fa-book', toggleable: true, enabled: (config.betterWiki && config.betterWiki.enabled) || false },
      { id: 'quick-filter', name: 'Filtrage rapide', icon: 'fa-filter', toggleable: true, enabled: (config.quickFilter && config.quickFilter.enabled) || false },
      { id: 'status-aggregation', name: 'Agrégation de statut', icon: 'fa-chart-pie', toggleable: true, enabled: (config.statusAggregation && config.statusAggregation.enabled) || false },
      { id: 'task-drift', name: 'Dérive des tâches', icon: 'fa-tasks', toggleable: true, enabled: (config.taskDrift && config.taskDrift.enabled) || false }
    ];
    
    // Vérifier si aucune fonctionnalité n'est sélectionnée, sélectionner 'general' par défaut
    if (!this.selectedFeature) {
      this.selectedFeature = 'general';
    }
    
    // Créer un élément de liste pour chaque fonctionnalité
    features.forEach(feature => {
      const featureItem = this.createFeatureItem(feature);
      featureList.appendChild(featureItem);
    });
    
    this.container.appendChild(featureList);
    
    // Après le rendu, s'assurer qu'une fonctionnalité est sélectionnée visuellement
    setTimeout(() => {
      if (this.selectedFeature) {
        this.handleFeatureSelect(this.selectedFeature);
      }
    }, 0);
  }
  
  /**
   * Crée un élément pour une fonctionnalité
   * @param {Object} feature - Données de la fonctionnalité
   * @returns {HTMLElement} - Élément créé
   */  createFeatureItem(feature) {
    const isSelected = feature.id === this.selectedFeature;
    
    // Créer l'élément de liste cliquable simplifié
    const featureItem = this.createElement('li', {
      className: `feature-item ${isSelected ? 'selected' : ''} ${feature.toggleable ? 'has-toggle' : ''}`,
      'data-feature': feature.id
    }, {
      click: (e) => {
        // Ne pas réagir aux clics sur le toggle
        if (e.target.tagName === 'INPUT' || e.target.classList.contains('toggle-slider')) {
          return;
        }
        this.handleFeatureSelect(feature.id);
      }
    });
      // Icône directement dans l'élément principal
    const icon = this.createElement('i', { className: `fas ${feature.icon}` });
    featureItem.appendChild(icon);
    
    // Nom de la fonctionnalité (entre l'icône et le toggle)
    const featureName = this.createElement('span', { className: 'feature-name' }, {}, feature.name);
    featureItem.appendChild(featureName);

    // Toggle pour activer/désactiver la fonctionnalité (avant le titre pour qu'il apparaisse à droite avec le style flex)
    if (feature.toggleable) {
      const switchContainer = this.createElement('label', {
        className: 'toggle-container'
      });
      
      const switchInput = this.createElement('input', {
        type: 'checkbox',
        checked: feature.enabled
      }, {
        change: (e) => this.handleFeatureToggle(feature.id, e.target.checked)
      });
      
      const switchSlider = this.createElement('span', {
        className: 'toggle-slider'
      });
      
      switchContainer.appendChild(switchInput);
      switchContainer.appendChild(switchSlider);
      
      // Ajouter le toggle à la fin (pour qu'il soit à droite)
      featureItem.appendChild(switchContainer);
    }
    
    return featureItem;
  }
  
  /**
   * Gère la sélection d'une fonctionnalité
   * @param {string} featureId - Identifiant de la fonctionnalité
   */
  handleFeatureSelect(featureId) {
    // Mettre à jour l'état du composant
    this.selectedFeature = featureId;

    // Mettre à jour l'apparence des éléments de la liste
    const featureItems = this.getElement('featureList').querySelectorAll('.feature-item');
    featureItems.forEach(item => {
      if (item.dataset.feature === featureId) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });

    // Notifier le parent de la sélection
    if (typeof this.props.onFeatureSelect === 'function') {
      this.props.onFeatureSelect(featureId);
    }
  }
  
  /**
   * Gère l'activation/désactivation d'une fonctionnalité
   * @param {string} featureId - Identifiant de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleFeatureToggle(featureId, enabled) {
    // Notifier le parent du changement d'état
    if (typeof this.props.onFeatureToggle === 'function') {
      this.props.onFeatureToggle(featureId, enabled);
    }
  }
}