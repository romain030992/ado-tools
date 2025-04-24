import Component from '../base/component.js';
import ToastManager from '../base/toast-manager.js';

/**
 * Classe de base pour les composants de détails des fonctionnalités
 */
export default class FeatureDetailsBase extends Component {
  /**
   * Crée une instance de FeatureDetailsBase
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.config = props.config || {};
    this.featureKey = ''; // Doit être défini par les classes enfants
    this.originalValues = {};
  }
  /**
   * Rend le composant dans le conteneur
   */
  render() {
    this.container.innerHTML = '';
    
    // En-tête du composant
    this.renderHeader();
    
    // Corps du composant
    const body = this.createElement('div', { className: 'feature-details-body' });
    this.renderBody(body);
    this.container.appendChild(body);
    
    // Note: Nous ne rendons plus le pied de page avec les boutons
    // car nous utilisons l'autosave
    
    // Sauvegarder les valeurs originales pour la comparaison
    this.updateOriginalValues();
  }
  /**
   * Rend l'en-tête du composant
   */
  renderHeader() {
    const header = this.createElement('div', { className: 'feature-details-header' });
    
    // Titre
    const titleContainer = this.createElement('div', { className: 'feature-title-container' });
    const title = this.createElement('h2', {}, {}, this.getTitle());
    titleContainer.appendChild(title);
    
    // Description comme sous-titre
    const description = this.createElement('p', { className: 'feature-subtitle' }, {}, this.getDescription());
    titleContainer.appendChild(description);
    
    header.appendChild(titleContainer);
    
    this.container.appendChild(header);
  }

  /**
   * Rend le corps du composant
   * @param {HTMLElement} container - Conteneur pour le corps
   */
  renderBody(container) {
    // À implémenter par les classes enfants
    container.appendChild(this.createElement('p', {}, {}, 'Cette fonctionnalité n\'a pas encore de configuration.'));
  }

  /**
   * Rend le pied du composant
   */
  renderFooter() {
    const footer = this.createElement('div', { className: 'feature-details-footer' });
    
    // Bouton d'enregistrement
    const saveButton = this.createElement('button', {
      className: 'primary-button'
    }, {
      click: () => this.saveChanges()
    });
    
    const saveIcon = this.createElement('i', { className: 'fas fa-save' });
    saveButton.appendChild(saveIcon);
    saveButton.appendChild(document.createTextNode(' Enregistrer'));
    
    footer.appendChild(saveButton);
    
    // Bouton de réinitialisation
    const resetButton = this.createElement('button', {
      className: 'secondary-button'
    }, {
      click: () => this.resetChanges()
    });
    
    const resetIcon = this.createElement('i', { className: 'fas fa-undo' });
    resetButton.appendChild(resetIcon);
    resetButton.appendChild(document.createTextNode(' Réinitialiser'));
    
    footer.appendChild(resetButton);
    
    this.container.appendChild(footer);
  }

  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Détails de la fonctionnalité';
  }

  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Cette fonctionnalité permet de personnaliser le comportement de l\'extension.';
  }

  /**
   * Extrait les valeurs actuelles de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    // À implémenter par les classes enfants
    return {};
  }
  /**
   * Sauvegarde les modifications
   */
  saveChanges() {
    const values = this.extractValues();
    
    // Notifier le parent via le callback
    if (typeof this.props.onSave === 'function') {
      this.props.onSave(values);
      
      // Mettre à jour les valeurs originales après sauvegarde
      this.updateOriginalValues();
    }
  }
  
  /**
   * Sauvegarde les modifications avec debounce pour éviter les appels trop fréquents
   * @param {string} [id='default'] - Identifiant unique pour distinguer différents composants
   */
  debouncedSaveChanges(id = 'default') {
    // Utiliser un identifiant basé sur la clé de fonctionnalité si non spécifié
    const debounceId = id === 'default' ? `${this.featureKey}-save` : id;
    
    ToastManager.debounce(() => {
      this.saveChanges();
    }, 800, debounceId);
  }

  /**
   * Réinitialise les modifications
   */
  resetChanges() {
    // À implémenter par les classes enfants pour restaurer les valeurs originales
    this.render();
  }

  /**
   * Met à jour les valeurs originales pour la détection de changements
   */
  updateOriginalValues() {
    this.originalValues = this.extractValues();
  }

  /**
   * Vérifie s'il y a des changements non sauvegardés
   * @returns {boolean} - true s'il y a des changements non sauvegardés
   */
  hasUnsavedChanges() {
    const currentValues = this.extractValues();
    return JSON.stringify(currentValues) !== JSON.stringify(this.originalValues);
  }

  /**
   * Crée un switch on/off
   * @param {string} id - Identifiant unique
   * @param {boolean} checked - État initial
   * @param {Function} onChange - Fonction de callback
   * @param {string} label - Texte du label
   * @param {string} description - Description facultative
   * @returns {HTMLElement} - Conteneur du switch
   */
  createSwitch(id, checked, onChange, label, description = '') {
    const switchContainer = this.createElement('div', { className: 'switch-container' });
    
    // Label
    const switchLabel = this.createElement('label', {
      className: 'switch-label',
      for: id
    }, {}, label);
    
    // Switch
    const switchInput = this.createElement('input', {
      id,
      type: 'checkbox',
      className: 'switch-input',
      checked
    }, {
      change: onChange
    });
    
    const switchToggle = this.createElement('span', { className: 'switch-toggle' });
    
    switchContainer.appendChild(switchLabel);
    switchContainer.appendChild(switchInput);
    switchContainer.appendChild(switchToggle);
    
    // Description
    if (description) {
      const descElement = this.createElement('p', { 
        className: 'switch-description' 
      }, {}, description);
      switchContainer.appendChild(descElement);
    }
    
    return switchContainer;
  }

  /**
   * Crée un champ de texte
   * @param {string} id - Identifiant unique
   * @param {string} value - Valeur initiale
   * @param {Function} onChange - Fonction de callback
   * @param {string} label - Texte du label
   * @param {string} placeholder - Texte de placeholder
   * @param {string} description - Description facultative
   * @returns {HTMLElement} - Conteneur du champ de texte
   */
  createTextField(id, value, onChange, label, placeholder = '', description = '') {
    const fieldContainer = this.createElement('div', { className: 'field-container' });
    
    // Label
    const fieldLabel = this.createElement('label', {
      for: id,
      className: 'field-label'
    }, {}, label);
    fieldContainer.appendChild(fieldLabel);
    
    // Input
    const fieldInput = this.createElement('input', {
      id,
      type: 'text',
      value,
      placeholder
    }, {
      input: onChange
    });
    fieldContainer.appendChild(fieldInput);
    
    // Description
    if (description) {
      const descElement = this.createElement('p', { 
        className: 'field-description' 
      }, {}, description);
      fieldContainer.appendChild(descElement);
    }
    
    return fieldContainer;
  }

  /**
   * Crée un groupe d'options de sélection
   * @param {string} id - Identifiant unique
   * @param {string} value - Valeur sélectionnée
   * @param {Array} options - Options disponibles
   * @param {Function} onChange - Fonction de callback
   * @param {string} label - Texte du label
   * @param {string} description - Description facultative
   * @returns {HTMLElement} - Conteneur du groupe d'options
   */
  createRadioGroup(id, value, options, onChange, label, description = '') {
    const groupContainer = this.createElement('div', { className: 'radio-group-container' });
    
    // Label
    const groupLabel = this.createElement('label', {
      className: 'group-label'
    }, {}, label);
    groupContainer.appendChild(groupLabel);
    
    // Options container
    const optionsContainer = this.createElement('div', { className: 'radio-options' });
    
    // Options
    options.forEach((option, index) => {
      const optionId = `${id}-option-${index}`;
      
      const optionContainer = this.createElement('div', { className: 'radio-option' });
      
      const radioInput = this.createElement('input', {
        id: optionId,
        type: 'radio',
        name: id,
        value: option.value,
        checked: value === option.value
      }, {
        change: onChange
      });
      
      const radioLabel = this.createElement('label', {
        for: optionId
      }, {}, option.label);
      
      optionContainer.appendChild(radioInput);
      optionContainer.appendChild(radioLabel);
      optionsContainer.appendChild(optionContainer);
    });
    
    groupContainer.appendChild(optionsContainer);
    
    // Description
    if (description) {
      const descElement = this.createElement('p', { 
        className: 'field-description' 
      }, {}, description);
      groupContainer.appendChild(descElement);
    }
    
    return groupContainer;
  }

  /**
   * Crée un sélecteur de couleur
   * @param {string} id - Identifiant unique
   * @param {string} value - Valeur initiale (code couleur hex)
   * @param {Function} onChange - Fonction de callback
   * @param {string} label - Texte du label
   * @param {string} description - Description facultative
   * @returns {HTMLElement} - Conteneur du sélecteur de couleur
   */
  createColorPicker(id, value, onChange, label, description = '') {
    const colorContainer = this.createElement('div', { className: 'color-picker-container' });
    
    // Label
    const colorLabel = this.createElement('label', {
      for: id,
      className: 'field-label'
    }, {}, label);
    colorContainer.appendChild(colorLabel);
    
    // Input
    const colorInput = this.createElement('input', {
      id,
      type: 'color',
      value
    }, {
      input: onChange
    });
    colorContainer.appendChild(colorInput);
    
    // Preview
    const colorPreview = this.createElement('span', {
      className: 'color-preview',
      style: `background-color: ${value};`
    });
    colorContainer.appendChild(colorPreview);
    
    // Value text
    const colorValue = this.createElement('span', {
      className: 'color-value'
    }, {}, value);
    colorContainer.appendChild(colorValue);
    
    // Description
    if (description) {
      const descElement = this.createElement('p', { 
        className: 'field-description' 
      }, {}, description);
      colorContainer.appendChild(descElement);
    }
    
    return colorContainer;
  }

  /**
   * Crée un bouton de sauvegarde
   * @param {string} text - Texte du bouton
   * @returns {HTMLElement} - Bouton de sauvegarde
   */
  createSaveButton(text = 'Sauvegarder') {
    return this.createElement('button', {
      className: 'save-button primary-button'
    }, {
      click: () => this.saveChanges()
    }, text);
  }

  /**
   * Crée un champ de texte multiligne
   * @param {string} id - Identifiant unique
   * @param {string} value - Valeur initiale
   * @param {Function} onChange - Fonction de callback
   * @param {string} label - Texte du label
   * @param {string} placeholder - Texte de placeholder
   * @param {string} description - Description facultative
   * @returns {HTMLElement} - Conteneur du champ de texte multiligne
   */
  createTextArea(id, value, onChange, label, placeholder = '', description = '') {
    const textAreaContainer = this.createElement('div', { className: 'textarea-container' });
    
    // Label
    const textAreaLabel = this.createElement('label', {
      for: id,
      className: 'field-label'
    }, {}, label);
    textAreaContainer.appendChild(textAreaLabel);
    
    // Textarea
    const textArea = this.createElement('textarea', {
      id,
      placeholder,
      rows: 5
    }, {
      input: onChange
    }, value);
    textAreaContainer.appendChild(textArea);
    
    // Description
    if (description) {
      const descElement = this.createElement('p', { 
        className: 'field-description' 
      }, {}, description);
      textAreaContainer.appendChild(descElement);
    }
    
    return textAreaContainer;
  }
}