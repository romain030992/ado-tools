import FeatureDetailsBase from './feature-details-base.js';

/**
 * Composant pour l'édition des paramètres de filtrage rapide
 */
export default class QuickFilterDetails extends FeatureDetailsBase {
  /**
   * Constructeur du composant QuickFilterDetails
   * @param {HTMLElement} container - Conteneur du composant
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.featureKey = 'quick-filter';
  }
  
  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Filtrage rapide';
  }
  
  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Configurez les filtres pour accéder rapidement aux tâches par utilisateur.';
  }

  /**
   * Extrait les valeurs de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    const personList = this.elements.personList;
    
    if (!personList) {
      return this.props.config?.quickFilter || {};
    }
    
    const persons = [];
    personList.querySelectorAll('.person-item').forEach(item => {
      const nameInput = item.querySelector('input[type="text"]');
      
      if (nameInput && nameInput.value.trim()) {
        persons.push(nameInput.value.trim());
      }
    });
    
    return {
      enabled: this.props.config?.quickFilter?.enabled || false,
      persons
    };
  }
  
  /**
   * Rend le corps du composant
   * @param {HTMLElement} container - Conteneur pour le corps
   */
  renderBody(container) {
    const config = this.props.config?.quickFilter || {};
    
    // Activer/désactiver la fonctionnalité
    const enableSwitch = this.createSwitch(
      'quickFilterEnabled',
      config.enabled || false,
      e => this.handleToggleEnable(e.target.checked),
      'Activer le filtrage rapide',
      'Ajoute des boutons pour filtrer rapidement par personne'
    );
    container.appendChild(enableSwitch);
    
    // Liste des personnes
    const personList = this.createElement('div', { id: 'personList', className: 'person-list' });
    this.storeElement('personList', personList);
    container.appendChild(personList);
    
    // Ajouter les personnes existantes
    const persons = config.persons || [];
    persons.forEach(person => {
      this.addPersonItem(person);
    });
      // Bouton pour ajouter une personne
    const addPersonButton = this.createElement('button', {
      id: 'addPersonButton',
      className: 'add-button'
    }, {
      click: () => this.addPersonItem('', true) // Activer la sauvegarde automatique
    });
    
    const addIcon = this.createElement('i', { className: 'fas fa-plus' });
    addPersonButton.appendChild(addIcon);
    addPersonButton.appendChild(document.createTextNode(' Ajouter une personne'));
    
    container.appendChild(addPersonButton);
  }
  /**
   * Ajoute un élément de personne à la liste
   * @param {string} [name=''] - Nom de la personne
   * @param {boolean} [autoSave=false] - Si vrai, déclenche la sauvegarde automatiquement
   */
  addPersonItem(name = '', autoSave = false) {
    const personList = this.elements.personList;
    
    const personItem = this.createElement('div', { className: 'person-item' });
    
    // Champ pour le nom de la personne
    const nameInput = this.createElement('input', {
      type: 'text',
      value: name,
      placeholder: 'Nom de la personne'
    }, {
      // Déclencher la sauvegarde automatique lors de la modification
      input: () => this.debouncedSaveChanges(),
      change: () => this.debouncedSaveChanges(),
      blur: () => this.debouncedSaveChanges()
    });
    personItem.appendChild(nameInput);
    
    // Bouton de suppression
    const removeButton = this.createElement('button', {
      className: 'remove-button'
    }, {
      click: () => {
        personItem.remove();
        this.debouncedSaveChanges(); // Sauvegarde après suppression
      }
    });
    
    const removeIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    removeButton.appendChild(removeIcon);
    personItem.appendChild(removeButton);
    
    personList.appendChild(personItem);
    
    // Sauvegarder automatiquement si demandé
    if (autoSave) {
      this.debouncedSaveChanges();
    }
  }

  /**
   * Gère l'activation/désactivation de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleToggleEnable(enabled) {
    if (this.props.onFeatureToggle) {
      this.props.onFeatureToggle('quick-filter', enabled);
    }
  }
}