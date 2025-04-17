/**
 * Service pour gérer le stockage des configurations
 */
export default class StorageService {
  /**
   * Clé utilisée pour stocker les configurations dans le stockage Chrome
   * @type {string}
   */
  static STORAGE_KEY = 'orgaProjects';

  /**
   * Récupère toutes les configurations
   * @returns {Promise<Array>} - Liste des configurations
   */
  static async getConfigurations() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.STORAGE_KEY, (data) => {
        resolve(data[this.STORAGE_KEY] || []);
      });
    });
  }

  /**
   * Enregistre toutes les configurations
   * @param {Array} configs - Liste des configurations à sauvegarder
   * @returns {Promise<void>}
   */
  static async saveConfigurations(configs) {
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [this.STORAGE_KEY]: configs }, resolve);
    });
  }

  /**
   * Ajoute une nouvelle configuration
   * @param {Object} config - Configuration à ajouter
   * @returns {Promise<Array>} - Liste mise à jour des configurations
   */
  static async addConfiguration(config) {
    const configs = await this.getConfigurations();
    configs.push(config);
    await this.saveConfigurations(configs);
    return configs;
  }

  /**
   * Met à jour une configuration existante
   * @param {number} index - Index de la configuration à mettre à jour
   * @param {Object} config - Nouvelles données de la configuration
   * @returns {Promise<Array>} - Liste mise à jour des configurations
   */
  static async updateConfiguration(index, config) {
    const configs = await this.getConfigurations();
    
    if (index >= 0 && index < configs.length) {
      configs[index] = config;
      await this.saveConfigurations(configs);
    }
    
    return configs;
  }

  /**
   * Supprime une configuration
   * @param {number} index - Index de la configuration à supprimer
   * @returns {Promise<Array>} - Liste mise à jour des configurations
   */
  static async deleteConfiguration(index) {
    const configs = await this.getConfigurations();
    
    if (index >= 0 && index < configs.length) {
      configs.splice(index, 1);
      await this.saveConfigurations(configs);
    }
    
    return configs;
  }
}