/**
 * Utilitaires pour manipulation du DOM
 * Fournit des méthodes pratiques pour interagir avec le DOM
 */
const DOMUtils = {
  /**
   * Attend qu'un élément soit présent dans le DOM
   * @param {string} selector - Sélecteur CSS
   * @param {number} retries - Nombre de tentatives
   * @param {number} delay - Délai entre les tentatives en ms
   * @returns {Promise<Element>}
   */
  waitForElement(selector, retries = 10, delay = 200) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      if (retries <= 0) {
        reject(new Error(`Élément ${selector} non trouvé après plusieurs tentatives`));
        return;
      }

      setTimeout(() => {
        this.waitForElement(selector, retries - 1, delay)
          .then(resolve)
          .catch(reject);
      }, delay);
    });
  },

  /**
   * Crée un élément avec des attributs et des événements
   * @param {string} tag - Tag HTML à créer
   * @param {Object} attributes - Attributs à appliquer à l'élément
   * @param {Object} events - Événements à attacher à l'élément
   * @param {string|Node} content - Contenu à insérer dans l'élément
   * @returns {HTMLElement}
   */
  createElement(tag, attributes = {}, events = {}, content = null) {
    const element = document.createElement(tag);
    
    // Appliquer les attributs
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        Object.entries(value).forEach(([prop, val]) => {
          element.style[prop] = val;
        });
      } else {
        element.setAttribute(key, value);
      }
    });
    
    // Attacher les événements
    Object.entries(events).forEach(([event, handler]) => {
      element.addEventListener(event, handler);
    });
    
    // Ajouter le contenu
    if (content) {
      if (typeof content === 'string') {
        element.innerHTML = content;
      } else {
        element.appendChild(content);
      }
    }
    
    return element;
  },

  /**
   * Ajoute une feuille de style personnalisée à la page
   * @param {string} cssText - Contenu CSS à ajouter
   * @param {string} id - ID à donner à l'élément <style> (optionnel)
   * @returns {HTMLElement} - L'élément style créé
   */
  addStyleToPage(cssText, id = null) {
    const style = document.createElement('style');
    style.textContent = cssText;
    if (id) style.id = id;
    document.head.appendChild(style);
    return style;
  }
};

export default DOMUtils;