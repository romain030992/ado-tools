/**
 * Classe de base pour toutes les fonctionnalités
 * Fournit les méthodes communes
 */
class FeatureBase {
  /**
   * Constructeur de la fonctionnalité de base
   * @param {string} featureKey - Clé de la fonctionnalité (ex: "betterWiki", "quickFilter")
   * @param {Object} config - Configuration complète
   */
  constructor(featureKey, config) {
    this.featureKey = featureKey;
    this.config = config;
    this.featureConfig = config[featureKey] || {};
    this.enabled = this.featureConfig.enabled || false;
  }

  /**
   * Vérifie si la fonctionnalité est activée
   * @returns {boolean} - True si la fonctionnalité est activée
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Initialise la fonctionnalité si elle est activée
   */
  init() {
    if (!this.isEnabled()) {
      console.log(`Fonctionnalité ${this.featureKey} désactivée.`);
      return;
    }
    
    console.log(`Initialisation de la fonctionnalité ${this.featureKey}...`);
    this.initFeature();
  }

  /**
   * Méthode à implémenter par les classes enfants
   * Cette méthode contient la logique spécifique d'initialisation de la fonctionnalité
   */
  initFeature() {
    throw new Error(`La méthode initFeature doit être implémentée par la classe enfant de ${this.featureKey}`);
  }
}

export default FeatureBase;