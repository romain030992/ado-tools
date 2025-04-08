// popup.js content
document.addEventListener("DOMContentLoaded", function () {

    const featureList = document.getElementById("featureList");

    function getCurrentTabUrl(callback) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const url = tabs[0]?.url || "";
            callback(url);
        });
    }

    function extractOrgaAndProjectFromUrl(url) {
        const match = url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
        if (match) {
            return { 
                orga: decodeURIComponent(match[1]).toLowerCase(), 
                project: decodeURIComponent(match[2]).toLowerCase() 
            };
        }
        return null;
    }

    function loadFeaturesForCurrentUrl() {
        getCurrentTabUrl((url) => {
            const orgaProject = extractOrgaAndProjectFromUrl(url);
            if (!orgaProject) {
                featureList.innerHTML = "<li>Impossible de déterminer l'organisation et le projet.</li>";
                return;
            }

            chrome.storage.sync.get("orgaProjects", function (data) {
                const configs = data.orgaProjects || [];
                const config = configs.find(c => 
                    c.general.orga.toLowerCase() === orgaProject.orga && 
                    c.general.project.toLowerCase() === orgaProject.project
                );

                if (!config) {
                    featureList.innerHTML = `<li>Aucune configuration trouvée pour ${orgaProject.orga} - ${orgaProject.project}.</li>`;
                    return;
                }

                featureList.innerHTML = "";

                const features = [
                    { key: "statusAggregation", label: "Agrégation par statut", enabled: config.statusAggregation?.enabled || false },
                    { key: "taskDrift", label: "Dérive des tâches", enabled: config.taskDrift?.enabled || false },
                    { key: "quickFilter", label: "Filtre rapide", enabled: config.quickFilter?.enabled || false },
                    { key: "betterWiki", label: "Amélioration du Wiki", enabled: config.betterWiki?.enabled || false }
                ];

                features.forEach(feature => {
                    const li = document.createElement("li");
                    li.dataset.feature = feature.key;

                    const label = document.createElement("span");
                    label.textContent = feature.label;

                    const toggle = document.createElement("label");
                    toggle.className = "switch";
                    toggle.innerHTML = `
                        <input type="checkbox" ${feature.enabled ? "checked" : ""}>
                        <span class="slider round"></span>
                    `;

                    toggle.querySelector("input").addEventListener("change", (e) => {
                        toggleFeature(config, feature.key, e.target.checked);
                    });

                    li.appendChild(label);
                    li.appendChild(toggle);
                    featureList.appendChild(li);
                });
            });
        });
    }

    function toggleFeature(config, featureKey, enabled) {
        if (featureKey === "statusAggregation") {
            config.statusAggregation = config.statusAggregation || {};
            config.statusAggregation.enabled = enabled;
        } else if (featureKey === "taskDrift") {
            config.taskDrift = config.taskDrift || {};
            config.taskDrift.enabled = enabled;
        } else if (featureKey === "quickFilter") {
            config.quickFilter = config.quickFilter || {};
            config.quickFilter.enabled = enabled;
        } else if (featureKey === "betterWiki") {
            config.betterWiki = config.betterWiki || {};
            config.betterWiki.enabled = enabled;
        }

        chrome.storage.sync.get("orgaProjects", function (data) {
            const configs = data.orgaProjects || [];
            const index = configs.findIndex(c => c.general.orga === config.general.orga && c.general.project === config.general.project);
            if (index !== -1) {
                configs[index] = config;
                chrome.storage.sync.set({ orgaProjects: configs }, () => {
                    console.log(`Feature ${featureKey} toggled to ${enabled}`);
                });
            }
        });
    }

    loadFeaturesForCurrentUrl();
});
