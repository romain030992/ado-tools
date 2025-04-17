/**
 * Composant pour les puces d'état dans l'agrégation par statut
 * Permet d'afficher des totaux de story points par état
 */
class PuceDiv {
  /**
   * Crée une puce d'état avec du texte et une couleur de fond
   * @param {string} text - Le texte à afficher dans la puce
   * @param {string} backgroundColor - La couleur de fond de la puce (code hexadecimal)
   * @param {string} state - L'état associé à la puce (optionnel)
   * @param {string} id - ID optionnel pour la puce
   * @returns {HTMLElement} - L'élément div créé
   */
  static create(text, backgroundColor, state = null, id = null) {
    const div = document.createElement('div');
    div.style.backgroundColor = backgroundColor;
    div.textContent = text;
    div.classList.add('puce');
    
    if (state) {
      div.dataset.state = state; // Stocker l'état associé à la puce
    }
    
    if (id) {
      div.id = id;
    }
    
    return div;
  }

  /**
   * Crée une puce "Tous" avec le total général
   * @param {number} total - Le total général
   * @returns {HTMLElement} - L'élément div créé
   */
  static createTotalPuce(total) {
    return this.create(`Tous : ${total}`, '#8c77ab', null, 'all-story-points-summary');
  }

  /**
   * Crée une puce "Sélection" avec le total des éléments sélectionnés
   * @param {number} total - Le total des éléments sélectionnés
   * @returns {HTMLElement} - L'élément div créé
   */
  static createSelectionPuce(total) {
    return this.create(`Sélection : ${total}`, '#d7beff', null, 'selected-story-points-summary');
  }
}

export default PuceDiv;