// Index des colonnes importantes dans le tableau des work items
let originalEstimateIndex = -1;
let remainingWorkIndex = -1;
let completedWorkIndex = -1;

let noEstimateColor;
let firstThreshold = 0;
let firstThresholdColor;
let secondThreshold = 50;
let secondThresholdColor;
let lastThresholdColor;

function calculateDriftColor(originalEstimate, remainingWork, completedWork) {
    // Validation des données
    if (originalEstimate <= 0) 
        return computeColor(noEstimateColor.r, noEstimateColor.g, noEstimateColor.b);

    // Calcul de la dérive relative
    const totalWork = completedWork + remainingWork;
    const drift = ((totalWork - originalEstimate) / originalEstimate) * 100;

    // Définir les seuils de couleur
    if (drift <= firstThreshold) {
        // Pas de retard : couleur du premier seuil
        return computeColor(firstThresholdColor.r, firstThresholdColor.g, firstThresholdColor.b)
    } else if (drift <= secondThreshold) {
        // Légère dérive : interpoler entre premier seuil et deuxième seuil
        const ratio = (drift - firstThreshold) / (secondThreshold - firstThreshold);
        return interpolateColor(firstThresholdColor, secondThresholdColor, ratio);
    } else {
        // Dérive importante : interpoler entre deuxième seuil et dernier seuil
        const ratio = (drift - secondThreshold) / (100 - secondThreshold);
        return interpolateColor(secondThresholdColor, lastThresholdColor, Math.min(ratio, 1));
    }
}

// Fonction pour interpoler entre deux couleurs
function interpolateColor(color1, color2, ratio) {
    return computeColor(
        Math.round(color1.r + ratio * (color2.r - color1.r)),
        Math.round(color1.g + ratio * (color2.g - color1.g)),
        Math.round(color1.b + ratio * (color2.b - color1.b))
    );
}

function computeColor(r, g, b){
    return `rgb(${r}, ${g}, ${b})`;
}

// Fonction pour parser une couleur hexadécimale en objet RGB
function parseColor(hex) {
    const bigint = parseInt(hex.slice(1), 16);
    return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
    };
}

function handleTaskDrift(table) {
    table.querySelectorAll('tbody tr').forEach(taskRow => {
        let icon = taskRow.querySelector('span.bowtie-symbol-task');
        if (!icon) return;

        // Récupérez les valeurs des colonnes pertinentes, 0 par défaut si NaN
        let originalEstimateValue = parseFloat(taskRow.querySelector(`td:nth-child(${originalEstimateIndex})`).textContent.trim());
        let remainingWorkValue = parseFloat(taskRow.querySelector(`td:nth-child(${remainingWorkIndex})`).textContent.trim());
        let completedWorkValue = parseFloat(taskRow.querySelector(`td:nth-child(${completedWorkIndex})`).textContent.trim());
        if (isNaN(originalEstimateValue)) originalEstimateValue = 0;
        if (isNaN(remainingWorkValue)) remainingWorkValue = 0;
        if (isNaN(completedWorkValue)) completedWorkValue = 0;
        
        // Appliquez la couleur calculée au pseudo-élément via une propriété inline CSS
        const driftColor = calculateDriftColor(originalEstimateValue, remainingWorkValue, completedWorkValue);
        icon.style.setProperty('--dynamic-color', driftColor);
    });
}

// On commence les traitements à la réception du message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Config:", message.config);
    const projectOrga = message.config;

    // Désactiver la fonctionnalité si elle n'est pas activée dans la configuration
    if (!projectOrga.taskDrift?.enabled) return;

    // Charger les couleurs et seuils depuis la configuration
    noEstimateColor = parseColor(projectOrga.taskDrift.noEstimateColor) || noEstimateColor;
    firstThreshold = projectOrga.taskDrift.firstThreshold || firstThreshold;
    firstThresholdColor = parseColor(projectOrga.taskDrift.firstThresholdColor) || firstThresholdColor;
    secondThreshold = projectOrga.taskDrift.secondThreshold || secondThreshold;
    secondThresholdColor = parseColor(projectOrga.taskDrift.secondThresholdColor) || secondThresholdColor;
    lastThresholdColor = parseColor(projectOrga.taskDrift.lastThresholdColor) || lastThresholdColor;

    const table = document.querySelector('table.backlog-tree');
    if (table) {
        const headers = table.querySelectorAll('thead th');

        headers.forEach((header, index) => {
            const headerText = header.textContent.trim().toLowerCase();
            if (headerText === 'original estimate') {
                originalEstimateIndex = index + 1;
            }
            if (headerText === 'remaining work') {
                remainingWorkIndex = index + 1;
            }
            if (headerText === 'completed work') {
                completedWorkIndex = index + 1;
            }
        });

        // Si toutes les colonnes sont trouvées, on peut utiliser la fonctionnalité de dérive des tâches
        if (originalEstimateIndex !== -1 && remainingWorkIndex !== -1 && completedWorkIndex !== -1) {
            handleTaskDrift(table);

            // Ajout d'un MutationObserver pour surveiller les changements de sélection
            const observer = new MutationObserver(() => {
                // Gestion de la dérive des tâches
                handleTaskDrift(table);
            });
            observer.observe(table, { childList: true, subtree: true });
        } else {
            console.log('Colonnes non trouvées');
        }
    } else {
        console.log('Tableau non trouvé');
    }
});