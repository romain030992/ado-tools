import FeatureDetailsBase from './feature-details-base.js';

/**
 * Composant pour l'édition des paramètres de dérive des tâches
 * Interface améliorée avec sliders et visualisation du dégradé de couleurs
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
    container.className += ' task-drift-details';
    
    // Activer/désactiver la fonctionnalité
    const enableSwitch = this.createSwitch(
      'taskDriftEnabled',
      config.enabled || false,
      e => this.handleToggleEnable(e.target.checked),
      'Activer la dérive des tâches',
      'Affiche des indicateurs visuels pour les tâches qui dévient de leur estimation initiale'
    );
    container.appendChild(enableSwitch);

    // Section des seuils avec slider visuel
    const thresholdSection = this.createElement('div', { className: 'section' });
    
    const thresholdSectionTitle = this.createElement('h3', { className: 'section-title' }, {}, 'Configuration des seuils de dérive');
    thresholdSection.appendChild(thresholdSectionTitle);
    
    const thresholdSectionDescription = this.createElement('p', { className: 'section-description' }, {}, 
      'Définissez les seuils pour la dérive entre l\'estimation initiale et le temps restant. ' +
      'Les couleurs indiquent la gravité de la dérive.'
    );
    thresholdSection.appendChild(thresholdSectionDescription);
    
    // Première valeur : vert (moins de X%)
    const firstThresholdValue = config.firstThreshold || 10;
    // Seconde valeur : orange (entre X% et Y%)
    const secondThresholdValue = config.secondThreshold || 30;
    
    // Couleurs
    const firstColor = config.firstThresholdColor || '#00cc00';  // Vert
    const secondColor = config.secondThresholdColor || '#ff9900'; // Orange
    const lastColor = config.lastThresholdColor || '#ff0000';    // Rouge
    
    // Créer la section de configuration des seuils avec slider
    const sliderPanel = this.createElement('div', { className: 'panel' });
    
    // Gradient de couleur pour visualiser les seuils
    const gradientContainer = this.createElement('div', { className: 'slider-container' });
    
    // Créer le gradient de couleur
    const colorGradient = this.createElement('div', { 
      className: 'color-gradient',
      style: `background: linear-gradient(to right, ${firstColor} 0%, ${firstColor} ${firstThresholdValue}%, ${secondColor} ${firstThresholdValue}%, ${secondColor} ${secondThresholdValue}%, ${lastColor} ${secondThresholdValue}%, ${lastColor} 100%)`
    });
    gradientContainer.appendChild(colorGradient);
    
    // Premier marqueur de seuil
    const firstMarker = this.createElement('div', { 
      className: 'threshold-marker',
      style: `left: ${firstThresholdValue}%`
    });
    const firstMarkerValue = this.createElement('span', { className: 'threshold-value' }, {}, `${firstThresholdValue}%`);
    firstMarker.appendChild(firstMarkerValue);
    gradientContainer.appendChild(firstMarker);
    
    // Second marqueur de seuil
    const secondMarker = this.createElement('div', { 
      className: 'threshold-marker',
      style: `left: ${secondThresholdValue}%` 
    });
    const secondMarkerValue = this.createElement('span', { className: 'threshold-value' }, {}, `${secondThresholdValue}%`);
    secondMarker.appendChild(secondMarkerValue);
    gradientContainer.appendChild(secondMarker);
    
    sliderPanel.appendChild(gradientContainer);

    // Premier slider
    const firstSliderContainer = this.createElement('div', { className: 'slider-container' });
    const firstSliderLabel = this.createElement('label', {}, {}, 'Premier seuil (vert à orange)');
    firstSliderContainer.appendChild(firstSliderLabel);
    
    const firstSlider = this.createElement('input', {
      id: 'firstThreshold',
      className: 'threshold-slider',
      type: 'range',
      min: '0',
      max: '100',
      step: '1',
      value: firstThresholdValue
    }, {
      input: (e) => {
        const value = parseInt(e.target.value);
        const secondValue = parseInt(this.elements.secondThreshold.value);
        
        // Mettre à jour le marqueur visuel
        firstMarker.style.left = `${value}%`;
        firstMarkerValue.textContent = `${value}%`;
        
        // Empêcher le premier seuil de dépasser le second
        if (value >= secondValue) {
          e.target.value = secondValue - 1;
        }
        
        // Mettre à jour le gradient
        colorGradient.style.background = `linear-gradient(to right, ${firstColor} 0%, ${firstColor} ${value}%, ${secondColor} ${value}%, ${secondColor} ${secondValue}%, ${lastColor} ${secondValue}%, ${lastColor} 100%)`;
        
        this.debouncedSaveChanges();
      }
    });
    this.storeElement('firstThreshold', firstSlider);
    firstSliderContainer.appendChild(firstSlider);
    
    // Labels sous le slider
    const firstSliderLabels = this.createElement('div', { className: 'threshold-labels' });
    const firstSliderMinLabel = this.createElement('span', { className: 'threshold-label' }, {}, '0%');
    const firstSliderMaxLabel = this.createElement('span', { className: 'threshold-label' }, {}, '100%');
    firstSliderLabels.appendChild(firstSliderMinLabel);
    firstSliderLabels.appendChild(firstSliderMaxLabel);
    firstSliderContainer.appendChild(firstSliderLabels);
    
    sliderPanel.appendChild(firstSliderContainer);
    
    // Deuxième slider
    const secondSliderContainer = this.createElement('div', { className: 'slider-container' });
    const secondSliderLabel = this.createElement('label', {}, {}, 'Second seuil (orange à rouge)');
    secondSliderContainer.appendChild(secondSliderLabel);
    
    const secondSlider = this.createElement('input', {
      id: 'secondThreshold',
      className: 'threshold-slider',
      type: 'range',
      min: '0',
      max: '100',
      step: '1',
      value: secondThresholdValue
    }, {
      input: (e) => {
        const value = parseInt(e.target.value);
        const firstValue = parseInt(this.elements.firstThreshold.value);
        
        // Mettre à jour le marqueur visuel
        secondMarker.style.left = `${value}%`;
        secondMarkerValue.textContent = `${value}%`;
        
        // Empêcher le second seuil d'être inférieur au premier
        if (value <= firstValue) {
          e.target.value = firstValue + 1;
        }
        
        // Mettre à jour le gradient
        colorGradient.style.background = `linear-gradient(to right, ${firstColor} 0%, ${firstColor} ${firstValue}%, ${secondColor} ${firstValue}%, ${secondColor} ${value}%, ${lastColor} ${value}%, ${lastColor} 100%)`;
        
        this.debouncedSaveChanges();
      }
    });
    this.storeElement('secondThreshold', secondSlider);
    secondSliderContainer.appendChild(secondSlider);
    
    // Labels sous le slider
    const secondSliderLabels = this.createElement('div', { className: 'threshold-labels' });
    const secondSliderMinLabel = this.createElement('span', { className: 'threshold-label' }, {}, '0%');
    const secondSliderMaxLabel = this.createElement('span', { className: 'threshold-label' }, {}, '100%');
    secondSliderLabels.appendChild(secondSliderMinLabel);
    secondSliderLabels.appendChild(secondSliderMaxLabel);
    secondSliderContainer.appendChild(secondSliderLabels);
    
    sliderPanel.appendChild(secondSliderContainer);

    // Configuration des couleurs
    const colorConfigTitle = this.createElement('h3', { className: 'section-title' }, {}, 'Personnalisation des couleurs');
    sliderPanel.appendChild(colorConfigTitle);
    
    // Premier seuil (couleur verte)
    const firstColorConfig = this.createElement('div', { className: 'threshold-config' });
    
    const firstColorLabel = this.createElement('div', { className: 'threshold-config-label' }, {}, 'Faible dérive (< premier seuil)');
    firstColorConfig.appendChild(firstColorLabel);
    
    const firstColorPicker = this.createElement('input', {
      id: 'firstThresholdColor',
      className: 'threshold-config-color',
      type: 'color',
      value: firstColor
    }, {
      input: (e) => {
        const firstValue = parseInt(this.elements.firstThreshold.value);
        const secondValue = parseInt(this.elements.secondThreshold.value);
        
        // Mettre à jour la couleur dans le gradient
        colorGradient.style.background = `linear-gradient(to right, ${e.target.value} 0%, ${e.target.value} ${firstValue}%, ${this.elements.secondThresholdColor.value} ${firstValue}%, ${this.elements.secondThresholdColor.value} ${secondValue}%, ${this.elements.lastThresholdColor.value} ${secondValue}%, ${this.elements.lastThresholdColor.value} 100%)`;
        
        this.debouncedSaveChanges();
      }
    });
    this.storeElement('firstThresholdColor', firstColorPicker);
    firstColorConfig.appendChild(firstColorPicker);
    
    sliderPanel.appendChild(firstColorConfig);
    
    // Second seuil (couleur orange)
    const secondColorConfig = this.createElement('div', { className: 'threshold-config' });
    
    const secondColorLabel = this.createElement('div', { className: 'threshold-config-label' }, {}, 'Dérive modérée (entre les seuils)');
    secondColorConfig.appendChild(secondColorLabel);
    
    const secondColorPicker = this.createElement('input', {
      id: 'secondThresholdColor',
      className: 'threshold-config-color',
      type: 'color',
      value: secondColor
    }, {
      input: (e) => {
        const firstValue = parseInt(this.elements.firstThreshold.value);
        const secondValue = parseInt(this.elements.secondThreshold.value);
        
        // Mettre à jour la couleur dans le gradient
        colorGradient.style.background = `linear-gradient(to right, ${this.elements.firstThresholdColor.value} 0%, ${this.elements.firstThresholdColor.value} ${firstValue}%, ${e.target.value} ${firstValue}%, ${e.target.value} ${secondValue}%, ${this.elements.lastThresholdColor.value} ${secondValue}%, ${this.elements.lastThresholdColor.value} 100%)`;
        
        this.debouncedSaveChanges();
      }
    });
    this.storeElement('secondThresholdColor', secondColorPicker);
    secondColorConfig.appendChild(secondColorPicker);
    
    sliderPanel.appendChild(secondColorConfig);
    
    // Dernier seuil (couleur rouge)
    const lastColorConfig = this.createElement('div', { className: 'threshold-config' });
    
    const lastColorLabel = this.createElement('div', { className: 'threshold-config-label' }, {}, 'Dérive importante (> second seuil)');
    lastColorConfig.appendChild(lastColorLabel);
    
    const lastColorPicker = this.createElement('input', {
      id: 'lastThresholdColor',
      className: 'threshold-config-color',
      type: 'color',
      value: lastColor
    }, {
      input: (e) => {
        const firstValue = parseInt(this.elements.firstThreshold.value);
        const secondValue = parseInt(this.elements.secondThreshold.value);
        
        // Mettre à jour la couleur dans le gradient
        colorGradient.style.background = `linear-gradient(to right, ${this.elements.firstThresholdColor.value} 0%, ${this.elements.firstThresholdColor.value} ${firstValue}%, ${this.elements.secondThresholdColor.value} ${firstValue}%, ${this.elements.secondThresholdColor.value} ${secondValue}%, ${e.target.value} ${secondValue}%, ${e.target.value} 100%)`;
        
        this.debouncedSaveChanges();
      }
    });
    this.storeElement('lastThresholdColor', lastColorPicker);
    lastColorConfig.appendChild(lastColorPicker);
    
    sliderPanel.appendChild(lastColorConfig);
    
    // Configuration pour les tâches sans estimation
    const noEstimateConfig = this.createElement('div', { className: 'no-estimate-config' });
    
    const noEstimateTitle = this.createElement('h4', {}, {}, 'Tâches sans estimation');
    noEstimateConfig.appendChild(noEstimateTitle);
    
    const noEstimateDescription = this.createElement('p', { className: 'section-description' }, {}, 
      'Définissez la couleur pour les tâches qui n\'ont pas d\'estimation initiale'
    );
    noEstimateConfig.appendChild(noEstimateDescription);
    
    const noEstimateColorConfig = this.createElement('div', { className: 'threshold-config' });
    
    const noEstimateLabel = this.createElement('div', { className: 'threshold-config-label' }, {}, 'Couleur sans estimation');
    noEstimateColorConfig.appendChild(noEstimateLabel);
    
    const noEstimateColorPicker = this.createElement('input', {
      id: 'noEstimateColor',
      className: 'threshold-config-color',
      type: 'color',
      value: config.noEstimateColor || '#0000ff'
    }, {
      input: () => this.debouncedSaveChanges(),
      change: () => this.debouncedSaveChanges()
    });
    this.storeElement('noEstimateColor', noEstimateColorPicker);
    noEstimateColorConfig.appendChild(noEstimateColorPicker);
    
    noEstimateConfig.appendChild(noEstimateColorConfig);
    sliderPanel.appendChild(noEstimateConfig);
    
    thresholdSection.appendChild(sliderPanel);
    container.appendChild(thresholdSection);

    // Section d'exemples
    const examplesSection = this.createElement('div', { className: 'examples-section' });
    
    const examplesTitle = this.createElement('h3', { className: 'section-title' }, {}, 'Exemples');
    examplesSection.appendChild(examplesTitle);
    
    const examplesDescription = this.createElement('p', { className: 'section-description' }, {}, 
      'Voici des exemples de tâches avec différents niveaux de dérive'
    );
    examplesSection.appendChild(examplesDescription);
    
    // Conteneur pour les exemples
    const examplesContainer = this.createElement('div', { className: 'examples-container' });
    
    // Exemple 1 - Faible dérive
    const example1 = this.createExampleCard(
      'Mise à jour documentation', 
      firstColor, 
      'Estimation: 2h', 
      'Temps restant: 2.1h', 
      'Dérive: +5%'
    );
    examplesContainer.appendChild(example1);
    
    // Exemple 2 - Dérive modérée
    const example2 = this.createExampleCard(
      'Correction de bug UI', 
      secondColor, 
      'Estimation: 4h', 
      'Temps restant: 5.2h', 
      'Dérive: +30%'
    );
    examplesContainer.appendChild(example2);
    
    // Exemple 3 - Dérive importante
    const example3 = this.createExampleCard(
      'Implémentation API', 
      lastColor, 
      'Estimation: 8h', 
      'Temps restant: 16h', 
      'Dérive: +100%'
    );
    examplesContainer.appendChild(example3);
    
    // Exemple 4 - Sans estimation
    const example4 = this.createExampleCard(
      'Revue de code', 
      config.noEstimateColor || '#0000ff', 
      'Estimation: aucune', 
      'Temps restant: 3h', 
      'Dérive: non calculable'
    );
    examplesContainer.appendChild(example4);
    
    examplesSection.appendChild(examplesContainer);
    container.appendChild(examplesSection);
  }

  /**
   * Crée une carte d'exemple de dérive des tâches
   * @param {string} title - Titre de la tâche
   * @param {string} color - Couleur de l'indicateur
   * @param {string} estimate - Texte d'estimation
   * @param {string} remaining - Texte de temps restant
   * @param {string} drift - Texte de dérive
   * @returns {HTMLElement} - Élément créé
   */
  createExampleCard(title, color, estimate, remaining, drift) {
    const card = this.createElement('div', { className: 'example-card' });
    
    const header = this.createElement('div', { className: 'example-header' });
    const nameElement = this.createElement('div', { className: 'example-name' }, {}, title);
    
    const indicator = this.createElement('div', {
      className: 'example-indicator',
      style: `background-color: ${color}`
    });
    
    header.appendChild(nameElement);
    header.appendChild(indicator);
    card.appendChild(header);
    
    const details = this.createElement('div', { className: 'example-details' });
    
    // Estimation
    const estimateMetric = this.createElement('div', { className: 'example-metric' });
    const estimateLabel = this.createElement('span', { className: 'example-label' }, {}, estimate);
    estimateMetric.appendChild(estimateLabel);
    details.appendChild(estimateMetric);
    
    // Temps restant
    const remainingMetric = this.createElement('div', { className: 'example-metric' });
    const remainingLabel = this.createElement('span', { className: 'example-label' }, {}, remaining);
    remainingMetric.appendChild(remainingLabel);
    details.appendChild(remainingMetric);
    
    // Dérive
    const driftMetric = this.createElement('div', { className: 'example-metric' });
    const driftLabel = this.createElement('span', { className: 'example-label' }, {}, drift);
    driftMetric.appendChild(driftLabel);
    details.appendChild(driftMetric);
    
    card.appendChild(details);
    
    return card;
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