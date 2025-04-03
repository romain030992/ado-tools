// Index des colonnes importantes dans le tableau des work items
let storyPointsIndex = -1;
let stateIndex = -1;

let allPuce; // Puce "Tous"
let statePuces; // Puces pour chaque état

function createPuceDiv(text, backgroundColor, state) {
    const div = document.createElement('div');
    div.style.backgroundColor = backgroundColor;
    div.textContent = text;
    div.classList.add('puce');

    if (state) {
        div.dataset.state = state; // Stocker l'état associé à la puce
    }

    return div;
}

// On commence les traitements à la réception du message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Config:", message.config);
    const featureConfig = message.config.statusAggregation;

    // Désactiver la fonctionnalité si elle n'est pas activée dans la configuration
    if (!featureConfig?.enabled) return;

    const table = document.querySelector('table.backlog-tree');
    if (table) {
        const headers = table.querySelectorAll('thead th');

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim().toLowerCase();
            if (headerText === featureConfig.columnName?.toLowerCase()) {
                storyPointsIndex = index + 1; // Les index des colonnes commencent à 1 pour querySelector
            }
            if (headerText === 'state') {
                stateIndex = index + 1;
            }
        });

        // Si les colonnes "Story Points" et "State" sont trouvées, on peut utiliser la fonctionnalité
        if (storyPointsIndex !== -1 && stateIndex !== -1) {
            const stateTotals = {};
            const rows = table.querySelectorAll('tbody tr');

            rows.forEach(row => {
                const storyPointsCell = row.querySelector(`td:nth-child(${storyPointsIndex})`);
                const stateCell = row.querySelector(`td:nth-child(${stateIndex})`);

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

            // Supprimer l'ancienne div si elle existe
            const existingResultDiv = document.querySelector('#story-points-summary');
            if (existingResultDiv) {
                existingResultDiv.remove();
            }

            // Création de la nouvelle div avec les résultats
            let resultDiv = document.createElement('div');
            resultDiv.id = 'story-points-summary';

            let grandTotal = 0;

            // Ajout des puces pour chaque état
            statePuces = [];
            for (const [state, total] of Object.entries(stateTotals)) {
                const backgroundColor = featureConfig.statuses.find(item => item.name === state)?.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`;
                const stateDiv = createPuceDiv(`${state} : ${total}`, backgroundColor, state);
                resultDiv.appendChild(stateDiv);
                grandTotal += total;
                statePuces.push(stateDiv);
            }

            // Ajout de la puce "Tous"
            const totalDiv = createPuceDiv(`Tous : ${grandTotal}`, '#8c77ab'); // violet clair
            totalDiv.id = 'all-story-points-summary';
            resultDiv.insertBefore(totalDiv, resultDiv.firstChild);
            allPuce = totalDiv;

            const backlogsViewDiv = document.querySelector('.backlogs-view');
            if (backlogsViewDiv) {
                backlogsViewDiv.parentNode.insertBefore(resultDiv, backlogsViewDiv);
            } else {
                console.log('Div avec la classe "backlogs-view" non trouvée');
            }

            // Ajout d'un MutationObserver pour surveiller les changements de sélection
            const observer = new MutationObserver(() => {
                const existingSelectedDiv = document.querySelector('#selected-story-points-summary');
                if (existingSelectedDiv) {
                    existingSelectedDiv.remove();
                }

                const selectedRows = table.querySelectorAll('tbody tr.selected');
                if (selectedRows.length >= 2) {
                    let selectedTotal = 0;
                    selectedRows.forEach(row => {
                        const storyPointsCell = row.querySelector(`td:nth-child(${storyPointsIndex})`);
                        if (storyPointsCell) {
                            const value = parseFloat(storyPointsCell.textContent.trim());
                            if (!isNaN(value)) {
                                selectedTotal += value;
                            }
                        }
                    });

                    // Ajouter la nouvelle div de somme sélectionnée
                    const selectedDiv = createPuceDiv(`Sélection : ${selectedTotal}`, '#d7beff'); // violet clair
                    selectedDiv.id = 'selected-story-points-summary';
                    resultDiv.insertBefore(selectedDiv, resultDiv.firstChild);
                }
            });
            observer.observe(table, { attributes: true, subtree: true, attributeFilter: ['class'] });
        } else {
            console.log('Colonnes "Story Points" ou "State" non trouvées');
        }
    } else {
        console.log('Tableau non trouvé');
    }
});