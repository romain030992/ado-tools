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
    // Cacher le tableau original
    originalTable.style.display = 'none';
    
    // Créer une copie du tableau
    const filterableTable = originalTable.cloneNode(true);
    
    // Vider le corps du tableau
    const tbody = filterableTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Ajouter les lignes copiées
    copiedRows.forEach(row => tbody.appendChild(row.cloneNode(true)));
    
    // Ajouter le tableau filtrable au DOM
    originalTable.parentNode.appendChild(filterableTable);
    
    // Afficher le tableau filtrable
    filterableTable.style.display = '';
    
    return filterableTable;
  },

  /**
   * Collecte toutes les lignes du tableau en défilant jusqu'au bas
   * @param {HTMLElement} originalTable - Le tableau original
   * @param {Function} onComplete - Callback appelé une fois toutes les lignes collectées
   * @returns {MutationObserver} - L'observateur créé pour détecter les nouvelles lignes
   */
  collectAllTableRows(originalTable, onComplete) {
    // Obtenir le nombre total de lignes du tableau
    const totalRowCount = parseInt(originalTable.getAttribute('aria-rowcount'));
    
    // Initialiser avec les lignes déjà présentes
    let copiedRows = Array.from(originalTable.querySelectorAll('tbody tr'))
      .filter(row => !row.classList.contains('invisible'));
    
    // Créer un observer pour surveiller l'ajout de nouvelles lignes pendant le défilement
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Ajouter les nouvelles lignes au tableau de lignes copiées
          const newRows = Array.from(mutation.addedNodes)
            .filter(node => node.nodeName === 'TR');
          
          if (newRows.length > 0) {
            copiedRows = copiedRows.concat(newRows);
            
            // Vérifier si on a atteint la fin du tableau
            const lastRowIndex = parseInt(newRows[newRows.length - 1]
              .getAttribute('aria-rowindex'));
            
            if (lastRowIndex === totalRowCount) {
              // Déconnecter l'observer une fois toutes les lignes chargées
              observer.disconnect();
              
              // Appeler le callback avec les lignes collectées
              onComplete(copiedRows);
            }
          }
        }
      }
    });
    
    // Commencer à observer le corps du tableau
    observer.observe(originalTable.querySelector('tbody'), 
      { childList: true, subtree: true });
    
    // Faire défiler jusqu'au bas du tableau pour charger toutes les lignes
    originalTable.scrollIntoView({ block: 'end', behavior: 'smooth' });
    
    return observer;
  },

  /**
   * Filtre les lignes du tableau pour n'afficher que celles assignées à un utilisateur spécifique
   * @param {Array} rows - Tableau de lignes TR à filtrer
   * @param {number} assignedToIndex - Index de la colonne "Assigned To"
   * @param {string} selectedUser - Nom de l'utilisateur sélectionné
   */
  filterRowsByAssignedUser(rows, assignedToIndex, selectedUser) {
    let showParentRow = false;
    
    rows.forEach((row, index) => {
      const ariaLevel = row.getAttribute('aria-level');
      const assignedToCell = row.querySelector(`td:nth-child(${assignedToIndex})`);
      const assignedTo = assignedToCell ? assignedToCell.textContent.trim() : '';
      
      if (ariaLevel === '1') {
        showParentRow = false;
        // Vérifier les lignes enfants pour voir si elles sont assignées à l'utilisateur sélectionné
        for (let i = index + 1; i < rows.length; i++) {
          const nextRow = rows[i];
          const nextAriaLevel = nextRow.getAttribute('aria-level');
          
          if (nextAriaLevel === '1') break; // Arrêter si on atteint la prochaine ligne parent
          
          if (nextAriaLevel === '2') {
            const nextAssignedToCell = nextRow.querySelector(`td:nth-child(${assignedToIndex})`);
            const nextAssignedTo = nextAssignedToCell ? nextAssignedToCell.textContent.trim() : '';
            
            if (nextAssignedTo === selectedUser) {
              showParentRow = true;
              break;
            }
          }
        }
        
        row.style.display = showParentRow ? '' : 'none';
      } else if (ariaLevel === '2') {
        // Pour les lignes enfants, afficher uniquement celles assignées à l'utilisateur sélectionné
        row.style.display = assignedTo === selectedUser ? '' : 'none';
      }
    });
  }
};

export default TableUtils;