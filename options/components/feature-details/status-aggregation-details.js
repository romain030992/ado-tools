import FeatureDetailsBase from './feature-details-base.js';
import ToastManager from '../base/toast-manager.js';

/**
 * Composant pour l'édition des paramètres d'agrégation par statut
 */
export default class StatusAggregationDetails extends FeatureDetailsBase {
  /**
   * Constructeur du composant StatusAggregationDetails
   * @param {HTMLElement} container - Conteneur du composant
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.featureKey = 'status-aggregation';
  }
  
  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Agrégation par statut';
  }
  
  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Configurez l\'agrégation des tâches par statut avec des codes couleur personnalisés.';
  }

  /**
   * Extrait les valeurs de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    const columnName = this.elements.columnName?.value;
    const statusList = this.elements.statusList;
    
    if (!columnName || !statusList) {
      return this.props.config?.statusAggregation || {};
    }
    
    const statuses = [];
    statusList.querySelectorAll('.status-item').forEach(item => {
      const nameInput = item.querySelector('input[type="text"]');
      const colorInput = item.querySelector('input[type="color"]');
      
      if (nameInput && colorInput && nameInput.value.trim()) {
        statuses.push({
          name: nameInput.value.trim(),
          color: colorInput.value
        });
      }
    });
    
    return {
      enabled: this.props.config?.statusAggregation?.enabled || false,
      columnName: columnName.trim(),
      statuses
    };
  }
  
  /**
   * Rend le corps du composant
   * @param {HTMLElement} container - Conteneur pour le corps
   */
  renderBody(container) {
    const config = this.props.config?.statusAggregation || {};
    
    // Activer/désactiver la fonctionnalité
    const enableSwitch = this.createSwitch(
      'statusAggregationEnabled',
      config.enabled || false,
      e => this.handleToggleEnable(e.target.checked),
      'Activer l\'agrégation par statut',
      'Affiche des indicateurs de statut agrégés sur le backlog'
    );
    container.appendChild(enableSwitch);
    
    // Champ pour le nom de la colonne
    const columnNameGroup = this.createElement('div', { className: 'field-container' });
    const columnNameLabel = this.createElement('label', { for: 'columnName' }, {}, 'Colonne à agréger');
    columnNameGroup.appendChild(columnNameLabel);
    
    const columnNameInput = this.createElement('input', {
      id: 'columnName',
      type: 'text',
      value: config.columnName || '',
      placeholder: 'Nom de la colonne'
    });
    this.storeElement('columnName', columnNameInput);
    columnNameGroup.appendChild(columnNameInput);
    container.appendChild(columnNameGroup);
    
    // Liste des statuts
    const statusList = this.createElement('div', { id: 'statusList', className: 'status-list' });
    this.storeElement('statusList', statusList);
    container.appendChild(statusList);
    
    // Ajouter les statuts existants
    const statuses = config.statuses || [];
    statuses.forEach(status => {
      this.addStatusItem(status.name, status.color);
    });
      // Bouton pour ajouter un statut
    const addStatusButton = this.createElement('button', {
      id: 'addStatusButton',
      className: 'add-button'
    }, {
      click: () => this.addStatusItem('', '#000000', true) // Activer la sauvegarde automatique
    }, 'Ajouter un statut');
    container.appendChild(addStatusButton);
  }  /**
   * Ajoute un élément de statut à la liste
   * @param {string} [name=''] - Nom du statut
   * @param {string} [color='#000000'] - Couleur du statut
   * @param {boolean} [autoSave=false] - Si vrai, déclenche la sauvegarde automatiquement
   */  /**
   * Sauvegarde les modifications avec debounce pour éviter les appels trop fréquents
   */
  debouncedSaveChanges() {
    // Utiliser un identifiant unique pour ce composant
    ToastManager.debounce(() => {
      this.saveChanges();
    }, 800, 'status-aggregation-save');
  }
  
  addStatusItem(name = '', color = '#000000', autoSave = false) {
    const statusList = this.elements.statusList;
    
    const statusItem = this.createElement('div', { className: 'status-item' });
    
    // Champ pour le nom du statut
    const nameInput = this.createElement('input', {
      type: 'text',
      value: name,
      placeholder: 'Nom du statut'
    }, {
      // Déclencher la sauvegarde à la fin de la modification du nom, avec debounce
      input: () => this.debouncedSaveChanges(),
      blur: () => this.debouncedSaveChanges()
    });
    statusItem.appendChild(nameInput);
    
    // Sélecteur de couleur
    const colorInput = this.createElement('input', {
      type: 'color',
      value: color
    }, {
      // Déclencher la sauvegarde lors du changement de couleur, avec debounce
      input: () => this.debouncedSaveChanges(),
      change: () => this.debouncedSaveChanges()
    });
    statusItem.appendChild(colorInput);
    
    // Bouton de suppression
    const removeButton = this.createElement('button', {
      className: 'remove-button'
    }, {
      click: () => {
        statusItem.remove();
        // Pas de debounce pour la suppression, car c'est une action unique
        this.saveChanges();
      }
    });
    
    const removeIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    removeButton.appendChild(removeIcon);
    statusItem.appendChild(removeButton);
    
    statusList.appendChild(statusItem);
    
    // Sauvegarder automatiquement si demandé, sans debounce car c'est une action unique
    if (autoSave) {
      this.saveChanges();
    }
  }

  /**
   * Gère l'activation/désactivation de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleToggleEnable(enabled) {
    if (this.props.onFeatureToggle) {
      this.props.onFeatureToggle('status-aggregation', enabled);
    }
  }
}