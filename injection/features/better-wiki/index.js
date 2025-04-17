import FeatureBase from '../core/feature-base.js';
import DOMUtils from '../core/dom-utils.js';
import MarkdownUtils from './helpers/markdown-utils.js';

/**
 * Classe pour la fonctionnalité d'amélioration du wiki
 * Ajoute un bouton avec des templates à la barre d'outils du wiki
 */
class BetterWiki extends FeatureBase {
  constructor(config) {
    super('betterWiki', config);
    this.templates = this.featureConfig.templates || [];
  }

  /**
   * Initialise la fonctionnalité Better Wiki
   */
  async initFeature() {
    try {
      const toolbar = await this.getToolbarWithRetry();

      // Vérifier si le bouton existe déjà
      const existingButton = document.getElementById("CommandBar0template-menu-item");
      if (existingButton) {
        console.log("Button already exists, skipping creation.");
        return;
      }

      this.addTemplateButton(toolbar);
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Better Wiki:", error.message);
    }
  }

  /**
   * Récupère la barre d'outils avec plusieurs tentatives
   * @param {number} retries - Nombre de tentatives
   * @param {number} delay - Délai entre les tentatives en ms
   * @returns {Promise<HTMLElement>}
   */
  async getToolbarWithRetry(retries = 10, delay = 200) {
    return DOMUtils.waitForElement(".ms-CommandBar-primaryCommands", retries, delay);
  }

  /**
   * Ajoute le bouton de templates à la barre d'outils
   * @param {HTMLElement} toolbar - La barre d'outils
   */
  addTemplateButton(toolbar) {
    // Créer le bouton
    const newButton = DOMUtils.createElement('div', {
      className: "ms-CommandBarItem item_278ff396 markdowntoolbar-button"
    });
    
    newButton.innerHTML = `
      <div class="ms-TooltipHost host_3d36397f">
        <button name="Templates" class="ms-CommandBarItem-link itemLink_278ff396" icon="Add" title="Templates" id="CommandBar0template-menu-item" data-command-key="template-menu-item" aria-haspopup="true" aria-expanded="false" role="menuitem" aria-label="Templates" aria-setsize="16" aria-posinset="16" tabindex="-1">
          <i data-icon-name="Add" role="presentation" aria-hidden="true" class="ms-CommandBarItem-icon itemIcon_278ff396 ms-CommandBarItem-iconColor itemIconColor_278ff396 root-41">➕</i>
          <span class="ms-CommandBarItem-commandText itemCommandText_278ff396">Templates</span>
        </button>
      </div>
    `;

    // Ajouter le bouton à la barre d'outils
    toolbar.appendChild(newButton);

    // Créer le dropdown
    const dropdown = this.createTemplateDropdown();
    document.body.appendChild(dropdown);

    // Ajouter les événements
    newButton.querySelector("button").addEventListener("click", (e) => {
      const rect = e.target.getBoundingClientRect();
      dropdown.style.top = `${rect.bottom + window.scrollY}px`;
      dropdown.style.left = `${rect.left + window.scrollX}px`;
      dropdown.classList.toggle("hidden");
    });

    // Cacher le dropdown si on clique ailleurs
    document.addEventListener("click", (e) => {
      if (!newButton.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.classList.add("hidden");
      }
    });

    console.log("Custom button with templates dropdown added to the toolbar.");
  }

  /**
   * Crée la liste déroulante des templates
   * @returns {HTMLElement} - L'élément dropdown créé
   */
  createTemplateDropdown() {
    const dropdown = DOMUtils.createElement('ul', {
      className: "custom-dropdown hidden"
    });

    if (this.templates.length > 0) {
      this.templates.forEach((template, index) => {
        const listItem = DOMUtils.createElement('li', {
          className: "custom-dropdown-item",
          role: "menuitem"
        });
        
        listItem.innerHTML = `
          <button class="ms-ContextualMenu-link root-61" tabindex="${index === 0 ? "0" : "-1"}">
            <div class="ms-ContextualMenu-linkContent linkContent-64">
              <i class="ms-ContextualMenu-icon icon-73">${template.emoji || "📄"}</i>
              <span class="ms-ContextualMenu-itemText label-69">${template.title}</span>
            </div>
          </button>
        `;

        listItem.addEventListener("click", () => {
          MarkdownUtils.insertTemplateContent(template.content);
          dropdown.classList.add("hidden");
        });

        dropdown.appendChild(listItem);
      });
    } else {
      const noTemplatesItem = DOMUtils.createElement('li', {
        className: "custom-dropdown-item",
        role: "menuitem"
      });
      
      noTemplatesItem.innerHTML = `
        <button class="ms-ContextualMenu-link root-61" tabindex="0" disabled>
          <div class="ms-ContextualMenu-linkContent linkContent-64">
            <span class="ms-ContextualMenu-itemText label-69">Aucun template disponible</span>
          </div>
        </button>
      `;
      
      dropdown.appendChild(noTemplatesItem);
    }

    return dropdown;
  }
}

// Nouveau point d'entrée pour l'initialisation de la fonctionnalité
// Écouter l'événement personnalisé lorsque tous les scripts sont chargés
document.addEventListener('ado-tools-scripts-loaded', (event) => {
  console.log("BetterWiki: Scripts chargés, initialisation...");
  const config = event.detail;

  // Vérifier si la configuration est valide et si la fonctionnalité est activée
  if (!config?.betterWiki?.enabled) return;

  // Initialiser la fonctionnalité
  const betterWiki = new BetterWiki(config);
  betterWiki.init();
});

// Pour la compatibilité avec les environnements de test, nous continuons à exporter la classe
export default BetterWiki;