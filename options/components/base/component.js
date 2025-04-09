/**
 * Classe de base pour tous les composants
 */
export default class Component {
  /**
   * Crée une instance de Component
   * @param {HTMLElement} container - Élément conteneur
   * @param {Object} props - Propriétés du composant
   */
  constructor(container, props = {}) {
    this.container = container;
    this.props = props || {};
    this.elements = {};
    this.eventHandlers = [];
    this.render();
  }

  /**
   * Rend le composant dans le conteneur
   */
  render() {
    // À implémenter dans les sous-classes
    console.log('Component base render method called. This should be overridden.');
  }

  /**
   * Crée un élément DOM
   * @param {string} tagName - Nom de la balise HTML
   * @param {Object} attributes - Attributs de l'élément
   * @param {Object} eventListeners - Écouteurs d'événements
   * @param {string|HTMLElement} [content] - Contenu de l'élément
   * @returns {HTMLElement} - Élément créé
   */
  createElement(tagName, attributes = {}, eventListeners = {}, content) {
    const element = document.createElement(tagName);
    
    // Appliquer les attributs
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        if (key === 'className') {
          element.className = value;
        } else if (key === 'style' && typeof value === 'object') {
          Object.entries(value).forEach(([styleProp, styleValue]) => {
            element.style[styleProp] = styleValue;
          });
        } else {
          element.setAttribute(key, value);
        }
      }
    });
    
    // Ajouter les écouteurs d'événements
    Object.entries(eventListeners).forEach(([event, listener]) => {
      element.addEventListener(event, listener);
      
      // Stocker les références pour le nettoyage
      this.eventHandlers.push({
        element,
        event,
        listener
      });
    });
    
    // Ajouter le contenu
    if (content) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (content instanceof HTMLElement) {
        element.appendChild(content);
      }
    }
    
    return element;
  }

  /**
   * Stocke une référence vers un élément DOM
   * @param {string} key - Clé pour accéder à l'élément
   * @param {HTMLElement} element - Élément à stocker
   */
  storeElement(key, element) {
    this.elements[key] = element;
  }

  /**
   * Récupère un élément stocké
   * @param {string} key - Clé de l'élément à récupérer
   * @returns {HTMLElement|null} L'élément stocké ou null si non trouvé
   */
  getElement(key) {
    return this.elements[key] || null;
  }

  /**
   * Met à jour les propriétés du composant
   * @param {Object} newProps - Nouvelles propriétés
   */
  updateProps(newProps) {
    this.props = { ...this.props, ...newProps };
    this.render();
  }

  /**
   * Génère un identifiant unique pour les éléments du composant
   * @param {string} prefix - Préfixe pour l'identifiant
   * @returns {string} - Identifiant unique
   */
  generateId(prefix = '') {
    return `${prefix ? prefix + '-' : ''}${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Crée un élément avec du HTML brut (à utiliser avec précaution)
   * @param {string} html - Code HTML brut
   * @returns {DocumentFragment} - Fragment de document avec les éléments créés
   */
  createElementFromHTML(html) {
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    return template.content.cloneNode(true);
  }

  /**
   * Méthode pour comparer les valeurs actuelles avec les valeurs originales
   * @param {Object} current - Valeurs actuelles
   * @param {Object} original - Valeurs originales
   * @returns {boolean} - True si les valeurs sont différentes
   */
  hasUnsavedChanges(current, original) {
    return JSON.stringify(current) !== JSON.stringify(original);
  }

  /**
   * Détruit le composant et nettoie les ressources
   */
  destroy() {
    // Supprimer tous les écouteurs d'événements
    this.eventHandlers.forEach(({element, event, listener}) => {
      element.removeEventListener(event, listener);
    });
    
    // Vider les tableaux et objets
    this.eventHandlers = [];
    this.elements = {};
    
    // Vider le conteneur
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}