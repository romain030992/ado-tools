import FeatureBase from '../core/feature-base.js';
import DOMUtils from '../core/dom-utils.js';
import PuceDiv from './components/puce-div.js';

/**
 * Classe pour la fonctionnalité d'agrégation par statut
 * Permet de voir les totaux de story points par état
 */
class StatusAggregation extends FeatureBase {
  constructor(config) {
    super('statusAggregation', config);
    this.storyPointsIndex = -1;
    this.stateIndex = -1;
    this.allPuce = null; // Puce "Tous"
    this.statePuces = []; // Puces pour chaque état
    this.resultDiv = null;
  }

  /**
   * Initialise la fonctionnalité d'agrégation par statut
   */
  initFeature() {
    console.log("Initialisation de la fonctionnalité d'agrégation par statut...");
    
    const table = document.querySelector('table.backlog-tree');
    if (!table) {
      console.log("Table de backlog non trouvée");
      return;
    }

    this.findColumns(table);
    
    if (this.storyPointsIndex !== -1 && this.stateIndex !== -1) {
      this.calculateAndDisplayTotals(table);
    } else {
      console.log(`Colonnes "${this.featureConfig.columnName}" ou "State" non trouvées`);
    }
  }

  /**
   * Trouve les indices des colonnes nécessaires dans le tableau
   * @param {HTMLElement} table - Le tableau de backlog
   */
  findColumns(table) {
    const headers = table.querySelectorAll('thead th');

    headers.forEach((header, index) => {
      const headerText = header.textContent.trim().toLowerCase();
      if (headerText === this.featureConfig.columnName?.toLowerCase()) {
        this.storyPointsIndex = index + 1; // Les index des colonnes commencent à 1 pour querySelector
      }
      if (headerText === 'state') {
        this.stateIndex = index + 1;
      }
    });

    console.log(`Colonnes trouvées: storyPointsIndex=${this.storyPointsIndex}, stateIndex=${this.stateIndex}`);
  }

  /**
   * Calcule et affiche les totaux par état
   * @param {HTMLElement} table - Le tableau de backlog
   */
  calculateAndDisplayTotals(table) {
    const stateTotals = this.calculateStateTotals(table);
    
    // Supprimer l'ancienne div si elle existe
    const existingResultDiv = document.querySelector('#story-points-summary');
    if (existingResultDiv) {
      existingResultDiv.remove();
    }

    // Création de la nouvelle div avec les résultats
    this.resultDiv = document.createElement('div');
    this.resultDiv.id = 'story-points-summary';

    let grandTotal = 0;

    // Ajout des puces pour chaque état
    this.statePuces = [];
    for (const [state, total] of Object.entries(stateTotals)) {
      const backgroundColor = this.getStateColor(state);
      const stateDiv = PuceDiv.create(`${state} : ${total}`, backgroundColor, state);
      this.resultDiv.appendChild(stateDiv);
      grandTotal += total;
      this.statePuces.push(stateDiv);
    }

    // Ajout de la puce "Tous"
    this.allPuce = PuceDiv.createTotalPuce(grandTotal);
    this.resultDiv.insertBefore(this.allPuce, this.resultDiv.firstChild);

    // Insérer le résultat dans la page
    const backlogsViewDiv = document.querySelector('.backlogs-view');
    if (backlogsViewDiv) {
      backlogsViewDiv.parentNode.insertBefore(this.resultDiv, backlogsViewDiv);
    } else {
      console.log('Div avec la classe "backlogs-view" non trouvée');
    }

    // Surveiller les changements de sélection
    this.observeSelectionChanges(table);
  }

  /**
   * Calcule les totaux de story points par état
   * @param {HTMLElement} table - Le tableau de backlog
   * @returns {Object} - Objet avec les totaux par état
   */
  calculateStateTotals(table) {
    const stateTotals = {};
    const rows = table.querySelectorAll('tbody tr');

    rows.forEach(row => {
      const storyPointsCell = row.querySelector(`td:nth-child(${this.storyPointsIndex})`);
      const stateCell = row.querySelector(`td:nth-child(${this.stateIndex})`);

      if (storyPointsCell && stateCell) {
        const state = stateCell.textContent.trim();
        const value = parseFloat(storyPointsCell.textContent.trim());

        if (!isNaN(value)) {
          if (!stateTotals[state]) {
            stateTotals[state] = 0;
          }
          stateTotals[state] += value;
        }
      }
    });

    return stateTotals;
  }

  /**
   * Récupère la couleur associée à un état
   * @param {string} state - L'état
   * @returns {string} - La couleur au format hexadécimal
   */
  getStateColor(state) {
    const stateConfig = this.featureConfig.statuses?.find(item => item.name === state);
    if (stateConfig) {
      return stateConfig.color;
    }
    // Couleur aléatoire si l'état n'est pas configuré
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  }

  /**
   * Observe les changements de sélection dans le tableau
   * @param {HTMLElement} table - Le tableau de backlog
   */
  observeSelectionChanges(table) {
    const observer = new MutationObserver(() => {
      const existingSelectedDiv = document.querySelector('#selected-story-points-summary');
      if (existingSelectedDiv) {
        existingSelectedDiv.remove();
      }

      const selectedRows = table.querySelectorAll('tbody tr.selected');
      if (selectedRows.length >= 2) {
        let selectedTotal = 0;
        selectedRows.forEach(row => {
          const storyPointsCell = row.querySelector(`td:nth-child(${this.storyPointsIndex})`);
          if (storyPointsCell) {
            const value = parseFloat(storyPointsCell.textContent.trim());
            if (!isNaN(value)) {
              selectedTotal += value;
            }
          }
        });

        // Ajouter la nouvelle div de somme sélectionnée
        const selectedDiv = PuceDiv.createSelectionPuce(selectedTotal);
        this.resultDiv.insertBefore(selectedDiv, this.resultDiv.firstChild);
      }
    });
    
    observer.observe(table, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }
}

// Nouveau point d'entrée pour l'initialisation de la fonctionnalité
// Écouter l'événement personnalisé lorsque tous les scripts sont chargés
document.addEventListener('ado-tools-scripts-loaded', (event) => {
  console.log("StatusAggregation: Scripts chargés, initialisation...");
  const config = event.detail;

  // Vérifier si la configuration est valide et si la fonctionnalité est activée
  if (!config?.statusAggregation?.enabled) return;

  // Initialiser la fonctionnalité
  const statusAggregation = new StatusAggregation(config);
  statusAggregation.init();
});

// Pour la compatibilité avec les environnements de test, nous continuons à exporter la classe
export default StatusAggregation;