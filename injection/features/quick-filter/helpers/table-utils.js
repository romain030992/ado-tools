/**
 * Utilitaires pour manipuler les tableaux dans la fonctionnalité QuickFilter
 */
const TableUtils = {
  /**
   * Crée une copie filtrable du tableau original
   * @param {HTMLElement} originalTable - Le tableau original
   * @param {Array} copiedRows - Tableau de lignes copiées
   * @returns {HTMLElement} - Le nouveau tableau filtrable
   */
  createFilterableTable(originalTable, copiedRows) {
    console.log(`Création du tableau filtrable avec ${copiedRows.length} lignes`);
    
    // Supprimer tout tableau filtrable existant
    const existingTable = originalTable.parentNode.querySelector('.filterable-table');
    if (existingTable) {
      existingTable.remove();
    }
    
    // Créer une copie du tableau
    const filterableTable = originalTable.cloneNode(true);
    filterableTable.classList.add('filterable-table');
    filterableTable.id = 'filterable-table';
    
    // Vider le corps du tableau
    const tbody = filterableTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Ajouter les lignes copiées
    copiedRows.forEach(row => {
      const clonedRow = row.cloneNode(true);
      tbody.appendChild(clonedRow);
    });
    
    // Cacher le tableau original
    originalTable.style.display = 'none';
    
    // Ajouter le tableau filtrable au DOM
    originalTable.parentNode.insertBefore(filterableTable, originalTable.nextSibling);
    
    // S'assurer que le tableau filtrable est visible
    filterableTable.style.display = '';
    
    console.log('Tableau filtrable créé et affiché');
    
    return filterableTable;
  },
  /**
   * Collecte toutes les lignes du tableau en défilant jusqu'au bas
   * @param {HTMLElement} originalTable - Le tableau original
   * @param {Function} onComplete - Callback appelé une fois toutes les lignes collectées
   * @returns {MutationObserver} - L'observateur créé pour détecter les nouvelles lignes
   */
  collectAllTableRows(originalTable, onComplete) {
    const tbody = originalTable.querySelector('tbody');
    
    if (!tbody) {
      console.error("Corps du tableau non trouvé");
      onComplete([]);
      return null;
    }
      // Ensemble pour suivre les lignes déjà collectées et éviter les doublons
    const collectedRowIds = new Set();
    let copiedRows = [];
    let previousRowCount = 0;
    let unchangedIterations = 0;
    const MAX_UNCHANGED_ITERATIONS = 3; // Nombre d'itérations sans changement avant de s'arrêter
    console.log("Démarrage de la collecte des lignes du tableau");
    
    // Fonction simple pour collecter les lignes actuellement dans le DOM
    const collectCurrentRows = () => {
      const rows = Array.from(tbody.querySelectorAll('tr'))
        .filter(row => !row.classList.contains('invisible'));
      
      rows.forEach(row => {
        // Identifier la ligne de façon unique
        const rowId = row.getAttribute('data-item-id') || 
                     row.id || 
                     row.getAttribute('aria-rowindex') || 
                     row.textContent.trim().substring(0, 50); // Utiliser le contenu comme backup
        
        if (rowId && !collectedRowIds.has(rowId)) {
          collectedRowIds.add(rowId);
          copiedRows.push(row);
        }
      });
      
      console.log(`${copiedRows.length} lignes collectées`);
    };      
    
    // Fonction pour faire défiler et collecter
    const scrollAndCollect = () => {      
      // Collecter les lignes actuellement visibles
      collectCurrentRows();
      
      // Vérifier si le nombre de lignes a changé depuis la dernière itération
      console.log(`Nombre total de lignes collectées: ${collectedRowIds.size} (précédemment: ${previousRowCount})`);
      if (collectedRowIds.size === previousRowCount) {
        unchangedIterations++;
        console.log(`Aucune nouvelle ligne détectée (${unchangedIterations}/${MAX_UNCHANGED_ITERATIONS})`);
        
        // Si le nombre de lignes n'a pas changé depuis plusieurs itérations, on arrête
        if (unchangedIterations >= MAX_UNCHANGED_ITERATIONS) {
          console.log(`Arrêt de la collecte après ${unchangedIterations} itérations sans nouvelles lignes`);
          onComplete(copiedRows);
          return;
        }
      } else {
        // Réinitialiser le compteur si de nouvelles lignes ont été détectées
        unchangedIterations = 0;
        previousRowCount = collectedRowIds.size;
      }
            
      // On scroll si c'est justifié
      const visibleRows = Array.from(tbody.querySelectorAll('tr'));
      console.log(`Nombre de lignes visibles : ${visibleRows.length}`);
      if (visibleRows.length > 10) {
        const targetIndex = Math.max(0, Math.min(visibleRows.length - 1, Math.floor(visibleRows.length * 0.9)));
        console.log(`Défilement forcé vers la ligne ${targetIndex}/${visibleRows.length}`);
        
        try {
          // Utiliser une fonction immédiate pour forcer le défilement
          (function forceScroll() {
            visibleRows[targetIndex].scrollIntoView({ block: 'center', behavior: 'auto' });
          })();
        } catch (error) {
          console.error("Erreur lors du défilement:", error);
        }

        // Continuer à défiler après un délai court
        const delay = 200;
        console.log(`Poursuite du défilement dans ${delay}ms...`);
        setTimeout(scrollAndCollect, delay);
      }
    };

    // Démarrer le processus de défilement et collecte
    setTimeout(scrollAndCollect, 100);
    
  },  /**
   * Filtre les lignes du tableau pour n'afficher que celles assignées à un utilisateur spécifique
   * @param {Array} rows - Tableau de lignes TR à filtrer
   * @param {number} assignedToIndex - Index de la colonne "Assigned To"
   * @param {string} selectedUser - Nom de l'utilisateur sélectionné
   */
  filterRowsByAssignedUser(rows, assignedToIndex, selectedUser) {
    console.log(`Filtrage des lignes pour l'utilisateur: ${selectedUser}`);
    
    // 1. D'abord, identifier les lignes enfants qui sont assignées à l'utilisateur
    const assignedChildRows = [];
    
    // 2. Ensuite, identifier les lignes parents correspondantes
    const parentRows = [];
    
    // Structure de données pour suivre les relations parent-enfant
    const parentChildRelations = new Map(); // Stocke la relation parent -> enfants
    const childParentRelations = new Map(); // Stocke la relation enfant -> parent
    
    // Première étape : analyser la structure hiérarchique et créer les relations
    const allRows = Array.from(document.querySelectorAll('.filterable-table tbody tr'));
    
    // Créer un index des niveaux (niveau 1 = parent, niveau 2 = enfant)
    const levelOneRows = [];
    const levelTwoRows = [];
    
    // Trier les lignes par niveau
    allRows.forEach(row => {
      const ariaLevel = parseInt(row.getAttribute('aria-level') || '0');
      if (ariaLevel === 1) {
        levelOneRows.push(row);
      } else if (ariaLevel === 2) {
        levelTwoRows.push(row);
      }
    });
    
    // Identifier les relations hiérarchiques basées sur l'ordre des éléments dans le DOM
    let currentParent = null;
    
    allRows.forEach(row => {
      const ariaLevel = parseInt(row.getAttribute('aria-level') || '0');
      
      if (ariaLevel === 1) {
        // C'est un parent
        currentParent = row;
        const rowId = row.getAttribute('data-item-id') || row.id || Math.random().toString(36);
        parentChildRelations.set(rowId, []);
      } else if (ariaLevel === 2 && currentParent) {
        // C'est un enfant du parent courant
        const parentId = currentParent.getAttribute('data-item-id') || currentParent.id;
        const childId = row.getAttribute('data-item-id') || row.id || Math.random().toString(36);
        
        // Ajouter à la relation parent -> enfants
        if (parentChildRelations.has(parentId)) {
          parentChildRelations.get(parentId).push(childId);
        }
        
        // Ajouter à la relation enfant -> parent
        childParentRelations.set(childId, parentId);
      }
    });
      // Identifier les enfants assignés à l'utilisateur et leurs parents
    const assignedChildIds = new Set();
    const parentsToShow = new Set();
    
    levelTwoRows.forEach(row => {
      const childId = row.getAttribute('data-item-id') || row.id;
      const assignedToCell = row.querySelector(`td:nth-child(${assignedToIndex})`);
      const assignedTo = assignedToCell ? assignedToCell.textContent.trim() : '';
      
      if (assignedTo === selectedUser) {
        // Cet enfant est assigné à l'utilisateur
        assignedChildIds.add(childId);
        
        // Trouver son parent
        const parentId = childParentRelations.get(childId);
        if (parentId) {
          parentsToShow.add(parentId);
        }
      }
    });
    
    console.log(`Trouvé ${assignedChildIds.size} tâches assignées à ${selectedUser}`);
    console.log(`${parentsToShow.size} parents à afficher`);
    
    // Appliquer le filtrage à toutes les lignes
    allRows.forEach(row => {
      const rowId = row.getAttribute('data-item-id') || row.id;
      const ariaLevel = parseInt(row.getAttribute('aria-level') || '0');
      
      if (ariaLevel === 1) {
        // Ligne parent: l'afficher uniquement si elle a des enfants assignés
        const shouldShow = parentsToShow.has(rowId);
        row.style.display = shouldShow ? '' : 'none';
        
        // Appliquer une classe spécifique
        if (shouldShow) {
          row.classList.add('has-assigned-children');
        } else {
          row.classList.remove('has-assigned-children');
        }      } else if (ariaLevel === 2) {
        // Ligne enfant: l'afficher uniquement si elle est assignée à l'utilisateur
        const childId = row.getAttribute('data-item-id') || row.id;
        row.style.display = assignedChildIds.has(childId) ? '' : 'none';
      } else {
        // Autres lignes: les cacher par défaut
        row.style.display = 'none';
      }
    });
    
    console.log('Filtrage terminé');
  }
};

export default TableUtils;