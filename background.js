// Description: Script de fond pour l'extension Chrome
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (changeInfo.status === 'complete' && tab.url) {
		const backlogRegex = /dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_sprints\/backlog/;
		const wikiEditRegex = /dev\.azure\.com\/([^\/]+)*\/([^\/]+)*\/_wiki\/wikis.*?.*_a=edit.*/;
		const backlogUrlMatch = tab.url.match(backlogRegex);
		const wikiEditUrlMatch = tab.url.match(wikiEditRegex);

		console.log("URL actuelle:", tab.url);

		// Vérifier si l'URL correspond à celle de Backlog
		if (backlogUrlMatch) {
			chrome.storage.sync.get(["orgaProjects"], function(result) {
				const currentOrgaProject = result.orgaProjects.find(item => 
					item.general.orga === decodeURIComponent(backlogUrlMatch[1]) && item.general.project === decodeURIComponent(backlogUrlMatch[2])
				);

				if (currentOrgaProject) {
					// Injecter les scripts et styles uniquement pour les fonctionnalités activées
					const scriptsToInject = [];
					if (currentOrgaProject.statusAggregation?.enabled) {
						scriptsToInject.push('feature-sumByStatus.js');
					}
					if (currentOrgaProject.taskDrift?.enabled) {
						scriptsToInject.push('feature-taskDrift.js');
					}
					if (currentOrgaProject.quickFilter?.enabled) {
						scriptsToInject.push('feature-quickFilter.js');
					}

					if (scriptsToInject.length > 0) {
						chrome.scripting.insertCSS({
							target: { tabId: tabId },
							files: ['injected-content.css']
						});
						chrome.scripting.executeScript({
							target: { tabId: tabId },
							files: scriptsToInject
						}, () => {
							chrome.tabs.sendMessage(tabId, { config: currentOrgaProject });
						});
					}
				} else {
					console.log("Valeur de configuration non trouvée");
				}
			});
		}
		// Vérifier si l'URL correspond à celle de l'édition du Wiki
		else if (wikiEditUrlMatch) {
			chrome.storage.sync.get(["orgaProjects"], function(result) {
				const currentOrgaProject = result.orgaProjects.find(item => 
					item.general.orga === decodeURIComponent(wikiEditUrlMatch[1]) && item.general.project === decodeURIComponent(wikiEditUrlMatch[2])
				);

				if (currentOrgaProject) {
					const scriptsToInject = [];
					if (currentOrgaProject.betterWiki?.enabled) {
						scriptsToInject.push('feature-betterWiki.js');
					}

					if (scriptsToInject.length > 0) {
						chrome.scripting.insertCSS({
							target: { tabId: tabId },
							files: ['injected-content.css']
						});
						chrome.scripting.executeScript({
							target: { tabId: tabId },
							files: scriptsToInject
						}, () => {
							chrome.tabs.sendMessage(tabId, { config: currentOrgaProject });
						});
					}
				} else {
					console.log("Valeur de configuration non trouvée");
				}
			});
		} 
		else {
			console.log("URL non reconnue");
		}
	}
});