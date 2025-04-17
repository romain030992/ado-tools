import FeatureDetailsBase from './feature-details-base.js';
import StorageService from '../../../services/storage-service.js';

/**
 * Composant pour l'édition des paramètres généraux
 */
export default class GeneralDetails extends FeatureDetailsBase {
  /**
   * Constructeur du composant GeneralDetails
   * @param {HTMLElement} container - Conteneur du composant
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.featureKey = 'general';
  }
  
  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Paramètres généraux';
  }
  
  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Configurez les paramètres de base pour votre organisation et projet Azure DevOps.';
  }

  /**
   * Extrait les valeurs de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    const orgaInput = this.elements.orgaInput;
    const projectInput = this.elements.projectInput;
    
    if (!orgaInput || !projectInput) {
      return this.props.config?.general || {};
    }
    
    return {
      orga: orgaInput.value,
      project: projectInput.value
    };
  }
    /**
   * Rend le corps du composant
   * @param {HTMLElement} container - Conteneur pour le corps
   */
  renderBody(container) {
    // Champ pour l'organisation
    const orgaField = this.createTextField(
      'orgaInput',
      this.props.config?.general?.orga || '',
      {
        input: () => this.debouncedSaveChanges(),
        change: () => this.debouncedSaveChanges(),
        blur: () => this.debouncedSaveChanges()
      },
      'Organisation',
      'Nom de l\'organisation',
      'Le nom de votre organisation Azure DevOps'
    );
    this.storeElement('orgaInput', orgaField.querySelector('input'));
    container.appendChild(orgaField);
    
    // Champ pour le projet
    const projectField = this.createTextField(
      'projectInput',
      this.props.config?.general?.project || '',
      {
        input: () => this.debouncedSaveChanges(),
        change: () => this.debouncedSaveChanges(),
        blur: () => this.debouncedSaveChanges()
      },
      'Projet',
      'Nom du projet',
      'Le nom de votre projet Azure DevOps'
    );
    this.storeElement('projectInput', projectField.querySelector('input'));
    container.appendChild(projectField);
    
    // Bouton de suppression
    const deleteButton = this.createElement('button', {
      id: 'deleteConfigButton',
      className: 'danger-button'
    }, {
      click: () => this.handleDeleteConfig()
    });
    
    const deleteIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    deleteButton.appendChild(deleteIcon);
    deleteButton.appendChild(document.createTextNode(' Supprimer cette configuration'));
    
    container.appendChild(deleteButton);
  }
  
  /**
   * Gère la suppression de la configuration
   */
  async handleDeleteConfig() {
    if (typeof this.props.onDelete === 'function') {
      this.props.onDelete();
    }
  }
}