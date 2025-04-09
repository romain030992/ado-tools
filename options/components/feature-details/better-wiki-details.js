import FeatureDetailsBase from './feature-details-base.js';
import StorageService from '../../services/storage-service.js';

/**
 * Composant pour l'édition des paramètres d'amélioration du Wiki
 */
export default class BetterWikiDetails extends FeatureDetailsBase {
  /**
   * Crée une instance de BetterWikiDetails
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props) {
    super(container, props);
    this.featureKey = 'better-wiki';
    this.editingTemplateIndex = null;
    this.isPreviewMode = false;
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
    return this.props.config?.betterWiki || {};
  }
  
  /**
   * Rend le composant dans le conteneur
   */
  render() {
    this.container.innerHTML = '';
    this.renderTemplateEditor();

    // Vérifier si le conteneur optionnel est présent
    const optionalContainer = this.props.optionalContainer;
    if (optionalContainer) {
      optionalContainer.classList.add('active');
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
    });
    this.storeElement('templateTitle', templateTitle);
    templateIdentity.appendChild(templateTitle);
    
    templateHeader.appendChild(templateIdentity);
    
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
    
    // Barre d'actions pour les templates
    const templateActionBar = this.createElement('div', { id: 'templateActionBar' });
    
    // Bouton pour ajouter un template
    const addTemplateButton = this.createElement('button', {
      id: 'addTemplateButton',
      className: 'template-list-action'
    }, {
      click: () => this.createNewTemplate()
    });
    
    const plusIcon = this.createElement('i', { className: 'fas fa-plus' });
    addTemplateButton.appendChild(plusIcon);
    addTemplateButton.appendChild(document.createTextNode(' Nouveau template'));
    
    templateActionBar.appendChild(addTemplateButton);
    
    // Bouton pour ajouter un groupe (fonctionnalité future)
    const addGroupButton = this.createElement('button', {
      id: 'addTemplateGroupButton',
      className: 'template-list-action'
    }, {
      click: () => alert('Fonctionnalité à venir')
    });
    
    const folderIcon = this.createElement('i', { className: 'fas fa-folder-plus' });
    addGroupButton.appendChild(folderIcon);
    addGroupButton.appendChild(document.createTextNode(' Nouveau groupe'));
    
    templateActionBar.appendChild(addGroupButton);
    optionalColumnContent.appendChild(templateActionBar);
    
    // Liste des templates
    const templateList = this.createElement('ul', { id: 'templateList' });
    this.storeElement('templateList', templateList);
    
    // Ajouter les templates existants
    const templates = this.props.config?.betterWiki?.templates || [];
    templates.forEach((template, index) => {
      const listItem = this.createTemplateListItem(template, index);
      templateList.appendChild(listItem);
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
      
      // Actualiser la liste des templates après sauvegarde
      if (this.props.optionalContainer) {
        this.renderTemplateList(this.props.optionalContainer);
        
        // Réactiver la sélection après le rendu
        const templateList = this.elements.templateList;
        const items = templateList.querySelectorAll('.template-list-item');
        if (items[this.editingTemplateIndex]) {
          items[this.editingTemplateIndex].classList.add('selected');
        }
      }
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
        
        // Réinitialiser l'éditeur et actualiser la liste
        this.resetTemplateEditor();
        
        if (this.props.optionalContainer) {
          this.renderTemplateList(this.props.optionalContainer);
        }
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
   * Gère l'activation/désactivation de la fonctionnalité
   * @param {boolean} enabled - État d'activation
   */
  handleToggleEnable(enabled) {
    if (this.props.onFeatureToggle) {
      this.props.onFeatureToggle('better-wiki', enabled);
    }
  }
}