document.addEventListener("DOMContentLoaded", function () {
  const configList = document.getElementById("configList");
  const featureList = document.getElementById("featureList");
  const optionnalColumnContent = document.getElementById("optionalColumnContent");
  const optionnalColumnContainer = document.getElementById("optionalColumnContainer");
  const detailsContent = document.getElementById("detailsContent");
  let selectedConfigIndex = 0;
  let currentHash = null;
  let editingTemplateIndex = null;

  function loadConfigs() {
    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configList.innerHTML = "";
      configs.forEach((config, index) => {
        const li = document.createElement("li");
        li.textContent = `${config.general.orga} - ${config.general.project}`;
        li.addEventListener("click", () => selectConfig(index, config));
        configList.appendChild(li);
      });

      if (configs.length > 0) {
        selectConfig(0, configs[0]); // Select the first configuration by default
      }
    });
  }

  function confirmUnsavedChanges() {
    const currentValues = getEditableValues(featureList.querySelector(".active")?.dataset.feature || "");
    if (!currentValues || Object.keys(currentValues).length === 0) {
      return true; // No values to compare, return true
    }
    if (calculateHash(currentValues) !== currentHash) {
      return confirm("Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir continuer ?");
    }
    return true;
  }

  function selectConfig(index, config) {
    if (!confirmUnsavedChanges()) return;

    selectedConfigIndex = index;

    // Charger la liste des fonctionnalités
    loadFeatures(config);
  }

  function loadFeatures(config) {
    featureList.innerHTML = "";
    const features = [
      { key: "general", label: "Paramètres généraux" }, // Always enabled, no toggle
      { key: "statusAggregation", label: "Agrégation par statut", enabled: config.statusAggregation?.enabled || false },
      { key: "taskDrift", label: "Dérive des tâches", enabled: config.taskDrift?.enabled || false },
      { key: "quickFilter", label: "Filtre rapide", enabled: config.quickFilter?.enabled || false },
      { key: "betterWiki", label: "Amélioration du Wiki", enabled: config.betterWiki?.enabled || false }
    ];

    features.forEach((feature, index) => {
      const li = document.createElement("li");
      li.dataset.feature = feature.key;

      const label = document.createElement("span");
      label.textContent = feature.label;

      li.appendChild(label);
      
      if (feature.key !== "general") {
        const toggle = document.createElement("label");
        toggle.className = "toggle";
        toggle.innerHTML = `
          <input type="checkbox" ${feature.enabled ? "checked" : ""}>
        `;

        toggle.querySelector("input").addEventListener("change", (e) => {
          toggleFeature(config, feature.key, e.target.checked);
        });

        li.appendChild(toggle);
      }

      li.addEventListener("click", () => selectFeature(feature.key, config));

      featureList.appendChild(li);

      // Sélectionne la première fonctionnalité par défaut
      if (index === 0) {
        selectFeature(feature.key, config);
        li.classList.add("active");
      }
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
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        console.log(`Feature ${featureKey} toggled to ${enabled}`);
      });
    });
  }

  function selectFeature(featureKey, config) {
    if (!confirmUnsavedChanges()) return;

    // Marquer la fonctionnalité sélectionnée comme active
    featureList.querySelectorAll("li").forEach(li => li.classList.remove("active"));
    featureList.querySelector(`[data-feature="${featureKey}"]`).classList.add("active");

    // Charger les détails de la fonctionnalité
    loadFeatureDetails(featureKey, config);
  }

  function calculateHash(values) {
    return JSON.stringify(values);
  }

  function getEditableValues(featureKey) {
    if (featureKey === "general") {
      return {
        orga: document.getElementById("orgaInput").value,
        project: document.getElementById("projectInput").value,
      };
    } else if (featureKey === "statusAggregation") {
      const statuses = [];
      document.querySelectorAll("#statusList .status-item").forEach(item => {
        statuses.push({
          name: item.querySelector('input[type="text"]').value,
          color: item.querySelector('input[type="color"]').value,
        });
      });
      return {
        statuses,
      };
    } else if (featureKey === "taskDrift") {
      return {
        noEstimateColor: document.getElementById("noEstimateColor").value,
        firstThreshold: document.getElementById("firstThreshold").value,
        firstThresholdColor: document.getElementById("firstThresholdColor").value,
        secondThreshold: document.getElementById("secondThreshold").value,
        secondThresholdColor: document.getElementById("secondThresholdColor").value,
        lastThresholdColor: document.getElementById("lastThresholdColor").value,
      };
    } else if (featureKey === "quickFilter") {
      const persons = [];
      document.querySelectorAll("#personList .person-item").forEach(item => {
        persons.push(item.querySelector('input[type="text"]').value);
      });
      return {
        persons,
      };
    }
    return {};
  }

  function loadFeatureDetails(featureKey, config) {
    detailsContent.innerHTML = ""; // Efface le contenu précédent
    optionnalColumnContent.innerHTML = ""; // Efface le contenu précédent
    optionnalColumnContainer.classList.remove("active"); // Masque le contenu optionnel

    if (featureKey === "general") {
      detailsContent.innerHTML = `
        <h2>Paramètres généraux</h2>
        <input type="text" id="orgaInput" placeholder="Nom de l'Orga" value="${config.general.orga || ""}">
        <input type="text" id="projectInput" placeholder="Nom du Projet" value="${config.general.project || ""}">
        <button id="saveGeneralButton">Sauvegarder</button>
        <button id="deleteConfigButton">Supprimer</button>
      `;
      currentHash = calculateHash(getEditableValues(featureKey));
      document.getElementById("saveGeneralButton").addEventListener("click", () => saveGeneralSettings(config));
      document.getElementById("deleteConfigButton").addEventListener("click", deleteConfig);
    } else if (featureKey === "statusAggregation") {
      detailsContent.innerHTML = `
        <h2>Gestion des statuts</h2>
        <div>
          <label for="columnName">Colonne à agréger</label>
          <input type="text" id="columnName" value="${config.statusAggregation.columnName || ""}" placeholder="Nom de la colonne">
        </div>
        <div id="statusList"></div>
        <button id="addStatusButton">Ajouter un statut</button>
        <button id="saveStatusAggregationButton">Sauvegarder</button>
      `;
      const statusList = document.getElementById("statusList");
      (config.statusAggregation.statuses || []).forEach(status => {
        const statusItem = document.createElement("div");
        statusItem.className = "status-item";
        statusItem.innerHTML = `
          <input type="text" value="${status.name}" placeholder="Nom du statut">
          <input type="color" value="${status.color}">
          <button class="removeButton"><i class="fas fa-trash-alt"></i></button>
        `;
        statusItem.querySelector(".removeButton").addEventListener("click", function () {
          statusItem.remove();
        });
        statusList.appendChild(statusItem);
      });

      document.getElementById("addStatusButton").addEventListener("click", function () {
        const statusItem = document.createElement("div");
        statusItem.className = "status-item";
        statusItem.innerHTML = `
          <input type="text" placeholder="Nom du statut">
          <input type="color">
          <button class="removeButton"><i class="fas fa-trash-alt"></i></button>
        `;
        statusItem.querySelector(".removeButton").addEventListener("click", function () {
          statusItem.remove();
        });
        statusList.appendChild(statusItem);
      });

      document.getElementById("saveStatusAggregationButton").addEventListener("click", () => {
        saveStatusAggregationSettings(config);
      });

      currentHash = calculateHash(getEditableValues(featureKey));
    } else if (featureKey === "taskDrift") {
      detailsContent.innerHTML = `
        <h2>Dérive des tâches</h2>
        <div>
          <label for="noEstimateColor">Couleur si pas d'original estimate</label>
          <input type="color" id="noEstimateColor" value="${config.taskDrift.noEstimateColor || "#0000ff"}">
        </div>
        <div class="status-item">
          <label for="firstThreshold">≤</label>
          <input type="number" id="firstThreshold" value="${config.taskDrift.firstThreshold || ""}">
          <input type="color" id="firstThresholdColor" value="${config.taskDrift.firstThresholdColor || "#00ff00"}">
        </div>
        <div class="status-item">
          <label for="secondThreshold">≤</label>
          <input type="number" id="secondThreshold" value="${config.taskDrift.secondThreshold || ""}">
          <input type="color" id="secondThresholdColor" value="${config.taskDrift.secondThresholdColor || "#ffa500"}">
        </div>
        <div class="status-item">
          <label for="lastThreshold">></label>
          <input type="color" id="lastThresholdColor" value="${config.taskDrift.lastThresholdColor || "#ff0000"}">
        </div>
        <button id="saveTaskDriftButton">Sauvegarder</button>
      `;

      currentHash = calculateHash(getEditableValues(featureKey));
      document.getElementById("saveTaskDriftButton").addEventListener("click", () => saveTaskDriftSettings(config));
    } else if (featureKey === "quickFilter") {
      detailsContent.innerHTML = `
        <h2>Filtre rapide</h2>
        <div id="personList"></div>
        <button id="addPersonButton">Ajouter une personne</button>
        <button id="saveQuickFilterButton">Sauvegarder</button>
      `;
      const personList = document.getElementById("personList");
      (config.quickFilter.persons || []).forEach(person => {
        const personItem = document.createElement("div");
        personItem.className = "person-item";
        personItem.innerHTML = `
          <input type="text" value="${person}" placeholder="Nom de la personne">
          <button class="removeButton"><i class="fas fa-trash-alt"></i></button>
        `;
        personItem.querySelector(".removeButton").addEventListener("click", function () {
          personItem.remove();
        });
        personList.appendChild(personItem);
      });

      document.getElementById("addPersonButton").addEventListener("click", function () {
        const personItem = document.createElement("div");
        personItem.className = "person-item";
        personItem.innerHTML = `
          <input type="text" placeholder="Nom de la personne">
          <button class="removeButton"><i class="fas fa-trash-alt"></i></button>
        `;
        personItem.querySelector(".removeButton").addEventListener("click", function () {
          personItem.remove();
        });
        personList.appendChild(personItem);
      });

      currentHash = calculateHash(getEditableValues(featureKey));
      document.getElementById("saveQuickFilterButton").addEventListener("click", () => saveQuickFilterSettings(config));
    } else if (featureKey === "betterWiki") {

      detailsContent.innerHTML = `
        <div class="template-header">
          <div class="template-identity">
            <div id="emojiPicker" class="emoji-picker">
              <span class="emoji-display"></span>
              <input type="text" id="templateEmoji" placeholder="😀">
            </div>
            <input type="text" id="templateTitle" placeholder="Nouveau template" class="template-title-input">
          </div>
          <div class="template-actions">
            <button id="togglePreviewButton" class="icon-button" title="Afficher/Masquer l'aperçu">
              <i class="fas fa-eye"></i>
            </button>
            <button id="cancelTemplateButton" class="icon-button" title="Annuler les modifications">
              <i class="fas fa-undo"></i>
            </button>
            <button id="deleteTemplateButton" class="action-button danger-action" title="Supprimer">
              <i class="fas fa-trash-alt"></i>
            </button>
            <button id="saveTemplateButton" class="action-button primary-action" title="Sauvegarder">
              <i class="fas fa-save"></i>
              <span>Sauvegarder</span>
            </button>
          </div>
        </div>
        <div class="template-content-container">
          <textarea id="templateContent" placeholder="Contenu du Template"></textarea>
          <div id="templatePreview" class="template-preview hidden">
            <div id="templatePreviewContent"></div>
          </div>
        </div>
      `;

      const previewContainerElement = document.getElementById("templatePreview");
      const previewContentElement = document.getElementById("templatePreviewContent");
      const templateContent = document.getElementById("templateContent");
      const templateEmoji = document.getElementById("templateEmoji");
      const emojiDisplay = document.querySelector(".emoji-display");

      // Set initial emoji display
      emojiDisplay.textContent = templateEmoji.value || "😀";
      
      // Update emoji display when input changes
      templateEmoji.addEventListener("input", (e) => {
        emojiDisplay.textContent = e.target.value || "😀";
      });

      // Handle emoji picker click
      document.querySelector(".emoji-picker").addEventListener("click", () => {
        templateEmoji.focus();
      });

      // Add event listener to update preview dynamically
      templateContent.addEventListener("input", (e) => {
        const content = e.target.value;
        updatePreview(content, previewContentElement);
      });

      const templateTitle = document.getElementById("templateTitle");

      // Add toggle preview functionality
      let isPreviewMode = false;
      const togglePreviewButton = document.getElementById("togglePreviewButton");
      togglePreviewButton.addEventListener("click", () => {
        togglePreviewMode();
      });
      
      // Extract the toggle preview functionality to a reusable function
      function togglePreviewMode() {
        isPreviewMode = !isPreviewMode;
        
        togglePreviewButton.querySelector("i").className = isPreviewMode ? "fas fa-edit" : "fas fa-eye";
        
        // Toggle active class for styling
        if (isPreviewMode) {
          togglePreviewButton.classList.add("active");
          document.querySelector(".template-content-container").classList.add("preview-mode");
        } else {
          togglePreviewButton.classList.remove("active");
          document.querySelector(".template-content-container").classList.remove("preview-mode");
        }
        
        // Always show preview when in preview mode
        if (isPreviewMode) {
          updatePreview(templateContent.value, previewContentElement);
          previewContainerElement.classList.remove("hidden");
        } else {
          // In edit mode, properly hide the preview
          previewContainerElement.classList.add("hidden");
        }
      }

      // Manage buttons
      const saveTemplateButton = document.getElementById("saveTemplateButton");
      const cancelTemplateButton = document.getElementById("cancelTemplateButton");
      const deleteTemplateButton = document.getElementById("deleteTemplateButton");

      saveTemplateButton.addEventListener("click", () => {
        saveTemplate(config, templateTitle, templateEmoji, templateContent);
      });

      cancelTemplateButton.addEventListener("click", () => {
        resetTemplateEditor(templateTitle, templateEmoji, templateContent);
      });

      deleteTemplateButton.addEventListener("click", () => {
        deleteTemplate(config, editingTemplateIndex);
      });

      loadTemplates(config.betterWiki?.templates || []);
    }
  }

  function deleteConfig() {
    if (confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      chrome.storage.sync.get("orgaProjects", function (data) {
        const configs = data.orgaProjects || [];
        configs.splice(selectedConfigIndex, 1); // Remove the selected configuration
        chrome.storage.sync.set({ orgaProjects: configs }, () => {
          alert("Configuration supprimée !");
          loadConfigs(); // Reload the configuration list
        });
      });
    }
  }

  function saveGeneralSettings(config) {
    config.general = {
      orga: document.getElementById("orgaInput").value,
      project: document.getElementById("projectInput").value,
    };

    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        alert("Paramètres généraux sauvegardés !");
      });
    });
  }

  function saveStatusAggregationSettings(config) {
    const statuses = [];
    document.querySelectorAll("#statusList .status-item").forEach(item => {
      statuses.push({
        name: item.querySelector('input[type="text"]').value,
        color: item.querySelector('input[type="color"]').value,
      });
    });

    config.statusAggregation = {
      columnName: document.getElementById("columnName").value,
      statuses,
    };

    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        alert("Paramètres d'agrégation par statut sauvegardés !");
      });
    });
  }

  function saveTaskDriftSettings(config) {
    config.taskDrift = {
      noEstimateColor: document.getElementById("noEstimateColor").value,
      firstThreshold: parseFloat(document.getElementById("firstThreshold").value) || 0,
      firstThresholdColor: document.getElementById("firstThresholdColor").value,
      secondThreshold: parseFloat(document.getElementById("secondThreshold").value) || 0,
      secondThresholdColor: document.getElementById("secondThresholdColor").value,
      lastThresholdColor: document.getElementById("lastThresholdColor").value,
    };

    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        alert("Paramètres de dérive des tâches sauvegardés !");
      });
    });
  }

  function saveQuickFilterSettings(config) {
    const persons = [];
    document.querySelectorAll("#personList .person-item").forEach(item => {
      persons.push(item.querySelector('input[type="text"]').value);
    });

    config.quickFilter = { persons };

    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        alert("Paramètres de filtre rapide sauvegardés !");
      });
    });
  }

  document.getElementById("addConfigButton").addEventListener("click", function () {
    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      const newConfig = {
        general: { orga: "Nouvelle Orga", project: "Nouveau Projet" },
        statusAggregation: { enabled: false, statuses: [], columnName: "" },
        taskDrift: { enabled: false },
        quickFilter: { enabled: false, persons: [] },
        betterWiki: { enabled: false }
      };
      configs.push(newConfig);
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        loadConfigs(); // Reload the configuration list
        alert("Nouvelle configuration créée !");
      });

      // Select the new configuration
      selectConfig(configs.length - 1, newConfig);
    });
  });

  function loadTemplates(templates) {
    optionnalColumnContainer.classList.add("active");
      optionnalColumnContent.innerHTML = `
        <div id="templateActionBar">
          <button id="addTemplateButton" class="template-list-action">
            <i class="fas fa-plus"></i>
            <span>Nouveau template</span>
          </button>
          <button id="addTemplateGroupButton" class="template-list-action">
            <i class="fas fa-folder-plus"></i>
            <span>Nouveau groupe</span>
          </button>
        </div>
        <ul id="templateList"></ul>
      `;
     const list = document.getElementById("templateList");
  
    templates.forEach((template, index) => {
      const listItem = document.createElement("li");
      listItem.className = "template-list-item";
  
      const emoji = document.createElement("span");
      emoji.className = "emoji";
      emoji.textContent = template.emoji;
  
      const title = document.createElement("span");
      title.className = "title";
      title.textContent = template.title;

      listItem.addEventListener("click", () => {
        selectTemplate(index, template);
      });
  
      listItem.appendChild(emoji);
      listItem.appendChild(title);
      list.appendChild(listItem);
    });

    // Add event listener to the "Add Template" button
    document.getElementById("addTemplateButton").addEventListener("click", () => {
      createNewTemplate();
    });
  
    optionalColumnContent.appendChild(list);
  }

  function createNewTemplate() {
    // Clear any existing selection in the template list
    const previousSelected = document.querySelector(".template-list-item.selected");
    if (previousSelected) {
      previousSelected.classList.remove("selected");
    }

    // Reset the editingTemplateIndex
    editingTemplateIndex = null;

    // Reset template form fields to create a new template
    const templateTitle = document.getElementById("templateTitle");
    const templateEmoji = document.getElementById("templateEmoji");
    const templateContent = document.getElementById("templateContent");
    const emojiDisplay = document.querySelector(".emoji-display");
    
    if (templateTitle) templateTitle.value = "";
    if (templateEmoji) templateEmoji.value = "";
    if (templateContent) templateContent.value = "";
    if (emojiDisplay) emojiDisplay.textContent = "😀";

    // Reset preview mode
    const togglePreviewButton = document.getElementById("togglePreviewButton");
    const previewContainerElement = document.getElementById("templatePreview");
    const templateContentContainer = document.querySelector(".template-content-container");
    
    if (togglePreviewButton && togglePreviewButton.classList.contains("active")) {
      togglePreviewButton.classList.remove("active");
      togglePreviewButton.querySelector("i").className = "fas fa-eye";
    }
    
    if (templateContentContainer) {
      templateContentContainer.classList.remove("preview-mode");
    }
    
    if (previewContainerElement) {
      previewContainerElement.classList.add("hidden");
    }
    
    // Reset the global isPreviewMode variable
    window.isPreviewMode = false;
    
    // Focus on title input for better UX
    if (templateTitle) {
      setTimeout(() => templateTitle.focus(), 0);
    }
  }

  function selectTemplate(index, template) {
    const templateTitle = document.getElementById("templateTitle");
    const templateEmoji = document.getElementById("templateEmoji");
    const templateContent = document.getElementById("templateContent");

    // Toggle previous selection
    const previousSelected = document.querySelector(".template-list-item.selected");
    if (previousSelected) {
      previousSelected.classList.remove("selected");
    }
    const currentSelected = document.querySelectorAll(".template-list-item")[index];
    currentSelected.classList.add("selected");

    editingTemplateIndex = index;
    templateTitle.value = template.title || ""; // Ensure values are set correctly
    templateEmoji.value = template.emoji || "";
    templateContent.value = template.content || "";

    // Refresh preview mode when changing templates
    const togglePreviewButton = document.getElementById("togglePreviewButton");
    if (togglePreviewButton && togglePreviewButton.classList.contains("active")) {
      updatePreview(templateContent.value, document.getElementById("templatePreviewContent"));
    }
    
    // Update emoji display when selecting a template
    const emojiDisplay = document.querySelector(".emoji-display");
    if (emojiDisplay) {
      emojiDisplay.textContent = template.emoji || "😀";
    }
}

  function updatePreview(content, previewContentElement) {
    if (content.trim()) {
        // Use marked.js to render Markdown or HTML
        previewContentElement.innerHTML = DOMPurify.sanitize(marked.parse(content));
    }
}

  function deleteTemplate(config, index) {
    const templates = config.betterWiki?.templates || [];
    templates.splice(index, 1);
    config.betterWiki = { ...config.betterWiki, templates };
    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        loadTemplates(config.betterWiki?.templates || []);
      });
    });
  }

  function saveTemplate(config, templateTitle, templateEmoji, templateContent) {
    const title = templateTitle.value.trim();
    const emoji = templateEmoji.value.trim();
    const content = templateContent.value.trim();

    if (!title || !content) {
      alert("Le titre et le contenu sont obligatoires.");
      return;
    }

    const templates = config.betterWiki?.templates || [];
    const newTemplate = { title, emoji, content };

    if (editingTemplateIndex !== null) {
      templates[editingTemplateIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }

    config.betterWiki = { ...config.betterWiki, templates };
    chrome.storage.sync.get("orgaProjects", function (data) {
      const configs = data.orgaProjects || [];
      configs[selectedConfigIndex] = config;
      chrome.storage.sync.set({ orgaProjects: configs }, () => {
        loadTemplates(config.betterWiki?.templates || []);
      });
    });
  }

  function resetTemplateEditor(templateTitle, templateEmoji, templateContent) {
    editingTemplateIndex = null;
    templateTitle.value = "";
    templateEmoji.value = "";
    templateContent.value = "";
  }

  loadConfigs();
});
