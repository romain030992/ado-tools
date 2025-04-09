import ConfigList from './components/config-list/config-list.js';
import FeatureList from './components/feature-list/feature-list.js';
import GeneralDetails from './components/feature-details/general-details.js';
import StatusAggregationDetails from './components/feature-details/status-aggregation-details.js';
import TaskDriftDetails from './components/feature-details/task-drift-details.js';
import QuickFilterDetails from './components/feature-details/quick-filter-details.js';
import BetterWikiDetails from './components/feature-details/better-wiki-details.js';
import StorageService from './services/storage-service.js';

document.addEventListener('DOMContentLoaded', async function() {
  // Conteneurs principaux
  const configListContainer = document.getElementById('configListContainer');
  const featureListContainer = document.getElementById('featureListContainer');
  const detailsContainer = document.getElementById('detailsContainer');
  const optionalColumnContainer = document.getElementById('optionalColumnContainer');
  
  // Variables d'état globales
  let currentConfig = null;
  let currentFeature = null;
  let detailsComponent = null;
  
  // Instance de ConfigList
  const configList = new ConfigList(configListContainer, {
    onSelectConfig: handleSelectConfig,
    onConfigChange: handleConfigChange
  });
  
  // Gestionnaire de sélection de configuration
  async function handleSelectConfig(index, config) {
    currentConfig = config;
    
    // Instancier la liste des fonctionnalités
    new FeatureList(featureListContainer, {
      selectedFeature: 'general',
      config: config,
      onFeatureSelect: handleFeatureSelect,
      onFeatureToggle: handleFeatureToggle
    });
    
    // Sélectionner la fonctionnalité par défaut
    handleFeatureSelect('general');
  }
  
  // Gestionnaire de modification de configuration
  function handleConfigChange(configs) {
    // Mise à jour réalisée dans le composant ConfigList
    console.log('Configurations mises à jour');
  }
  
  // Gestionnaire de sélection de fonctionnalité
  function handleFeatureSelect(featureId) {
    currentFeature = featureId;
    
    // Nettoyer le composant précédent si existant
    if (detailsComponent) {
      detailsComponent.destroy();
    }
    
    // Masquer la colonne optionnelle par défaut
    optionalColumnContainer.classList.remove('active');
    
    // Instancier le composant approprié selon la fonctionnalité
    switch (featureId) {
      case 'general':
        detailsComponent = new GeneralDetails(detailsContainer, {
          config: currentConfig,
          onSave: handleSaveConfig,
          onDelete: handleDeleteConfig
        });
        break;
      case 'status-aggregation':
        detailsComponent = new StatusAggregationDetails(detailsContainer, {
          config: currentConfig,
          onSave: handleSaveConfig
        });
        break;
      case 'task-drift':
        detailsComponent = new TaskDriftDetails(detailsContainer, {
          config: currentConfig,
          onSave: handleSaveConfig
        });
        break;
      case 'quick-filter':
        detailsComponent = new QuickFilterDetails(detailsContainer, {
          config: currentConfig,
          onSave: handleSaveConfig
        });
        break;
      case 'better-wiki':
        detailsComponent = new BetterWikiDetails(detailsContainer, {
          config: currentConfig,
          onSave: handleSaveConfig,
          optionalContainer: optionalColumnContainer
        });
        
        // Activer la colonne optionnelle pour l'édition des templates wiki
        optionalColumnContainer.classList.add('active');
        break;
    }
  }
  
  // Gestionnaire d'activation/désactivation de fonctionnalité
  async function handleFeatureToggle(featureId, enabled) {
    if (!currentConfig) return;
    
    // Créer une copie de la configuration
    const updatedConfig = {...currentConfig};
    
    // Mettre à jour l'état d'activation de la fonctionnalité
    switch (featureId) {
      case 'status-aggregation':
        updatedConfig.statusAggregation = updatedConfig.statusAggregation || {};
        updatedConfig.statusAggregation.enabled = enabled;
        break;
      case 'task-drift':
        updatedConfig.taskDrift = updatedConfig.taskDrift || {};
        updatedConfig.taskDrift.enabled = enabled;
        break;
      case 'quick-filter':
        updatedConfig.quickFilter = updatedConfig.quickFilter || {};
        updatedConfig.quickFilter.enabled = enabled;
        break;
      case 'better-wiki':
        updatedConfig.betterWiki = updatedConfig.betterWiki || {};
        updatedConfig.betterWiki.enabled = enabled;
        break;
    }
    
    // Sauvegarder la configuration mise à jour
    const index = await StorageService.getConfigurations().then(configs => {
      return configs.findIndex(c => c === currentConfig);
    });
    
    if (index !== -1) {
      await StorageService.updateConfiguration(index, updatedConfig);
      currentConfig = updatedConfig;
    }
  }
  
  // Gestionnaire de sauvegarde de configuration
  async function handleSaveConfig(configData) {
    if (!currentConfig) return;
    
    // Récupérer l'index de la configuration actuelle
    const index = await StorageService.getConfigurations().then(configs => {
      return configs.findIndex(c => c === currentConfig);
    });
    
    if (index !== -1) {
      // Créer une copie mise à jour de la configuration
      const updatedConfig = {...currentConfig};
      
      // Copier les données spécifiques à la fonctionnalité
      switch (currentFeature) {
        case 'general':
          updatedConfig.general = configData;
          break;
        case 'status-aggregation':
          updatedConfig.statusAggregation = {
            ...updatedConfig.statusAggregation,
            ...configData
          };
          break;
        case 'task-drift':
          updatedConfig.taskDrift = {
            ...updatedConfig.taskDrift,
            ...configData
          };
          break;
        case 'quick-filter':
          updatedConfig.quickFilter = {
            ...updatedConfig.quickFilter,
            ...configData
          };
          break;
        case 'better-wiki':
          updatedConfig.betterWiki = {
            ...updatedConfig.betterWiki,
            ...configData
          };
          break;
      }
      
      // Sauvegarder la configuration
      await StorageService.updateConfiguration(index, updatedConfig);
      currentConfig = updatedConfig;
      
      // Afficher un message de succès
      alert('Configuration sauvegardée avec succès !');
    }
  }
  
  // Gestionnaire de suppression de configuration
  async function handleDeleteConfig() {
    if (!currentConfig) return;
    
    if (confirm("Êtes-vous sûr de vouloir supprimer cette configuration ?")) {
      // Récupérer l'index de la configuration actuelle
      const index = await StorageService.getConfigurations().then(configs => {
        return configs.findIndex(c => c === currentConfig);
      });
      
      if (index !== -1) {
        // Supprimer la configuration
        await StorageService.deleteConfiguration(index);
        
        // Réinitialiser les variables d'état
        currentConfig = null;
        currentFeature = null;
        
        // Recharger la liste des configurations
        configList.loadConfigurations();
        
        // Nettoyer les conteneurs
        featureListContainer.innerHTML = '';
        detailsContainer.innerHTML = '';
        optionalColumnContainer.innerHTML = '';
        optionalColumnContainer.classList.remove('active');
        
        // Afficher un message de succès
        alert('Configuration supprimée avec succès !');
      }
    }
  }
});
