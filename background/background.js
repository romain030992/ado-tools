// Description: Script de fond pour l'extension Chrome avec architecture modulaire
// Utilise les modules ES (import/export)

/**
 * Fonction pour injecter une fonction de chargement de script
 * Cette fonction crée un élément script qui charge tous les scripts nécessaires
 * @param {number} tabId - ID de l'onglet où injecter le loader
 * @param {Array<string>} scriptPaths - Chemins des scripts à charger
 * @param {Object} config - Configuration à transmettre aux scripts
 */
async function injectScriptsLoader(tabId, scriptPaths, config) {
  // Injecter d'abord le CSS commun
  await chrome.scripting.insertCSS({
    target: { tabId: tabId },
    files: ['injected-content.css']
  });

  // Liste des fichiers de base toujours nécessaires
  const coreScripts = [
    'features/core/config-loader.js',
    'features/core/dom-utils.js',
    'features/core/feature-base.js'
  ];
  
  // Combiner les scripts de base avec les scripts spécifiques
  const allScripts = [...coreScripts, ...scriptPaths];
  
  // Convertir les chemins de script en URLs complètes
  const scriptUrls = allScripts.map(script => chrome.runtime.getURL(script));
  
  // Créer un script qui va charger tous nos modules dynamiquement
  const loaderCode = `
    (function() {
      // Stocker la configuration pour qu'elle soit accessible aux scripts
      window.__ADO_TOOLS_CONFIG__ = ${JSON.stringify(config)};
      
      // Fonction pour charger un script de manière séquentielle
      function loadScript(src) {
        return new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = src;
          script.type = "module";
          script.onload = () => {
            console.log('Script chargé:', src);
            resolve();
          };
          script.onerror = (error) => {
            console.error('Erreur de chargement du script:', src, error);
            reject(error);
          };
          (document.head || document.documentElement).appendChild(script);
        });
      }
      
      // Charger tous les scripts les uns après les autres
      async function loadAllScripts() {
        try {
          const scriptUrls = ${JSON.stringify(scriptUrls)};
          for (const url of scriptUrls) {
            await loadScript(url);
          }
          // Une fois tous les scripts chargés, déclencher un événement personnalisé
          document.dispatchEvent(new CustomEvent('ado-tools-scripts-loaded', { 
            detail: window.__ADO_TOOLS_CONFIG__ 
          }));
        } catch (error) {
          console.error('Erreur lors du chargement des scripts:', error);
        }
      }
      
      // Démarrer le chargement
      loadAllScripts();
    })();
  `;
  
  // Injecter le loader qui va charger tous nos scripts
  // Note: 'world' parameter is only supported in Chromium browsers
  // For Firefox, the script will still be injected but in the content script context
  // However, since we're creating a script element, it will run in the page context anyway
  const scriptConfig = {
    target: { tabId: tabId },
    func: (code) => {
      const script = document.createElement('script');
      script.textContent = code;
      (document.head || document.documentElement).appendChild(script);
      script.remove(); // Le code est exécuté immédiatement donc on peut retirer l'élément
    },
    args: [loaderCode]
  };
  
  // Add 'world' parameter only for Chromium (Chrome/Edge)
  // Firefox doesn't support this parameter but the injection will still work
  if (typeof chrome !== 'undefined' && chrome.scripting) {
    try {
      // Try with world parameter (Chromium)
      await chrome.scripting.executeScript({
        ...scriptConfig,
        world: 'MAIN'
      });
    } catch (error) {
      // Fallback without world parameter (Firefox)
      await chrome.scripting.executeScript(scriptConfig);
    }
  }
}

// Détecter les mises à jour des onglets
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Définition des regex pour reconnaître les différentes pages d'Azure DevOps
    const backlogRegex = /dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_sprints\/backlog/;
    const wikiEditRegex = /dev\.azure\.com\/([^\/]+)*\/([^\/]+)*\/_wiki\/wikis.*?.*_a=edit.*/;
    const backlogUrlMatch = tab.url.match(backlogRegex);
    const wikiEditUrlMatch = tab.url.match(wikiEditRegex);

    console.log("URL actuelle:", tab.url);

    // Récupérer la configuration appropriée en fonction de l'URL
    chrome.storage.sync.get(["orgaProjects"], function(result) {
      let currentOrgaProject = null;
      let pageType = null;

      // Déterminer le type de page et la configuration correspondante
      if (backlogUrlMatch) {
        pageType = 'backlog';
        currentOrgaProject = result.orgaProjects?.find(item => 
          item.general.orga === decodeURIComponent(backlogUrlMatch[1]) && 
          item.general.project === decodeURIComponent(backlogUrlMatch[2])
        );
      } else if (wikiEditUrlMatch) {
        pageType = 'wiki';
        currentOrgaProject = result.orgaProjects?.find(item => 
          item.general.orga === decodeURIComponent(wikiEditUrlMatch[1]) && 
          item.general.project === decodeURIComponent(wikiEditUrlMatch[2])
        );
      }

      if (!currentOrgaProject) {
        console.log("Configuration non trouvée pour cette URL");
        return;
      }

      // Liste des modules à injecter en fonction du type de page et des fonctionnalités activées
      const moduleScripts = [];

      // Pour les pages de backlog
      if (pageType === 'backlog') {
        if (currentOrgaProject.statusAggregation?.enabled) {
          moduleScripts.push('features/status-aggregation/index.js');
        }
        
        if (currentOrgaProject.taskDrift?.enabled) {
          moduleScripts.push('features/task-drift/index.js');
        }
        
        if (currentOrgaProject.quickFilter?.enabled) {
          moduleScripts.push('features/quick-filter/index.js');
        }
      } 
      // Pour les pages wiki en mode édition
      else if (pageType === 'wiki') {
        if (currentOrgaProject.betterWiki?.enabled) {
          moduleScripts.push('features/better-wiki/index.js');
        }
      }

      // Injecter les modules si nécessaire
      if (moduleScripts.length > 0) {
        injectScriptsLoader(tabId, moduleScripts, currentOrgaProject);
      }
    });
  }
});