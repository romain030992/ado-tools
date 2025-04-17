import FeatureBase from '../core/feature-base.js';
import DOMUtils from '../core/dom-utils.js';
import ColorUtils from './helpers/color-utils.js';

/**
 * Classe pour la fonctionnalité de dérive des tâches
 * Permet de visualiser les dérives entre l'estimation originale et le travail réel
 */
class TaskDrift extends FeatureBase {
  constructor(config) {
    super('taskDrift', config);
    
    // Index des colonnes importantes
    this.originalEstimateIndex = -1;
    this.remainingWorkIndex = -1;
    this.completedWorkIndex = -1;
    
    // Configuration des couleurs et seuils
    this.colors = {
      noEstimate: { r: 0, g: 0, b: 255 },      // Bleu par défaut
      firstThreshold: { r: 0, g: 255, b: 0 },  // Vert par défaut
      secondThreshold: { r: 255, g: 165, b: 0 },// Orange par défaut
      lastThreshold: { r: 255, g: 0, b: 0 }    // Rouge par défaut
    };
    
    this.thresholds = {
      first: 0,
      second: 50
    };
    
    // Charger la configuration
    this.loadConfiguration();
  }

  /**
   * Charge la configuration depuis les paramètres
   */
  loadConfiguration() {
    // Charger les couleurs depuis la configuration
    if (this.featureConfig.noEstimateColor) {
      this.colors.noEstimate = ColorUtils.parseColor(this.featureConfig.noEstimateColor);
    }
    
    if (this.featureConfig.firstThresholdColor) {
      this.colors.firstThreshold = ColorUtils.parseColor(this.featureConfig.firstThresholdColor);
    }
    
    if (this.featureConfig.secondThresholdColor) {
      this.colors.secondThreshold = ColorUtils.parseColor(this.featureConfig.secondThresholdColor);
    }
    
    if (this.featureConfig.lastThresholdColor) {
      this.colors.lastThreshold = ColorUtils.parseColor(this.featureConfig.lastThresholdColor);
    }
    
    // Charger les seuils depuis la configuration
    if (this.featureConfig.firstThreshold !== undefined) {
      this.thresholds.first = this.featureConfig.firstThreshold;
    }
    
    if (this.featureConfig.secondThreshold !== undefined) {
      this.thresholds.second = this.featureConfig.secondThreshold;
    }
  }

  /**
   * Initialise la fonctionnalité de dérive des tâches
   */
  initFeature() {
    console.log("Initialisation de la fonctionnalité de dérive des tâches...");
    
    const table = document.querySelector('table.backlog-tree');
    if (!table) {
      console.log("Table de backlog non trouvée");
      return;
    }

    this.findColumns(table);
    
    if (this.originalEstimateIndex !== -1 && this.remainingWorkIndex !== -1 && this.completedWorkIndex !== -1) {
      this.handleTaskDrift(table);
      this.observeTableChanges(table);
    } else {
      console.log("Colonnes nécessaires non trouvées pour la dérive des tâches");
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
      
      if (headerText === 'original estimate') {
        this.originalEstimateIndex = index + 1;
      }
      if (headerText === 'remaining work') {
        this.remainingWorkIndex = index + 1;
      }
      if (headerText === 'completed work') {
        this.completedWorkIndex = index + 1;
      }
    });

    console.log(`Colonnes trouvées: originalEstimate=${this.originalEstimateIndex}, remainingWork=${this.remainingWorkIndex}, completedWork=${this.completedWorkIndex}`);
  }

  /**
   * Applique la coloration de dérive des tâches à toutes les lignes du tableau
   * @param {HTMLElement} table - Le tableau de backlog
   */
  handleTaskDrift(table) {
    table.querySelectorAll('tbody tr').forEach(taskRow => {
      let icon = taskRow.querySelector('span.bowtie-symbol-task');
      if (!icon) return;

      // Récupérer les valeurs des colonnes pertinentes
      let originalEstimateValue = this.getNumericCellValue(taskRow, this.originalEstimateIndex);
      let remainingWorkValue = this.getNumericCellValue(taskRow, this.remainingWorkIndex);
      let completedWorkValue = this.getNumericCellValue(taskRow, this.completedWorkIndex);
      
      // Calculer et appliquer la couleur de dérive
      const driftColor = ColorUtils.calculateDriftColor(
        originalEstimateValue, 
        remainingWorkValue, 
        completedWorkValue,
        this.colors,
        this.thresholds
      );
      
      icon.style.setProperty('--dynamic-color', driftColor);
    });
  }

  /**
   * Récupère la valeur numérique d'une cellule
   * @param {HTMLElement} row - La ligne du tableau
   * @param {number} columnIndex - L'index de la colonne
   * @returns {number} - La valeur numérique (0 si non numérique)
   */
  getNumericCellValue(row, columnIndex) {
    const cell = row.querySelector(`td:nth-child(${columnIndex})`);
    if (!cell) return 0;
    
    const value = parseFloat(cell.textContent.trim());
    return isNaN(value) ? 0 : value;
  }

  /**
   * Observe les changements dans le tableau pour mettre à jour la dérive des tâches
   * @param {HTMLElement} table - Le tableau de backlog
   */
  observeTableChanges(table) {
    const observer = new MutationObserver(() => {
      this.handleTaskDrift(table);
    });
    
    observer.observe(table, { childList: true, subtree: true });
    console.log("Observateur de changements installé pour la dérive des tâches");
  }
}

// Nouveau point d'entrée pour l'initialisation de la fonctionnalité
// Écouter l'événement personnalisé lorsque tous les scripts sont chargés
document.addEventListener('ado-tools-scripts-loaded', (event) => {
  console.log("TaskDrift: Scripts chargés, initialisation...");
  const config = event.detail;

  // Vérifier si la configuration est valide et si la fonctionnalité est activée
  if (!config?.taskDrift?.enabled) return;

  // Initialiser la fonctionnalité
  const taskDrift = new TaskDrift(config);
  taskDrift.init();
});

// Pour la compatibilité avec les environnements de test, nous continuons à exporter la classe
export default TaskDrift;