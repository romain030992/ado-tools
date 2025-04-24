import Component from '../base/component.js';
import StorageService from '../../../services/storage-service.js';

/**
 * Composant pour la gestion de la liste des configurations
 */
export default class ConfigList extends Component {
  /**
   * Crée une instance de ConfigList
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    // Appel du constructeur parent AVANT d'utiliser 'this'
    super(container, props);
    
    // Initialisation des propriétés après l'appel à super()
    this.selectedConfigIndex = null;
    this.configs = []; // S'assurer que configs est un tableau vide et non undefined
    
    // Charger les configurations
    this.loadConfigurations();
  }
  /**
   * Charge les configurations
   */
  async loadConfigurations() {
    try {
      this.configs = await StorageService.getConfigurations();
      
      // Garantir qu'une configuration est toujours sélectionnée dès le chargement
      if (this.configs.length > 0) {
        // Si aucune configuration n'est sélectionnée ou si l'index est invalide
        if (this.selectedConfigIndex === null || this.selectedConfigIndex >= this.configs.length) {
          this.selectedConfigIndex = 0; // Toujours sélectionner la première configuration
        }
      }
      
      this.render();
      
      // Déclencher la sélection après le rendu pour garantir que les détails sont affichés
      if (this.configs.length > 0 && this.selectedConfigIndex !== null) {
        this.selectConfig(this.selectedConfigIndex);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  }

  /**
   * Rend le composant dans le conteneur
   */  render() {
    this.container.innerHTML = '';
    
    // Header avec titre et bouton d'ajout
    const header = this.createElement('div', { className: 'config-list-header' });
    
    // Titre
    const title = this.createElement('h2', {}, {}, 'Configurations');
    header.appendChild(title);
    
    // Bouton pour ajouter une configuration
    const addButton = this.createElement('button', {
      className: 'primary-button add-config-button'
    }, {
      click: () => this.showAddConfigModal()
    });
    
    const addIcon = this.createElement('i', { className: 'fas fa-plus' });
    addButton.appendChild(addIcon);
    addButton.appendChild(document.createTextNode(' Ajouter'));
    
    header.appendChild(addButton);
    this.container.appendChild(header);
    
    // Liste des configurations
    const configList = this.createElement('ul', { className: 'config-list' });
    this.storeElement('configList', configList);
    
    // Ajouter les configurations existantes
    // Vérifier que this.configs existe avant d'utiliser forEach
    if (this.configs && this.configs.length > 0) {
      this.configs.forEach((config, index) => {
        const listItem = this.createConfigListItem(config, index);
        configList.appendChild(listItem);
      });
    }
    
    this.container.appendChild(configList);
    
    // Modale pour ajouter/modifier une configuration
    this.createConfigModal();
  }  /**
   * Crée un élément de liste pour une configuration
   * @param {Object} config - Configuration
   * @param {number} index - Index de la configuration
   * @returns {HTMLElement} - Élément de liste
   */  
  createConfigListItem(config, index) {
    const isSelected = index === this.selectedConfigIndex;
    
    // Créer l'élément de liste cliquable
    const listItem = this.createElement('li', {
      className: `config-list-item ${isSelected ? 'selected' : ''}`,
      'data-index': index,
      title: 'Cliquer pour ouvrir cette configuration'
    }, {
      click: () => this.selectConfig(index),
      contextmenu: (e) => {
        e.preventDefault();
        this.showContextMenu(e, index);
      }
    });
    
    // Nom de la configuration - directement dans l'élément de liste
    const name = this.createElement('span', {
      className: 'config-name'
    }, {}, `${config.general.orga} - ${config.general.project}`);
    listItem.appendChild(name);
    
    return listItem;
  }
  
  /**
   * Affiche un menu contextuel pour les actions sur une configuration
   * @param {Event} event - Événement de clic droit
   * @param {number} index - Index de la configuration
   */
  showContextMenu(event, index) {
    // Supprimer tout menu contextuel existant
    const existingMenu = document.querySelector('.config-context-menu');
    if (existingMenu) existingMenu.remove();
    
    // Créer le menu contextuel
    const contextMenu = this.createElement('div', { 
      className: 'config-context-menu' 
    });
    
    // Option Éditer
    const editOption = this.createElement('div', { 
      className: 'context-menu-item' 
    }, {
      click: () => {
        this.showEditConfigModal(index);
        contextMenu.remove();
      }
    });
    
    const editIcon = this.createElement('i', { className: 'fas fa-edit' });
    editOption.appendChild(editIcon);
    editOption.appendChild(document.createTextNode(' Modifier'));
    contextMenu.appendChild(editOption);
    
    // Option Supprimer
    const deleteOption = this.createElement('div', { 
      className: 'context-menu-item danger' 
    }, {
      click: () => {
        this.confirmDeleteConfig(index);
        contextMenu.remove();
      }
    });
    
    const deleteIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    deleteOption.appendChild(deleteIcon);
    deleteOption.appendChild(document.createTextNode(' Supprimer'));
    contextMenu.appendChild(deleteOption);
    
    // Positionner le menu
    contextMenu.style.top = `${event.pageY}px`;
    contextMenu.style.left = `${event.pageX}px`;
    
    // Ajouter le menu au document
    document.body.appendChild(contextMenu);
    
    // Fermer le menu contextuel lors d'un clic en dehors
    setTimeout(() => {
      document.addEventListener('click', function closeMenu(e) {
        if (!contextMenu.contains(e.target)) {
          contextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      });
    }, 0);
  }

  /**
   * Crée la modale pour ajouter/modifier une configuration
   */
  createConfigModal() {
    // Overlay modal
    const modalOverlay = this.createElement('div', { 
      id: 'configModalOverlay',
      className: 'modal-overlay hidden'
    }, {
      click: (e) => {
        if (e.target === modalOverlay) {
          this.hideConfigModal();
        }
      }
    });
    
    // Modal container
    const modal = this.createElement('div', { 
      id: 'configModal',
      className: 'modal'
    });
    
    // Modal header
    const modalHeader = this.createElement('div', { className: 'modal-header' });
    const modalTitle = this.createElement('h2', { id: 'modalTitle' }, {}, 'Ajouter une configuration');
    this.storeElement('modalTitle', modalTitle);
    modalHeader.appendChild(modalTitle);
    
    const closeButton = this.createElement('button', {
      className: 'close-button'
    }, {
      click: () => this.hideConfigModal()
    });
    
    const closeIcon = this.createElement('i', { className: 'fas fa-times' });
    closeButton.appendChild(closeIcon);
    modalHeader.appendChild(closeButton);
    
    modal.appendChild(modalHeader);
    
    // Modal body
    const modalBody = this.createElement('div', { className: 'modal-body' });
    
    // Champ pour l'organisation
    const orgaGroup = this.createElement('div', { className: 'form-group' });
    const orgaLabel = this.createElement('label', { for: 'configOrga' }, {}, 'Organisation');
    orgaGroup.appendChild(orgaLabel);
    
    const orgaInput = this.createElement('input', {
      type: 'text',
      id: 'configOrga',
      placeholder: 'Nom de l\'organisation Azure DevOps'
    });
    this.storeElement('configOrga', orgaInput);
    orgaGroup.appendChild(orgaInput);
    
    modalBody.appendChild(orgaGroup);
    
    // Champ pour le projet
    const projectGroup = this.createElement('div', { className: 'form-group' });
    const projectLabel = this.createElement('label', { for: 'configProject' }, {}, 'Projet');
    projectGroup.appendChild(projectLabel);
    
    const projectInput = this.createElement('input', {
      type: 'text',
      id: 'configProject',
      placeholder: 'Nom du projet Azure DevOps'
    });
    this.storeElement('configProject', projectInput);
    projectGroup.appendChild(projectInput);
    
    modalBody.appendChild(projectGroup);
    
    // Champ pour la description
    const descGroup = this.createElement('div', { className: 'form-group' });
    const descLabel = this.createElement('label', { for: 'configDescription' }, {}, 'Description');
    descGroup.appendChild(descLabel);
    
    const descInput = this.createElement('textarea', {
      id: 'configDescription',
      placeholder: 'Description de la configuration (optionnel)'
    });
    this.storeElement('configDescription', descInput);
    descGroup.appendChild(descInput);
    
    modalBody.appendChild(descGroup);
    
    modal.appendChild(modalBody);
    
    // Modal footer
    const modalFooter = this.createElement('div', { className: 'modal-footer' });
    
    const cancelButton = this.createElement('button', {
      id: 'modalCancelButton',
      className: 'secondary-button'
    }, {
      click: () => this.hideConfigModal()
    }, 'Annuler');
    modalFooter.appendChild(cancelButton);
    
    const saveButton = this.createElement('button', {
      id: 'modalSaveButton',
      className: 'primary-button'
    }, {
      click: () => this.saveConfigFromModal()
    }, 'Enregistrer');
    
    this.storeElement('modalSaveButton', saveButton);
    modalFooter.appendChild(saveButton);
    
    modal.appendChild(modalFooter);
    modalOverlay.appendChild(modal);
    
    // Hidden input for editing mode
    const editingIndexInput = this.createElement('input', {
      type: 'hidden',
      id: 'editingConfigIndex',
      value: ''
    });
    this.storeElement('editingConfigIndex', editingIndexInput);
    modalBody.appendChild(editingIndexInput);
    
    this.container.appendChild(modalOverlay);
  }

  /**
   * Affiche la modale pour ajouter une configuration
   */
  showAddConfigModal() {
    this.elements.modalTitle.textContent = 'Ajouter une configuration';
    this.elements.configOrga.value = '';
    this.elements.configProject.value = '';
    this.elements.configDescription.value = '';
    this.elements.editingConfigIndex.value = '';
    
    this.elements.modalSaveButton.textContent = 'Ajouter';
    this.container.querySelector('#configModalOverlay').classList.remove('hidden');
  }

  /**
   * Affiche la modale pour modifier une configuration
   * @param {number} index - Index de la configuration à modifier
   */
  showEditConfigModal(index) {
    const config = this.configs[index];
    if (!config) return;
    
    this.elements.modalTitle.textContent = 'Modifier la configuration';
    this.elements.configOrga.value = config.general?.orga || '';
    this.elements.configProject.value = config.general?.project || '';
    this.elements.configDescription.value = config.description || '';
    this.elements.editingConfigIndex.value = index;
    
    this.elements.modalSaveButton.textContent = 'Modifier';
    this.container.querySelector('#configModalOverlay').classList.remove('hidden');
  }

  /**
   * Cache la modale de configuration
   */
  hideConfigModal() {
    this.container.querySelector('#configModalOverlay').classList.add('hidden');
  }

  /**
   * Enregistre la configuration à partir des données de la modale
   */
  async saveConfigFromModal() {
    const orga = this.elements.configOrga.value.trim();
    const project = this.elements.configProject.value.trim();
    const description = this.elements.configDescription.value.trim();
    const editingIndex = this.elements.editingConfigIndex.value;
    
    if (!orga || !project) {
      alert('L\'organisation et le projet sont obligatoires');
      return;
    }
    
    // Générer le nom de la configuration à partir de l'organisation et du projet
    const name = `${orga} - ${project}`;
    
    try {
      if (editingIndex === '') {
        // Ajout d'une nouvelle configuration
        const configData = {
          name,
          description,
          general: {
            orga,
            project
          },
          quickFilter: { enabled: false },
          statusAggregation: { enabled: false },
          taskDrift: { enabled: false },
          betterWiki: { enabled: false }
        };
        
        await StorageService.addConfiguration(configData);
        this.configs = await StorageService.getConfigurations();
      } else {
        // Modification d'une configuration existante
        const index = parseInt(editingIndex);
        const existingConfig = this.configs[index];
        const updatedConfig = { 
          ...existingConfig,
          name,
          description,
          general: {
            ...existingConfig.general,
            orga,
            project
          }
        };
        
        await StorageService.updateConfiguration(index, updatedConfig);
        this.configs = await StorageService.getConfigurations();
      }
      
      this.hideConfigModal();
      this.render();
      
      if (this.props.onConfigChange) {
        this.props.onConfigChange(this.configs);
      }
      
    } catch (error) {
      console.error('Error saving configuration:', error);
      alert('Erreur lors de l\'enregistrement de la configuration');
    }
  }

  /**
   * Sélectionne une configuration
   * @param {number} index - Index de la configuration à sélectionner
   */
  selectConfig(index) {
    if (index < 0 || index >= this.configs.length) {
      return;
    }
    
    this.selectedConfigIndex = index;
    
    // Mettre à jour la sélection visuelle
    const items = this.elements.configList.querySelectorAll('li');
    items.forEach(item => {
      const itemIndex = parseInt(item.getAttribute('data-index'));
      if (itemIndex === index) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    
    // Notifier le changement de sélection
    if (this.props.onSelectConfig) {
      this.props.onSelectConfig(index, this.configs[index]);
    }
  }

  /**
   * Affiche une confirmation pour supprimer une configuration
   * @param {number} index - Index de la configuration à supprimer
   */
  async confirmDeleteConfig(index) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) {
      try {
        await StorageService.deleteConfiguration(index);
        
        // Recharger les configurations
        this.configs = await StorageService.getConfigurations();
        
        // Réinitialiser la sélection si la configuration sélectionnée a été supprimée
        if (this.selectedConfigIndex === index) {
          this.selectedConfigIndex = null;
        } else if (this.selectedConfigIndex > index) {
          // Ajuster l'index si une configuration avant la sélection a été supprimée
          this.selectedConfigIndex--;
        }
        
        this.render();
        
        // Notifier la suppression
        if (this.props.onConfigChange) {
          this.props.onConfigChange(this.configs);
        }
        
      } catch (error) {
        console.error('Error deleting configuration:', error);
        alert('Erreur lors de la suppression de la configuration');
      }
    }
  }
}