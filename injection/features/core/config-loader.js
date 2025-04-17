/**
 * Chargeur de configuration mutualisé pour toutes les fonctionnalités
 * Récupère la configuration depuis Chrome Storage
 */
class ConfigLoader {
  /**
   * Récupère la configuration pour une organisation et un projet spécifiques
   * @param {string} orgaName - Nom de l'organisation
   * @param {string} projectName - Nom du projet
   * @returns {Promise<Object>} - La configuration correspondante ou undefined
   */
  static async getConfiguration(orgaName, projectName) {
    return new Promise((resolve) => {
      chrome.storage.sync.get("orgaProjects", function (data) {
        const configs = data.orgaProjects || [];
        const config = configs.find(
          (c) =>
            c.general.orga.toLowerCase() === orgaName.toLowerCase() &&
            c.general.project.toLowerCase() === projectName.toLowerCase()
        );
        resolve(config);
      });
    });
  }

  /**
   * Extrait l'organisation et le projet à partir d'une URL Azure DevOps
   * @param {string} url - URL Azure DevOps
   * @returns {Object|null} - {orga, project} ou null si l'URL n'est pas valide
   */
  static extractOrgaAndProjectFromUrl(url) {
    const match = url.match(/https:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)/);
    if (match) {
      return { 
        orga: decodeURIComponent(match[1]), 
        project: decodeURIComponent(match[2]) 
      };
    }
    return null;
  }

  /**
   * Récupère la configuration depuis l'URL actuelle
   * @param {string} url - URL Azure DevOps
   * @returns {Promise<Object>} - La configuration ou undefined
   */
  static async getConfigurationFromUrl(url) {
    const orgaProject = this.extractOrgaAndProjectFromUrl(url);
    if (!orgaProject) return null;
    
    return this.getConfiguration(orgaProject.orga, orgaProject.project);
  }
}

export default ConfigLoader;