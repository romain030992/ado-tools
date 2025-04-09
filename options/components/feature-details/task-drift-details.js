import FeatureDetailsBase from './feature-details-base.js';

/**
 * Composant pour l'édition des paramètres de dérive des tâches
 */
export default class TaskDriftDetails extends FeatureDetailsBase {
  /**
   * Constructeur du composant TaskDriftDetails
   * @param {HTMLElement} container - Conteneur du composant
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.featureKey = 'task-drift';
  }
  
  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Dérive des tâches';
  }
  
  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Configurez les seuils et les couleurs pour visualiser la dérive entre l\'estimation initiale et le temps restant.';
  }

  /**
   * Extrait les valeurs de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    const noEstimateColor = this.elements.noEstimateColor?.value;
    const firstThreshold = this.elements.firstThreshold?.value;
    const firstThresholdColor = this.elements.firstThresholdColor?.value;
    const secondThreshold = this.elements.secondThreshold?.value;
    const secondThresholdColor = this.elements.secondThresholdColor?.value;
    const lastThresholdColor = this.elements.lastThresholdColor?.value;
    
    if (!noEstimateColor) {
      return this.props.config?.taskDrift || {};
    }
    
    return {
      enabled: this.props.config?.taskDrift?.enabled || false,
      noEstimateColor,
      firstThreshold: parseFloat(firstThreshold) || 0,
      firstThresholdColor,
      secondThreshold: parseFloat(secondThreshold) || 0,
      secondThresholdColor,
      lastThresholdColor
    };
  }
  
  /**
   * Rend le corps du composant
   * @param {HTMLElement} container - Conteneur pour le corps
   */
  renderBody(container) {
    const config = this.props.config?.taskDrift || {};
    
    // Activer/désactiver la fonctionnalité
    const enableSwitch = this.createSwitch(
      'taskDriftEnabled',
      config.enabled || false,
      e => this.handleToggleEnable(e.target.checked),
      'Activer la dérive des tâches',
      'Affiche des indicateurs visuels pour les tâches qui dévient de leur estimation initiale'
    );
    container.appendChild(enableSwitch);
    
    // Groupe pour la couleur si pas d'estimation
    const noEstimateGroup = this.createElement('div', { className: 'color-group' });
    
    const noEstimateLabel = this.createElement('label', {}, {}, 'Couleur si pas d\'estimation originale');
    noEstimateGroup.appendChild(noEstimateLabel);
    
    const noEstimateColor = this.createElement('input', {
      id: 'noEstimateColor',
      type: 'color',
      value: config.noEstimateColor || '#0000ff'
    });
    this.storeElement('noEstimateColor', noEstimateColor);
    noEstimateGroup.appendChild(noEstimateColor);
    container.appendChild(noEstimateGroup);
    
    // Premier seuil
    const firstThresholdGroup = this.createElement('div', { className: 'threshold-group' });
    const firstThresholdLabel = this.createElement('label', {}, {}, '≤');
    firstThresholdGroup.appendChild(firstThresholdLabel);
    
    const firstThreshold = this.createElement('input', {
      id: 'firstThreshold',
      type: 'number',
      value: config.firstThreshold || ''
    });
    this.storeElement('firstThreshold', firstThreshold);
    firstThresholdGroup.appendChild(firstThreshold);
    
    const firstThresholdColor = this.createElement('input', {
      id: 'firstThresholdColor',
      type: 'color',
      value: config.firstThresholdColor || '#00ff00'
    });
    this.storeElement('firstThresholdColor', firstThresholdColor);
    firstThresholdGroup.appendChild(firstThresholdColor);
    container.appendChild(firstThresholdGroup);
    
    // Second seuil
    const secondThresholdGroup = this.createElement('div', { className: 'threshold-group' });
    const secondThresholdLabel = this.createElement('label', {}, {}, '≤');
    secondThresholdGroup.appendChild(secondThresholdLabel);
    
    const secondThreshold = this.createElement('input', {
      id: 'secondThreshold',
      type: 'number',
      value: config.secondThreshold || ''
    });
    this.storeElement('secondThreshold', secondThreshold);
    secondThresholdGroup.appendChild(secondThreshold);
    
    const secondThresholdColor = this.createElement('input', {
      id: 'secondThresholdColor',
      type: 'color',
      value: config.secondThresholdColor || '#ffa500'
    });
    this.storeElement('secondThresholdColor', secondThresholdColor);
    secondThresholdGroup.appendChild(secondThresholdColor);
    container.appendChild(secondThresholdGroup);
    
    // Dernier seuil (au-delà du second seuil)
    const lastThresholdGroup = this.createElement('div', { className: 'threshold-group' });
    const lastThresholdLabel = this.createElement('label', {}, {}, '>');
    lastThresholdGroup.appendChild(lastThresholdLabel);
    
    const lastThresholdColor = this.createElement('input', {
      id: 'lastThresholdColor',
      type: 'color',
      value: config.lastThresholdColor || '#ff0000'
    });
    this.storeElement('lastThresholdColor', lastThresholdColor);
    lastThresholdGroup.appendChild(lastThresholdColor);
    container.appendChild(lastThresholdGroup);
  }

  /**
   * Gère l'activation/désactivation de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleToggleEnable(enabled) {
    if (this.props.onFeatureToggle) {
      this.props.onFeatureToggle('task-drift', enabled);
    }
  }
}