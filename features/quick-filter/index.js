import FeatureBase from '../core/feature-base.js';
import DOMUtils from '../core/dom-utils.js';
import UserUtils from './helpers/user-utils.js';
import TableUtils from './helpers/table-utils.js';

/**
 * Classe pour la fonctionnalité de filtre rapide
 * Permet de filtrer les tâches par utilisateur assigné
 */
class QuickFilter extends FeatureBase {
  constructor(config) {
    super('quickFilter', config);
    
    // Index et collections
    this.assignedToIndex = -1;
    this.users = [];
    this.selectedUserIndex = -1;
    this.copiedRows = [];
    
    // Éléments DOM
    this.expandAllButton = null;
    this.filterButtonsContainer = null;
    this.startFilterSessionButton = null;
    this.stopFilterSessionButton = null;
    this.previousUserButton = null;
    this.nextUserButton = null;
    this.selectedUserElement = null;
    this.originalTable = null;
    this.filterableTable = null;
    this.observer = null;
  }

  /**
   * Initialise la fonctionnalité de filtre rapide
   */
  initFeature() {
    console.log("Initialisation de la fonctionnalité de filtre rapide...");
    
    // Charger les utilisateurs depuis la configuration
    this.users = UserUtils.shuffleUsersByDate(this.featureConfig.persons || []);
    
    // Chercher les éléments requis dans le DOM
    this.findRequiredElements();
    
    // Vérifier si les éléments requis sont présents
    if (this.originalTable && this.assignedToIndex !== -1 && this.expandAllButton) {
      this.createInterface();
    } else {
      console.log("Éléments requis non trouvés pour le filtre rapide");
    }
  }

  /**
   * Recherche les éléments requis dans le DOM
   */
  findRequiredElements() {
    // Trouver le tableau et le conteneur des en-têtes
    this.originalTable = document.querySelector('table.backlog-tree');
    
    // Supprimer tout conteneur existant
    const existingContainer = document.getElementById('filterButtonsContainer');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    // Si le tableau n'est pas trouvé, on arrête là
    if (!this.originalTable) {
      console.log("Tableau non trouvé");
      return;
    }
    
    // Trouver l'index de la colonne "Assigned To"
    const headers = this.originalTable.querySelectorAll('thead th');
    headers.forEach((header, index) => {
      const headerText = header.textContent.trim().toLowerCase();
      if (headerText === 'assigned to') {
        this.assignedToIndex = index + 1;
      }
    });
    
    // Trouver le bouton "Expand All"
    this.expandAllButton = document.querySelector('button.expand-collapse-button');
  }

  /**
   * Crée l'interface utilisateur pour le filtre rapide
   */
  createInterface() {
    // Trouver le conteneur des headers de backlog
    const backlogHeaders = document.querySelector('div.sprints-header-dates>div');
    if (!backlogHeaders) {
      console.log("Conteneur des en-têtes de backlog non trouvé");
      return;
    }
    
    // Créer le conteneur pour les boutons de filtre
    this.filterButtonsContainer = DOMUtils.createElement('div', {
      id: 'filterButtonsContainer'
    });
    
    // Bouton "Démarrer le daily"
    this.startFilterSessionButton = this.createButton('Démarrer le daily', () => {
      this.expandAllButton.click();
      this.startFilterSession();
    });
    
    // Bouton "Arrêter le daily"
    this.stopFilterSessionButton = this.createButton('Arrêter le daily', () => {
      this.stopFilterSession();
    });
    this.stopFilterSessionButton.style.display = 'none';
    
    // Bouton "<" (précédent)
    this.previousUserButton = this.createButton('<', () => {
      this.selectUser(this.selectedUserIndex - 1);
    });
    this.previousUserButton.style.display = 'none';
    
    // Élément affichant l'utilisateur sélectionné
    this.selectedUserElement = DOMUtils.createElement('button', {
      className: 'bolt-button',
      style: {
        minWidth: '180px'
      }
    });
    this.selectedUserElement.style.display = 'none';
    
    // Bouton ">" (suivant)
    this.nextUserButton = this.createButton('>', () => {
      this.selectUser(this.selectedUserIndex + 1);
    });
    this.nextUserButton.style.display = 'none';
    
    // Créer la liste déroulante des utilisateurs
    const userSelectionContainer = this.createUserSelectionDropdown();
    
    // Ajouter le conteneur de sélection d'utilisateur au DOM
    this.filterButtonsContainer.appendChild(userSelectionContainer);
    
    // Ajouter l'événement pour afficher/cacher la liste déroulante
    this.selectedUserElement.addEventListener('click', () => {
      userSelectionContainer.style.display = 
        userSelectionContainer.style.display === 'none' ? '' : 'none';
    });
    
    // Masquer la liste déroulante lors d'un clic en dehors
    document.addEventListener('click', (event) => {
      if (!this.selectedUserElement.contains(event.target) && 
          !userSelectionContainer.contains(event.target)) {
        userSelectionContainer.style.display = 'none';
      }
    });
    
    // Ajouter tous les boutons au conteneur
    this.filterButtonsContainer.appendChild(this.startFilterSessionButton);
    this.filterButtonsContainer.appendChild(this.stopFilterSessionButton);
    this.filterButtonsContainer.appendChild(this.previousUserButton);
    this.filterButtonsContainer.appendChild(this.selectedUserElement);
    this.filterButtonsContainer.appendChild(this.nextUserButton);
    
    // Ajouter le conteneur au DOM
    backlogHeaders.appendChild(this.filterButtonsContainer); 
    
    // Initialiser l'état des boutons de navigation
    this.updateNavigationButtons();
  }

  /**
   * Crée un bouton standard pour l'interface
   * @param {string} text - Texte du bouton
   * @param {Function} onClick - Fonction à appeler au clic
   * @returns {HTMLElement} - Le bouton créé
   */
  createButton(text, onClick) {
    return DOMUtils.createElement('button', {
      className: 'bolt-button enabled bolt-focus-treatment'
    }, {
      click: onClick
    }, text);
  }

  /**
   * Crée la liste déroulante pour sélectionner les utilisateurs
   * @returns {HTMLElement} - Le conteneur de la liste déroulante
   */
  createUserSelectionDropdown() {
    // Créer le conteneur de la liste déroulante
    const userSelectionContainer = DOMUtils.createElement('div', {
      style: {
        display: 'none',
        position: 'absolute',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: '1000',
        width: '180px',
        marginTop: '35px',
        marginLeft: '175px',
        borderRadius: '5px',
        boxShadow: '0 0 5px #ccc',
        padding: '5px',
        boxSizing: 'border-box'
      }
    });
    
    // Créer la liste des utilisateurs
    const userSelectionList = DOMUtils.createElement('ul', {
      style: {
        listStyle: 'none',
        padding: '0',
        margin: '0'
      }
    });
    
    // Ajouter les éléments de la liste
    this.users.forEach((user, index) => {
      const userSelectionItem = DOMUtils.createElement('li', {
        style: {
          cursor: 'pointer',
          padding: '5px'
        }
      }, {
        click: () => {
          this.selectUser(index);
          userSelectionContainer.style.display = 'none';
        }
      }, user);
      userSelectionList.appendChild(userSelectionItem);
    });
    
    // Ajouter la liste au conteneur
    userSelectionContainer.appendChild(userSelectionList);
    
    return userSelectionContainer;
  }

  /**
   * Démarre la session de filtrage
   */
  startFilterSession() {
    // Masquer le bouton de démarrage et afficher les autres boutons
    this.startFilterSessionButton.style.display = 'none';
    this.stopFilterSessionButton.style.display = '';
    this.previousUserButton.style.display = '';
    this.nextUserButton.style.display = '';
    
    // Initialiser et afficher le tableau filtrable
    this.displayFilterableTable();
  }

  /**
   * Arrête la session de filtrage
   */
  stopFilterSession() {
    this.selectedUserIndex = -1;
    this.startFilterSessionButton.style.display = '';
    this.stopFilterSessionButton.style.display = 'none';
    this.previousUserButton.style.display = 'none';
    this.nextUserButton.style.display = 'none';
    
    this.displayOriginalTable();
    this.updateNavigationButtons();
  }

  /**
   * Affiche le tableau filtrable
   */
  displayFilterableTable() {
    // Si le tableau filtrable existe déjà, l'afficher simplement
    if (this.filterableTable) {
      this.filterableTable.style.display = '';
      this.originalTable.style.display = 'none';
      this.selectUser(0);
      return;
    }
    
    // Sinon, cliquer sur "Expand All" pour développer toutes les lignes
    this.expandAllButton.click();
    
    // Récupérer toutes les lignes du tableau
    this.observer = TableUtils.collectAllTableRows(this.originalTable, (copiedRows) => {
      this.copiedRows = copiedRows;
      
      // Créer le tableau filtrable
      this.filterableTable = TableUtils.createFilterableTable(
        this.originalTable, 
        this.copiedRows
      );
      
      // Sélectionner le premier utilisateur pour filtrer le tableau
      this.selectUser(0);
    });
  }

  /**
   * Restaure l'affichage du tableau original
   */
  displayOriginalTable() {
    if (this.filterableTable) {
      this.filterableTable.style.display = 'none';
      this.originalTable.style.display = '';
    }
  }

  /**
   * Filtre le tableau pour n'afficher que les tâches assignées à l'utilisateur sélectionné
   */
  filterSelectedUser() {
    if (this.selectedUserIndex === -1 || !this.copiedRows) return;
    
    TableUtils.filterRowsByAssignedUser(
      this.copiedRows,
      this.assignedToIndex,
      this.users[this.selectedUserIndex]
    );
  }

  /**
   * Met à jour l'état des boutons de navigation
   */
  updateNavigationButtons() {
    // Mise à jour de l'affichage des boutons en fonction du contexte
    if (this.selectedUserIndex === -1) {
      this.selectedUserElement.textContent = '';
      this.selectedUserElement.style.display = 'none';
    } else {
      this.selectedUserElement.textContent = this.users[this.selectedUserIndex];
      this.selectedUserElement.style.display = '';
    }
    
    // Mise à jour de l'état du bouton précédent
    this.previousUserButton.classList.toggle('disabled', this.selectedUserIndex <= 0);
    this.previousUserButton.classList.toggle('enabled', this.selectedUserIndex > 0);
    this.previousUserButton.disabled = this.selectedUserIndex <= 0;
    
    // Mise à jour de l'état du bouton suivant
    this.nextUserButton.classList.toggle('disabled', this.selectedUserIndex >= this.users.length - 1);
    this.nextUserButton.classList.toggle('enabled', this.selectedUserIndex < this.users.length - 1);
    this.nextUserButton.disabled = this.selectedUserIndex >= this.users.length - 1;
  }

  /**
   * Sélectionne un utilisateur par son index dans la liste
   * @param {number} index - Index de l'utilisateur dans la liste
   */
  selectUser(index) {
    if (index >= 0 && index < this.users.length) {
      this.selectedUserIndex = index;
      this.selectedUserElement.textContent = this.users[this.selectedUserIndex];
      this.filterSelectedUser();
      this.updateNavigationButtons();
    }
  }
}

// Nouveau point d'entrée pour l'initialisation de la fonctionnalité
// Écouter l'événement personnalisé lorsque tous les scripts sont chargés
document.addEventListener('ado-tools-scripts-loaded', (event) => {
  console.log("QuickFilter: Scripts chargés, initialisation...");
  const config = event.detail;

  // Vérifier si la configuration est valide et si la fonctionnalité est activée
  if (!config?.quickFilter?.enabled) return;

  // Initialiser la fonctionnalité
  const quickFilter = new QuickFilter(config);
  quickFilter.init();
});

// Pour la compatibilité avec les environnements de test, nous continuons à exporter la classe
export default QuickFilter;