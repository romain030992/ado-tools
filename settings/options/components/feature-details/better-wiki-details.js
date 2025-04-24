import FeatureDetailsBase from './feature-details-base.js';
import StorageService from '../../../services/storage-service.js';
import ToastManager from '../base/toast-manager.js';

/**
 * Composant pour l'édition des paramètres d'amélioration du Wiki
 */
export default class BetterWikiDetails extends FeatureDetailsBase {
  /**
   * Crée une instance de BetterWikiDetails
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */  constructor(container, props) {
    super(container, props);
    this.featureKey = 'better-wiki';
    this.editingTemplateIndex = null;
    this.isPreviewMode = false;
    this.editingGroupIndex = null;
  }
  
  /**
   * Récupère le titre du composant
   * @returns {string} - Titre du composant
   */
  getTitle() {
    return 'Wiki amélioré';
  }
  
  /**
   * Récupère la description du composant
   * @returns {string} - Description du composant
   */
  getDescription() {
    return 'Configurez les templates pour améliorer l\'édition du wiki Azure DevOps.';
  }
  /**
   * Extrait les valeurs de la fonctionnalité
   * @returns {Object} - Valeurs extraites
   */
  extractValues() {
    // Les valeurs sont extraites lors de la sauvegarde des templates individuels
    // S'assurer que les groupes sont initialisés
    const config = this.props.config?.betterWiki || {};
    if (!config.groups) {
      config.groups = [{
        id: 'default',
        name: 'Général',
        icon: '📄'
      }];
    }
    return config;
  }
  
  /**
   * Rend le composant dans le conteneur
   */  render() {
    this.container.innerHTML = '';
    this.renderTemplateEditor();

    // Vérifier si le conteneur optionnel est présent
    const optionalContainer = this.props.optionalContainer;
    if (optionalContainer) {
      optionalContainer.classList.add('active');
            
      // Puis la liste des templates
      this.renderTemplateList(optionalContainer);
    }
    
    // Mettre à jour les valeurs originales
    this.updateOriginalValues();
  }

  /**
   * Rend l'éditeur de template
   */
  renderTemplateEditor() {
    // En-tête du template
    const templateHeader = this.createElement('div', { className: 'template-header' });
    
    // Identité du template (emoji + titre)
    const templateIdentity = this.createElement('div', { className: 'template-identity' });
      // Picker d'emoji
    const emojiPicker = this.createElement('div', { className: 'emoji-picker' });
    const emojiDisplay = this.createElement('span', { className: 'emoji-display' }, {}, '😀');
    emojiPicker.appendChild(emojiDisplay);
    
    const templateEmoji = this.createElement('input', {
      id: 'templateEmoji',
      type: 'text',
      placeholder: '😀',
      value: ''
    }, {
      input: (e) => {
        emojiDisplay.textContent = e.target.value || '😀';
        this.debouncedSaveChanges(); // Ajout de l'autosave
      }
    });
    this.storeElement('templateEmoji', templateEmoji);
    emojiPicker.appendChild(templateEmoji);
    
    templateIdentity.appendChild(emojiPicker);
      // Titre du template
    const templateTitle = this.createElement('input', {
      id: 'templateTitle',
      type: 'text',
      className: 'template-title-input',
      placeholder: 'Nouveau template',
      value: ''
    }, {
      input: () => this.debouncedSaveChanges(),
      change: () => this.debouncedSaveChanges(),
      blur: () => this.debouncedSaveChanges()
    });
    this.storeElement('templateTitle', templateTitle);
    templateIdentity.appendChild(templateTitle);
    
    templateHeader.appendChild(templateIdentity);
    
    // Sélecteur de groupe pour le template
    const groupSelector = this.createElement('div', { className: 'group-selector' });
    
    const groupSelect = this.createElement('select', { 
      id: 'templateGroup'
    }, {
      change: () => this.debouncedSaveChanges()
    });
    this.storeElement('templateGroup', groupSelect);
    
    // Récupérer les groupes disponibles
    const groups = this.props.config?.betterWiki?.groups || [{
      id: 'default',
      name: 'Général',
      icon: '📄'
    }];
    
    // Ajouter les options du select
    groups.forEach(group => {
      const option = this.createElement('option', { 
        value: group.id
      }, {}, `${group.icon} ${group.name}`);
      
      groupSelect.appendChild(option);
    });
    
    groupSelector.appendChild(groupSelect);
    templateHeader.appendChild(groupSelector);
    
    // Actions du template
    const templateActions = this.createElement('div', { className: 'template-actions' });
    
    // Bouton pour basculer l'aperçu
    const togglePreviewButton = this.createElement('button', {
      id: 'togglePreviewButton',
      className: 'icon-button',
      title: 'Afficher/Masquer l\'aperçu'
    }, {
      click: () => this.togglePreviewMode()
    });
    
    const eyeIcon = this.createElement('i', { className: 'fas fa-eye' });
    togglePreviewButton.appendChild(eyeIcon);
    templateActions.appendChild(togglePreviewButton);
    
    // Bouton pour annuler les modifications
    const cancelTemplateButton = this.createElement('button', {
      id: 'cancelTemplateButton',
      className: 'action-button',
      title: 'Annuler les modifications'
    }, {
      click: () => this.resetTemplateEditor()
    });
    
    const undoIcon = this.createElement('i', { className: 'fas fa-undo' });
    cancelTemplateButton.appendChild(undoIcon);
    templateActions.appendChild(cancelTemplateButton);
    
    // Bouton pour supprimer le template
    const deleteTemplateButton = this.createElement('button', {
      id: 'deleteTemplateButton',
      className: 'action-button danger-action',
      title: 'Supprimer'
    }, {
      click: () => this.deleteTemplate()
    });
    
    const trashIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    deleteTemplateButton.appendChild(trashIcon);
    templateActions.appendChild(deleteTemplateButton);
    
    // Bouton pour sauvegarder le template
    const saveTemplateButton = this.createElement('button', {
      id: 'saveTemplateButton',
      className: 'action-button primary-action',
      title: 'Sauvegarder'
    }, {
      click: () => this.saveTemplate()
    });
    
    const saveIcon = this.createElement('i', { className: 'fas fa-save' });
    saveTemplateButton.appendChild(saveIcon);
    saveTemplateButton.appendChild(document.createTextNode(' Sauvegarder'));
    templateActions.appendChild(saveTemplateButton);
    
    templateHeader.appendChild(templateActions);
    
    this.container.appendChild(templateHeader);
    
    // Conteneur de contenu du template (éditeur + aperçu)
    const templateContentContainer = this.createElement('div', { className: 'template-content-container' });
      // Éditeur de contenu
    const templateContent = this.createElement('textarea', {
      id: 'templateContent',
      placeholder: 'Contenu du Template'
    }, {
      input: (e) => {
        if (this.isPreviewMode) {
          this.updatePreview(e.target.value);
        }
        this.debouncedSaveChanges('template-content'); // Ajout de l'autosave
      }
    });
    this.storeElement('templateContent', templateContent);
    templateContentContainer.appendChild(templateContent);
    
    // Aperçu du contenu
    const templatePreview = this.createElement('div', {
      id: 'templatePreview',
      className: 'template-preview hidden'
    });
    
    const templatePreviewContent = this.createElement('div', { id: 'templatePreviewContent' });
    this.storeElement('templatePreviewContent', templatePreviewContent);
    templatePreview.appendChild(templatePreviewContent);
    
    templateContentContainer.appendChild(templatePreview);
    
    this.container.appendChild(templateContentContainer);
  }
  /**
   * Rend la liste des templates
   * @param {HTMLElement} container - Conteneur pour la liste des templates
   */
  renderTemplateList(container) {
    const optionalColumnContent = container.querySelector('#optionalColumnContent') || container;
    optionalColumnContent.innerHTML = '';
    
    // Créer un header stylisé comme config-list et feature-list
    const templateListHeader = this.createElement('div', { 
      className: 'template-list-header'
    });
    
    // Titre du header
    const headerTitle = this.createElement('h2', {}, {}, 'Templates');
    templateListHeader.appendChild(headerTitle);
    
    // Conteneur pour les boutons d'action
    const headerActions = this.createElement('div', { 
      className: 'template-list-actions'
    });
    
    // Bouton pour ajouter un template
    const addTemplateButton = this.createElement('button', {
      id: 'addTemplateButton',
      className: 'primary-button small-button',
      title: 'Ajouter un template'
    }, {
      click: () => this.createNewTemplate()
    });
    
    const plusIcon = this.createElement('i', { className: 'fas fa-plus' });
    addTemplateButton.appendChild(plusIcon);
    addTemplateButton.appendChild(document.createTextNode(' Template'));
    
    headerActions.appendChild(addTemplateButton);
    
    // Bouton pour ajouter un groupe
    const addGroupButton = this.createElement('button', {
      id: 'addTemplateGroupButton',
      className: 'primary-button small-button',
      title: 'Ajouter un groupe'
    }, {
      click: () => this.showGroupModal()
    });
    
    const folderIcon = this.createElement('i', { className: 'fas fa-folder-plus' });
    addGroupButton.appendChild(folderIcon);
    addGroupButton.appendChild(document.createTextNode(' Groupe'));
    
    headerActions.appendChild(addGroupButton);
    
    // Ajouter les actions au header
    templateListHeader.appendChild(headerActions);
    
    // Ajouter le header au conteneur
    optionalColumnContent.appendChild(templateListHeader);
    
    // Liste des templates organisée par groupe
    const templateList = this.createElement('div', { id: 'templateList', className: 'grouped-template-list' });
    this.storeElement('templateList', templateList);
    
    // Récupérer les templates et les groupes existants
    const templates = this.props.config?.betterWiki?.templates || [];
    const groups = this.props.config?.betterWiki?.groups || [{
      id: 'default',
      name: 'Général',
      icon: '📄'
    }];
    
    // Créer un objet pour stocker les templates par groupe
    const templatesByGroup = {};
    
    // Initialiser les groupes
    groups.forEach(group => {
      templatesByGroup[group.id] = {
        group: group,
        templates: []
      };
    });
    
    // Répartir les templates dans leurs groupes respectifs
    templates.forEach((template, index) => {
      const groupId = template.groupId || 'default';
      if (templatesByGroup[groupId]) {
        templatesByGroup[groupId].templates.push({ template, index });
      } else {
        // Si le groupe n'existe pas (cas rare), mettre dans le groupe par défaut
        templatesByGroup['default'].templates.push({ template, index });
      }
    });
      // Créer la liste des templates regroupés
    Object.values(templatesByGroup).forEach(groupData => {
      // Ne pas afficher les groupes vides
      if (groupData.templates.length === 0) return;
      
      // Container pour le groupe (header + contenu)
      const groupContainer = this.createElement('div', {
        className: 'template-group-container',
        'data-group-id': groupData.group.id
      });
      
      // Créer l'en-tête du groupe
      const groupHeader = this.createElement('div', { 
        className: 'template-group-header',
        'data-group-id': groupData.group.id
      }, {
        // Cliquer sur le header dépliera/repliera le groupe
        click: (e) => {
          // Ne pas déclencher si on clique sur l'ellipse ou le menu contextuel
          if (e.target.closest('.group-actions') || 
              e.target.closest('.context-menu')) {
            return;
          }
          groupContainer.classList.toggle('collapsed');
        }
      });
      
      // Container pour l'icône et le nom (partie gauche)
      const groupInfo = this.createElement('div', { 
        className: 'group-info'
      });
      
      // Icône d'expansion/collapse
      const expandIcon = this.createElement('i', { 
        className: 'fas fa-caret-down group-expand-icon'
      });
      groupInfo.appendChild(expandIcon);
      
      // Icône du groupe
      const groupIcon = this.createElement('span', { 
        className: 'group-icon' 
      }, {}, groupData.group.icon || '📄');
      groupInfo.appendChild(groupIcon);
      
      // Nom du groupe
      const groupName = this.createElement('span', { 
        className: 'group-name' 
      }, {}, groupData.group.name);
      groupInfo.appendChild(groupName);
      
      // Compteur de templates
      const templateCount = this.createElement('span', {
        className: 'template-count'  
      }, {}, `(${groupData.templates.length})`);
      groupInfo.appendChild(templateCount);
      
      groupHeader.appendChild(groupInfo);
      
      // Actions du groupe (sauf pour le groupe par défaut)
      if (groupData.group.id !== 'default') {
        const groupActions = this.createElement('div', { 
          className: 'group-actions' 
        });
        
        // Bouton ellipse pour le menu contextuel
        const ellipsisButton = this.createElement('button', {
          className: 'icon-button ellipsis-button',
          title: 'Plus d\'options'
        }, {
          click: (e) => {
            e.stopPropagation(); // Empêcher la propagation au header
            this.showGroupContextMenu(e, groupData.group.id, templatesByGroup.indexOf(groupData));
          }
        });
        
        const ellipsisIcon = this.createElement('i', { 
          className: 'fas fa-ellipsis-v' 
        });
        ellipsisButton.appendChild(ellipsisIcon);
        groupActions.appendChild(ellipsisButton);
        
        groupHeader.appendChild(groupActions);
      }
      
      groupContainer.appendChild(groupHeader);
      
      // Liste des templates du groupe
      const groupContent = this.createElement('div', { 
        className: 'template-group-content' 
      });
      
      const groupTemplateList = this.createElement('ul', { 
        className: 'template-sublist' 
      });
      
      groupData.templates.forEach(({ template, index }) => {
        const listItem = this.createTemplateListItem(template, index);
        groupTemplateList.appendChild(listItem);
      });
      
      groupContent.appendChild(groupTemplateList);
      groupContainer.appendChild(groupContent);
      
      templateList.appendChild(groupContainer);
    });
    
    optionalColumnContent.appendChild(templateList);
  }
  
  /**
   * Crée un élément de liste pour un template
   * @param {Object} template - Données du template
   * @param {number} index - Index du template
   * @returns {HTMLElement} - Élément de liste créé
   */
  createTemplateListItem(template, index) {
    const listItem = this.createElement('li', { className: 'template-list-item' }, {
      click: () => this.selectTemplate(index, template)
    });
    
    const emoji = this.createElement('span', { className: 'emoji' }, {}, template.emoji || '😀');
    listItem.appendChild(emoji);
    
    const title = this.createElement('span', { className: 'title' }, {}, template.title || 'Sans titre');
    listItem.appendChild(title);
    
    return listItem;
  }
  
  /**
   * Sélectionne un template pour l'édition
   * @param {number} index - Index du template
   * @param {Object} template - Données du template
   */
  selectTemplate(index, template) {
    // Mettre à jour la sélection visuelle
    const templateList = this.elements.templateList;
    const items = templateList.querySelectorAll('.template-list-item');
    
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
      // Mettre à jour l'éditeur
    this.editingTemplateIndex = index;
    this.elements.templateTitle.value = template.title || '';
    this.elements.templateEmoji.value = template.emoji || '';
    this.elements.templateContent.value = template.content || '';
    
    // Sélectionner le groupe approprié dans le menu déroulant
    if (this.elements.templateGroup) {
      const groupId = template.groupId || 'default';
      this.elements.templateGroup.value = groupId;
    }
    
    // Mettre à jour l'affichage de l'emoji
    const emojiDisplay = this.container.querySelector('.emoji-display');
    emojiDisplay.textContent = template.emoji || '😀';
    
    // Mettre à jour l'aperçu si actif
    if (this.isPreviewMode) {
      this.updatePreview(template.content || '');
    }
  }
  
  /**
   * Crée un nouveau template
   */
  createNewTemplate() {
    // Effacer la sélection actuelle
    const templateList = this.elements.templateList;
    const selectedItem = templateList.querySelector('.template-list-item.selected');
    if (selectedItem) {
      selectedItem.classList.remove('selected');
    }
    
    // Réinitialiser l'éditeur
    this.editingTemplateIndex = null;
    this.elements.templateTitle.value = '';
    this.elements.templateEmoji.value = '';
    this.elements.templateContent.value = '';
    
    // Réinitialiser l'affichage de l'emoji
    const emojiDisplay = this.container.querySelector('.emoji-display');
    emojiDisplay.textContent = '😀';
    
    // Désactiver le mode aperçu
    if (this.isPreviewMode) {
      this.togglePreviewMode();
    }
    
    // Donner le focus au champ de titre
    this.elements.templateTitle.focus();
  }
    /**
   * Sauvegarde le template actuel
   */
  saveTemplate() {
    const templateTitle = this.elements.templateTitle.value.trim();
    const templateEmoji = this.elements.templateEmoji.value.trim();
    const templateContent = this.elements.templateContent.value.trim();
    const templateGroup = this.elements.templateGroup ? this.elements.templateGroup.value : 'default';
    
    if (!templateTitle || !templateContent) {
      alert("Le titre et le contenu sont obligatoires.");
      return;
    }
    
    // Récupérer la configuration actuelle et les templates
    let config = this.props.config?.betterWiki || {};
    let templates = [...(config.templates || [])];
    
    // Créer le nouveau template
    const template = { 
      title: templateTitle,
      groupId: templateGroup,
      emoji: templateEmoji || '😀',
      content: templateContent
    };
    
    // Mettre à jour ou ajouter le template
    if (this.editingTemplateIndex !== null && this.editingTemplateIndex < templates.length) {
      templates[this.editingTemplateIndex] = template;
    } else {
      templates.push(template);
      this.editingTemplateIndex = templates.length - 1;
    }
    
    // Mettre à jour la configuration
    const updatedConfig = {
      ...config,
      templates
    };
      // Sauvegarder via le callback
    if (typeof this.props.onSave === 'function') {
      this.props.onSave(updatedConfig);
      
      // Actualiser la liste des templates et conserver la sélection
      this.refreshTemplateList(this.editingTemplateIndex);
    }
  }
  
  /**
   * Supprime le template actuel
   */
  deleteTemplate() {
    if (this.editingTemplateIndex === null) {
      return;
    }
    
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return;
    }
    
    // Récupérer la configuration actuelle et les templates
    let config = this.props.config?.betterWiki || {};
    let templates = [...(config.templates || [])];
    
    // Supprimer le template
    if (this.editingTemplateIndex < templates.length) {
      templates.splice(this.editingTemplateIndex, 1);
      
      // Mettre à jour la configuration
      const updatedConfig = {
        ...config,
        templates
      };
        // Sauvegarder via le callback
      if (typeof this.props.onSave === 'function') {
        this.props.onSave(updatedConfig);
        
        // Réinitialiser l'éditeur
        this.resetTemplateEditor();
        
        // Actualiser la liste des templates
        this.refreshTemplateList();
      }
    }
  }
  
  /**
   * Réinitialise l'éditeur de template
   */
  resetTemplateEditor() {
    this.editingTemplateIndex = null;
    this.elements.templateTitle.value = '';
    this.elements.templateEmoji.value = '';
    this.elements.templateContent.value = '';
    
    // Réinitialiser l'affichage de l'emoji
    const emojiDisplay = this.container.querySelector('.emoji-display');
    emojiDisplay.textContent = '😀';
    
    // Désactiver le mode aperçu
    if (this.isPreviewMode) {
      this.togglePreviewMode();
    }
    
    // Effacer la sélection dans la liste
    const templateList = this.elements.templateList;
    if (templateList) {
      const items = templateList.querySelectorAll('.template-list-item.selected');
      items.forEach(item => {
        item.classList.remove('selected');
      });
    }
  }
  
  /**
   * Active/désactive le mode aperçu
   */
  togglePreviewMode() {
    this.isPreviewMode = !this.isPreviewMode;
    
    // Mettre à jour l'apparence du bouton
    const toggleButton = this.container.querySelector('#togglePreviewButton');
    const icon = toggleButton.querySelector('i');
    
    icon.className = this.isPreviewMode ? 'fas fa-edit' : 'fas fa-eye';
    
    if (this.isPreviewMode) {
      toggleButton.classList.add('active');
      this.container.querySelector('.template-content-container').classList.add('preview-mode');
      
      // Mettre à jour l'aperçu avec le contenu actuel
      this.updatePreview(this.elements.templateContent.value);
      this.container.querySelector('#templatePreview').classList.remove('hidden');
    } else {
      toggleButton.classList.remove('active');
      this.container.querySelector('.template-content-container').classList.remove('preview-mode');
      this.container.querySelector('#templatePreview').classList.add('hidden');
    }
  }
  
  /**
   * Met à jour l'aperçu du markdown
   * @param {string} content - Contenu markdown
   */
  updatePreview(content) {
    const previewContent = this.elements.templatePreviewContent;
    if (!previewContent) return;
    
    if (content.trim()) {
      // Utiliser la bibliothèque marked pour le rendu markdown
      if (window.marked && window.DOMPurify) {
        previewContent.innerHTML = DOMPurify.sanitize(marked.parse(content));
      } else {
        previewContent.textContent = content;
      }
    } else {
      previewContent.innerHTML = '<em>Pas de contenu à afficher</em>';
    }
  }
  
  /**
   * Rafraîchit la liste des templates tout en conservant la sélection actuelle
   * @param {number} [selectedIndex=null] - Index du template à sélectionner après le rafraîchissement
   */
  refreshTemplateList(selectedIndex = null) {
    // Vérifier si le conteneur optionnel est présent
    if (!this.props.optionalContainer) {
      return;
    }

    // Sauvegarder l'index à sélectionner (utiliser l'index actuel si non spécifié)
    const indexToSelect = selectedIndex !== null ? selectedIndex : this.editingTemplateIndex;
    
    // Rafraîchir la liste des templates
    this.renderTemplateList(this.props.optionalContainer);
    
    // Restaurer la sélection après le rendu si un index est spécifié
    if (indexToSelect !== null) {
      const templateList = this.elements.templateList;
      const items = templateList.querySelectorAll('.template-list-item');
      
      if (items[indexToSelect]) {
        items[indexToSelect].classList.add('selected');
      }
    }
  }
  
  /**
   * Gère l'activation/désactivation de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleToggleEnable(enabled) {
    if (this.props.onFeatureToggle) {
      this.props.onFeatureToggle('better-wiki', enabled);
    }
  }
  
  /**
   * Crée un élément pour afficher un groupe
   * @param {Object} group - Données du groupe
   * @param {number} index - Index du groupe
   * @returns {HTMLElement} - Élément créé
   */
  createGroupItem(group, index) {
    const groupItem = this.createElement('div', { 
      className: 'group-item',
      'data-group-id': group.id
    });
    
    // Icône du groupe
    const groupIcon = this.createElement('span', { className: 'group-icon' }, {}, group.icon || '📄');
    groupItem.appendChild(groupIcon);
    
    // Nom du groupe
    const groupName = this.createElement('span', { className: 'group-name' }, {}, group.name);
    groupItem.appendChild(groupName);
    
    // Actions du groupe (sauf pour le groupe par défaut)
    if (group.id !== 'default') {
      const groupActions = this.createElement('div', { className: 'group-actions' });
      
      // Bouton pour éditer le groupe
      const editButton = this.createElement('button', {
        className: 'icon-button',
        title: 'Modifier'
      }, {
        click: (e) => {
          e.stopPropagation();
          this.showGroupModal(index);
        }
      });
      
      const editIcon = this.createElement('i', { className: 'fas fa-edit' });
      editButton.appendChild(editIcon);
      groupActions.appendChild(editButton);
      
      // Bouton pour supprimer le groupe
      const deleteButton = this.createElement('button', {
        className: 'icon-button danger-button',
        title: 'Supprimer'
      }, {
        click: (e) => {
          e.stopPropagation();
          this.deleteGroup(index);
        }
      });
      
      const deleteIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
      deleteButton.appendChild(deleteIcon);
      groupActions.appendChild(deleteButton);
      
      groupItem.appendChild(groupActions);
    }
    
    return groupItem;
  }

  /**
   * Affiche la fenêtre modale pour ajouter ou modifier un groupe
   * @param {number|null} index - Index du groupe à éditer, ou null pour un nouveau groupe
   */
  showGroupModal(index = null) {
    // Supprimer toute modale existante
    const existingModal = document.querySelector('.group-modal');
    if (existingModal) {
      existingModal.remove();
    }
    
    // Récupérer le groupe s'il existe
    const groups = this.props.config?.betterWiki?.groups || [];
    const group = index !== null ? groups[index] : { name: '', icon: '📄' };
    this.editingGroupIndex = index;
    
    // Créer le fond de la modale
    const modalOverlay = this.createElement('div', { className: 'modal-overlay' });
    
    // Créer la modale
    const modal = this.createElement('div', { className: 'modal group-modal' });
    
    // En-tête de la modale
    const modalHeader = this.createElement('div', { className: 'modal-header' });
    const modalTitle = this.createElement('h3', {}, {}, 
      index !== null ? 'Modifier le groupe' : 'Nouveau groupe');
    modalHeader.appendChild(modalTitle);
    
    // Bouton pour fermer la modale
    const closeButton = this.createElement('button', {
      className: 'close-button',
      title: 'Fermer'
    }, {
      click: () => modalOverlay.remove()
    });
    
    const closeIcon = this.createElement('i', { className: 'fas fa-times' });
    closeButton.appendChild(closeIcon);
    modalHeader.appendChild(closeButton);
    
    modal.appendChild(modalHeader);
    
    // Corps de la modale
    const modalBody = this.createElement('div', { className: 'modal-body' });
    
    // Champ pour l'icône du groupe
    const iconField = this.createElement('div', { className: 'form-field' });
    const iconLabel = this.createElement('label', {}, {}, 'Icône');
    iconField.appendChild(iconLabel);
    
    const iconContainer = this.createElement('div', { className: 'emoji-picker' });
    const iconDisplay = this.createElement('span', { className: 'emoji-display' }, {}, group.icon || '📄');
    iconContainer.appendChild(iconDisplay);
    
    const iconInput = this.createElement('input', {
      type: 'text',
      value: group.icon || '📄',
      placeholder: '📄'
    }, {
      input: (e) => {
        iconDisplay.textContent = e.target.value || '📄';
      }
    });
    
    iconContainer.appendChild(iconInput);
    iconField.appendChild(iconContainer);
    modalBody.appendChild(iconField);
    
    // Champ pour le nom du groupe
    const nameField = this.createElement('div', { className: 'form-field' });
    const nameLabel = this.createElement('label', {}, {}, 'Nom du groupe');
    nameField.appendChild(nameLabel);
    
    const nameInput = this.createElement('input', {
      type: 'text',
      value: group.name,
      placeholder: 'Nom du groupe'
    });
    nameField.appendChild(nameInput);
    modalBody.appendChild(nameField);
    
    modal.appendChild(modalBody);
    
    // Pied de la modale
    const modalFooter = this.createElement('div', { className: 'modal-footer' });
    
    // Bouton pour annuler
    const cancelButton = this.createElement('button', {
      className: 'secondary-button'
    }, {
      click: () => modalOverlay.remove()
    });
    cancelButton.appendChild(document.createTextNode('Annuler'));
    modalFooter.appendChild(cancelButton);
    
    // Bouton pour sauvegarder
    const saveButton = this.createElement('button', {
      className: 'primary-button'
    }, {
      click: () => this.saveGroup(nameInput.value, iconInput.value)
    });
    saveButton.appendChild(document.createTextNode('Enregistrer'));
    modalFooter.appendChild(saveButton);
    
    modal.appendChild(modalFooter);
    
    modalOverlay.appendChild(modal);
    document.body.appendChild(modalOverlay);
  }

  /**
   * Sauvegarde un groupe (nouveau ou existant)
   * @param {string} name - Nom du groupe
   * @param {string} icon - Icône du groupe
   */
  async saveGroup(name, icon) {
    try {
      // Récupérer la configuration actuelle
      const config = this.props.config || {};
      if (!config.betterWiki) {
        config.betterWiki = {};
      }
      if (!config.betterWiki.groups) {
        config.betterWiki.groups = [{
          id: 'default',
          name: 'Général',
          icon: '📄'
        }];
      }
      
      // Vérifier si le nom est fourni
      if (!name.trim()) {
        alert('Le nom du groupe est obligatoire');
        return;
      }
      
      const groups = config.betterWiki.groups;
      
      if (this.editingGroupIndex !== null) {
        // Modifier un groupe existant
        const group = groups[this.editingGroupIndex];
        group.name = name;
        group.icon = icon || '📄';
      } else {
        // Créer un nouveau groupe
        const newGroup = {
          id: 'group_' + Date.now(), // Identifiant unique
          name,
          icon: icon || '📄'
        };
        groups.push(newGroup);
      }      // Mettre à jour dans le stockage
      await StorageService.updateConfiguration(this.props.configIndex, config);
      
      // Fermer la modale
      const modalOverlay = document.querySelector('.modal-overlay');
      if (modalOverlay) {
        modalOverlay.remove();
      }
      
      // Rafraîchir toute l'interface pour refléter les changements
      if (this.props.optionalContainer) {
        // Rafraîchir l'interface complète au lieu d'essayer d'appeler des méthodes spécifiques
        this.render();
      }
            
      // Afficher un message de confirmation
      const action = this.editingGroupIndex !== null ? 'modifié' : 'créé';
      ToastManager.showToast(`Le groupe a été ${action} avec succès`, 'success');
      
      // Réinitialiser l'index d'édition
      this.editingGroupIndex = null;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde du groupe:', error);
      ToastManager.showToast('Erreur lors de la sauvegarde du groupe', 'error');
    }
  }
  
  /**
   * Supprime un groupe
   * @param {number} index - Index du groupe à supprimer
   */
  async deleteGroup(index) {
    try {
      // Demander confirmation
      if (!confirm('Êtes-vous sûr de vouloir supprimer ce groupe ?')) {
        return;
      }
      
      // Récupérer la configuration actuelle
      const config = this.props.config || {};
      if (!config.betterWiki || !config.betterWiki.groups) {
        return;
      }
      
      const groups = config.betterWiki.groups;
      const groupToDelete = groups[index];
      
      // Vérifier que ce n'est pas le groupe par défaut
      if (groupToDelete.id === 'default') {
        ToastManager.showToast('Le groupe par défaut ne peut pas être supprimé', 'error');
        return;
      }
      
      // Vérifier si des templates sont associés à ce groupe
      const templates = config.betterWiki.templates || [];
      const templatesInGroup = templates.filter(template => template.groupId === groupToDelete.id);
      
      if (templatesInGroup.length > 0) {
        // Si des templates sont associés, demander confirmation
        const confirmMove = confirm(`Ce groupe contient ${templatesInGroup.length} template(s). Voulez-vous les déplacer vers le groupe par défaut ?`);
        
        if (!confirmMove) {
          return;
        }
        
        // Déplacer les templates vers le groupe par défaut
        templates.forEach(template => {
          if (template.groupId === groupToDelete.id) {
            template.groupId = 'default';
          }
        });
      }
      
      // Supprimer le groupe
      groups.splice(index, 1);
      
      // Mettre à jour dans le stockage
      await StorageService.saveConfiguration(this.props.configIndex, config);
            
      // Si la liste des templates est affichée, l'actualiser aussi
      this.renderTemplateList(this.props.optionalContainer);
      
      // Afficher un message de confirmation
      ToastManager.showToast('Le groupe a été supprimé avec succès', 'success');
    } catch (error) {
      console.error('Erreur lors de la suppression du groupe:', error);
      ToastManager.showToast('Erreur lors de la suppression du groupe', 'error');
    }
  }
  /**
   * Affiche le menu contextuel pour un groupe
   * @param {Event} event - L'événement de clic
   * @param {string} groupId - Identifiant du groupe
   * @param {number} index - Index du groupe dans la liste
   */
  showGroupContextMenu(event, groupId, index) {
    // Empêcher le comportement par défaut du clic
    event.preventDefault();
    
    // Supprimer tout menu contextuel existant
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
      existingMenu.remove();
    }
    
    // Récupérer la position du clic
    const { clientX, clientY } = event;
    
    // Créer le menu contextuel
    const contextMenu = this.createElement('div', {
      className: 'context-menu group-context-menu'
    });
    
    // Option pour éditer le groupe
    const editOption = this.createElement('div', {
      className: 'context-menu-item'
    }, {
      click: () => {
        contextMenu.remove();
        
        // Trouver l'index du groupe dans la liste complète
        const groups = this.props.config?.betterWiki?.groups || [];
        const groupIndex = groups.findIndex(g => g.id === groupId);
        
        if (groupIndex !== -1) {
          this.showGroupModal(groupIndex);
        }
      }
    });
    
    const editIcon = this.createElement('i', { className: 'fas fa-edit' });
    editOption.appendChild(editIcon);
    editOption.appendChild(document.createTextNode(' Modifier'));
    contextMenu.appendChild(editOption);
    
    // Option pour supprimer le groupe
    const deleteOption = this.createElement('div', {
      className: 'context-menu-item danger'
    }, {
      click: () => {
        contextMenu.remove();
        
        // Trouver l'index du groupe dans la liste complète
        const groups = this.props.config?.betterWiki?.groups || [];
        const groupIndex = groups.findIndex(g => g.id === groupId);
        
        if (groupIndex !== -1) {
          this.deleteGroup(groupIndex);
        }
      }
    });
    
    const deleteIcon = this.createElement('i', { className: 'fas fa-trash-alt' });
    deleteOption.appendChild(deleteIcon);
    deleteOption.appendChild(document.createTextNode(' Supprimer'));
    contextMenu.appendChild(deleteOption);
    
    // Positionner le menu contextuel
    contextMenu.style.top = `${clientY}px`;
    contextMenu.style.left = `${clientX}px`;
    
    // Ajouter le menu au document
    document.body.appendChild(contextMenu);
    
    // Fermer le menu au clic ailleurs
    setTimeout(() => {
      const closeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          contextMenu.remove();
          document.removeEventListener('click', closeMenu);
        }
      };
      document.addEventListener('click', closeMenu);
    }, 0);
  }
}