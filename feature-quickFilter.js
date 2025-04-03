// Index des colonnes importantes dans le tableau des work items
let assignedToIndex = -1;

// TODO: Mettre les utilisateurs dans la configuration
let users = [];

// Index de l'utilisateur sélectionné
let selectedUserIndex = -1;

// Variables pour les éléments du DOM
let expandAllButton = null;
let filterButtonsContainer = null;
let startFilterSessionButton = null;
let stopFilterSessionButton = null;
let previousUserButton = null;
let nextUserButton = null;
let selectedUserElement = null;
let originalTable = null;
let filterableTable = null;
let observer = null;
let copiedRows = null;

// Fonction pour initialiser le tableau filtrable. Plusieurs étapes :
// 1. Expander toutes les lignes du tableau pour avoir le détail de chaque élément
// 2. Parcours le tableau pour sauvegarder chaque élément "tr" en mémoire
// 3. Scroller jusqu'en bas du tableau pour charger tous les éléments
// 4. Supprimer les éléments "tr" du tableau pour avoir un tableau vide
// 5. Réinsèrer dans le tableau les éléments "tr" sauvegardés
function displayFilterableTable() {
    if (filterableTable) {
        filterableTable.style.display = '';
        originalTable.style.display = 'none';
        selectUser(0);
        return;
    }

    expandAllButton.click();

    // Nombre de lignes totales attendues dans le tableau contenu dans la propriété "aria-rowcount" du tableau
    let totalRowCount = parseInt(originalTable.getAttribute('aria-rowcount'));

    // Tableau pour sauvegarder les lignes, initialisé avec les lignes déjà présentes (on ignore les lignes avec la classe "invisible")
    copiedRows = Array.from(originalTable.querySelectorAll('tbody tr')).filter(row => !row.classList.contains('invisible'));

    // Observer pour détecter les nouvelles lignes dans le tableau au fur et à mesure du scroll
    // Sauvegarde les nouvelles lignes
    // Arrête l'observer quand le scroll est terminé
    // Cache le tableau initial
    // Affiche un nouveau tableau dans lequel on insère les lignes sauvegardées
    observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                const newRows = Array.from(mutation.addedNodes).filter(node => node.nodeName === 'TR');
                const lastRowIndex = parseInt(newRows[newRows.length - 1].getAttribute('aria-rowindex'));
                copiedRows = copiedRows.concat(newRows);
               
                // If the last row is the last row of the table, stop the observer
                if (lastRowIndex === totalRowCount) {
                    observer.disconnect();
                    originalTable.style.display = 'none';
                    filterableTable = originalTable.cloneNode(true);
                    filterableTable.querySelectorAll('tbody tr').forEach(row => row.remove());
                    copiedRows.forEach(row => filterableTable.querySelector('tbody').appendChild(row));
                    originalTable.parentNode.appendChild(filterableTable);
                    filterableTable.style.display = '';
                    filterableTable.scrollIntoView({block: 'start'});
                    selectUser(0);
                }
            }
        });
    });

    observer.observe(originalTable.querySelector('tbody'), {childList: true, subtree: true});

    // Scroll to the bottom of the table to load all the rows
    originalTable.scrollIntoView({block: 'end', behavior: 'smooth'});
}

function displayOriginalTable() {
    if (filterableTable) {
        filterableTable.style.display = 'none';
        originalTable.style.display = '';
    }
}

function filterSelectedUser() {
    let showParentRow = false;

    copiedRows.forEach((row, index) => {
        const ariaLevel = row.getAttribute('aria-level');
        const assignedToCell = row.querySelector(`td:nth-child(${assignedToIndex})`);
        const assignedTo = assignedToCell ? assignedToCell.textContent.trim() : '';

        if (ariaLevel === '1') {
            showParentRow = false;
            // Check subsequent rows with aria-level=2
            for (let i = index + 1; i < copiedRows.length; i++) {
                const nextRow = copiedRows[i];
                const nextAriaLevel = nextRow.getAttribute('aria-level');
                if (nextAriaLevel === '1') break; // Stop if the next parent row is found
                if (nextAriaLevel === '2') {
                    const nextAssignedToCell = nextRow.querySelector(`td:nth-child(${assignedToIndex})`);
                    const nextAssignedTo = nextAssignedToCell ? nextAssignedToCell.textContent.trim() : '';
                    if (nextAssignedTo === users[selectedUserIndex]) {
                        showParentRow = true;
                        break;
                    }
                }
            }
            row.style.display = showParentRow ? '' : 'none';
        } else if (ariaLevel === '2') {
            row.style.display = assignedTo === users[selectedUserIndex] ? '' : 'none';
        }
    });
}

function updateNavigationButtons() {
    if (selectedUserIndex === -1) {
        selectedUserElement.textContent = '';
        startFilterSessionButton.style.display = '';
        stopFilterSessionButton.style.display = 'none';
        previousUserButton.style.display = 'none';
        selectedUserElement.style.display = 'none';
        nextUserButton.style.display = 'none';
    } else {
        selectedUserElement.textContent = users[selectedUserIndex];
        startFilterSessionButton.style.display = 'none';
        stopFilterSessionButton.style.display = '';
        previousUserButton.style.display = '';
        selectedUserElement.style.display = '';
        nextUserButton.style.display = '';
    }

    if (selectedUserIndex <= 0) {
        previousUserButton.classList.remove('enabled');
        previousUserButton.classList.add('disabled');
        previousUserButton.disabled = true;
    } else {
        previousUserButton.classList.remove('disabled');
        previousUserButton.classList.add('enabled');
        previousUserButton.disabled = false;
    }

    if (selectedUserIndex >= users.length - 1) {
        nextUserButton.classList.remove('enabled');
        nextUserButton.classList.add('disabled');
        nextUserButton.disabled = true;
    } else {
        nextUserButton.classList.remove('disabled');
        nextUserButton.classList.add('enabled');
        nextUserButton.disabled = false
    }
}

// Example function to change the selected user
function selectUser(index) {
    if (index >= 0 && index < users.length) {
        selectedUserIndex = index;
        selectedUserElement.textContent = users[selectedUserIndex];
        filterSelectedUser();
        updateNavigationButtons();
    }
}

// Fonction de hachage simple
function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

// Fonction pour obtenir un ordre aléatoire fixe basé sur la date du jour
function shuffleUsers(users) {
    const today = new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    const seed = hashString(today);

    return users
        .map(user => ({ user, sortKey: hashString(user + seed) }))
        .sort((a, b) => a.sortKey - b.sortKey)
        .map(item => item.user);
}

// On commence les traitements à la réception du message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Config:", message.config);
    const projectOrga = message.config;

    // Désactiver la fonctionnalité si elle n'est pas activée dans la configuration
    if (!projectOrga.quickFilter?.enabled) return;

    // Utiliser la liste des utilisateurs depuis la configuration
    users = shuffleUsers(projectOrga.quickFilter.persons);

    let existingContainer = document.getElementById('filterButtonsContainer');
    if (existingContainer) {
        existingContainer.remove();
    }

    originalTable = document.querySelector('table.backlog-tree');
    const backlogHeaders = document.querySelector('div.sprints-header-dates>div');
    if (originalTable && backlogHeaders) {
        const headers = originalTable.querySelectorAll('thead th');

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim().toLowerCase();
            if (headerText === 'assigned to') {
                assignedToIndex = index + 1;
            }
        });

        // Si la colonne "Assigned To" est trouvée, on peut utiliser la fonctionnalité
        if (assignedToIndex !== -1) {
            // Find expand all button
            expandAllButton = document.querySelector('button.expand-collapse-button');

            // Create a container for the filter buttons
            filterButtonsContainer = document.createElement('div');
            filterButtonsContainer.id = 'filterButtonsContainer';

            // Create the start filter button and insert it in the DOM (in second position)
            startFilterSessionButton = document.createElement('button');
            startFilterSessionButton.classList.add('bolt-button', 'enabled', 'bolt-focus-treatment');
            startFilterSessionButton.textContent = 'Démarrer le daily';
            startFilterSessionButton.addEventListener('click', () => {
                expandAllButton.click();
                startFilterSessionButton.style.display = 'none';
                stopFilterSessionButton.style.display = '';
                previousUserButton.style.display = '';
                nextUserButton.style.display = '';
                displayFilterableTable();
            });

            // Create the stop filter button and insert it in the DOM just after the start filter button
            stopFilterSessionButton = document.createElement('button');
            stopFilterSessionButton.textContent = 'Arrêter le daily';
            stopFilterSessionButton.classList.add('bolt-button', 'enabled', 'bolt-focus-treatment');
            stopFilterSessionButton.addEventListener('click', () => {
                selectedUserIndex = -1;
                startFilterSessionButton.style.display = '';
                stopFilterSessionButton.style.display = 'none';
                previousUserButton.style.display = 'none';
                nextUserButton.style.display = 'none';
                displayOriginalTable();
                filterSelectedUser();
                updateNavigationButtons();
            });

            // Create the previous user button and insert it in the DOM
            previousUserButton = document.createElement('button');
            previousUserButton.textContent = '<';
            previousUserButton.classList.add('bolt-button', 'enabled', 'bolt-focus-treatment');
            previousUserButton.addEventListener('click', () => {
                selectUser(selectedUserIndex - 1);
            })

            // Create fake button styled element to display the selected user
            selectedUserElement = document.createElement('button');
            selectedUserElement.classList.add('bolt-button');
            selectedUserElement.style.minWidth = '180px';

            // Create the next user button and insert it in the DOM
            nextUserButton = document.createElement('button');
            nextUserButton.textContent = '>';
            nextUserButton.classList.add('bolt-button', 'enabled', 'bolt-focus-treatment');
            nextUserButton.addEventListener('click', () => {
                selectUser(selectedUserIndex + 1);
            })

            // Create a scrollable container for selecting the user. This container appears when the user clicks on the selected user element
            const userSelectionContainer = document.createElement('div');
            userSelectionContainer.style.display = 'none';
            userSelectionContainer.style.position = 'absolute';
            userSelectionContainer.style.backgroundColor = 'white';
            userSelectionContainer.style.border = '1px solid #ccc';
            userSelectionContainer.style.maxHeight = '200px';
            userSelectionContainer.style.overflowY = 'auto';
            userSelectionContainer.style.zIndex = '1000';
            userSelectionContainer.style.width = '180px';
            userSelectionContainer.style.marginTop = '35px';
            userSelectionContainer.style.marginLeft = '175px';
            userSelectionContainer.style.borderRadius = '5px';
            userSelectionContainer.style.boxShadow = '0 0 5px #ccc';
            userSelectionContainer.style.padding = '5px';
            userSelectionContainer.style.boxSizing = 'border-box';

            // Create the user selection list
            const userSelectionList = document.createElement('ul');
            userSelectionList.style.listStyle = 'none';
            userSelectionList.style.padding = '0';
            userSelectionList.style.margin = '0';

            // Create the user selection items
            users.forEach((user, index) => {
                const userSelectionItem = document.createElement('li');
                userSelectionItem.style.cursor = 'pointer';
                userSelectionItem.style.padding = '5px';
                userSelectionItem.textContent = user;
                userSelectionItem.addEventListener('click', () => {
                    selectUser(index);
                    userSelectionContainer.style.display = 'none';
                });
                userSelectionList.appendChild(userSelectionItem);
            });

            // Insert the user selection list in the user selection container
            userSelectionContainer.appendChild(userSelectionList);

            // Insert the user selection container in the DOM
            filterButtonsContainer.appendChild(userSelectionContainer);

            // Display the user selection container when the user clicks on the selected user element
            selectedUserElement.addEventListener('click', () => {
                userSelectionContainer.style.display = userSelectionContainer.style.display == 'none' ? '' : 'none';
            });

            // Hide the user selection container when the user clicks outside of it
            document.addEventListener('click', (event) => {
                if (!selectedUserElement.contains(event.target) && !userSelectionContainer.contains(event.target)) {
                    userSelectionContainer.style.display = 'none';
                }
            });

            // Insert the buttons in the DOM
            filterButtonsContainer.appendChild(startFilterSessionButton);
            filterButtonsContainer.appendChild(stopFilterSessionButton);
            filterButtonsContainer.appendChild(previousUserButton);
            filterButtonsContainer.appendChild(selectedUserElement);
            filterButtonsContainer.appendChild(nextUserButton);
            backlogHeaders.appendChild(filterButtonsContainer); 

            // Initial call to set the correct state of the buttons
            updateNavigationButtons();
            
        } else {
            console.log('Colonnes non trouvées');
        }
    } else {
        console.log('Tableau non trouvé');
    }
});