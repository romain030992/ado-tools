/**
 * Utilitaires pour manipuler les couleurs dans la fonctionnalité Task Drift
 */
const ColorUtils = {
  /**
   * Parse une couleur hexadécimale en objet RGB
   * @param {string} hex - Couleur au format hexadécimal (#RRGGBB)
   * @returns {Object} - Objet {r, g, b} contenant les composantes RGB
   */
  parseColor(hex) {
    if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) {
      return { r: 0, g: 0, b: 0 };
    }
    
    const bigint = parseInt(hex.slice(1), 16);
    return {
      r: (bigint >> 16) & 255,
      g: (bigint >> 8) & 255,
      b: bigint & 255
    };
  },

  /**
   * Convertit des composantes RGB en chaîne de caractères CSS
   * @param {number} r - Composante rouge (0-255)
   * @param {number} g - Composante verte (0-255)
   * @param {number} b - Composante bleue (0-255)
   * @returns {string} - Couleur au format "rgb(r, g, b)"
   */
  computeColor(r, g, b) {
    return `rgb(${r}, ${g}, ${b})`;
  },

  /**
   * Interpole entre deux couleurs RGB
   * @param {Object} color1 - Première couleur {r, g, b}
   * @param {Object} color2 - Deuxième couleur {r, g, b}
   * @param {number} ratio - Ratio d'interpolation (0-1)
   * @returns {string} - Couleur interpolée au format "rgb(r, g, b)"
   */
  interpolateColor(color1, color2, ratio) {
    return this.computeColor(
      Math.round(color1.r + ratio * (color2.r - color1.r)),
      Math.round(color1.g + ratio * (color2.g - color1.g)),
      Math.round(color1.b + ratio * (color2.b - color1.b))
    );
  },

  /**
   * Calcule la couleur de dérive en fonction des valeurs et seuils
   * @param {number} originalEstimate - Estimation originale
   * @param {number} remainingWork - Travail restant
   * @param {number} completedWork - Travail complété
   * @param {Object} colors - Couleurs pour les seuils {noEstimate, firstThreshold, secondThreshold, lastThreshold}
   * @param {Object} thresholds - Valeurs des seuils {first, second}
   * @returns {string} - Couleur calculée au format "rgb(r, g, b)"
   */
  calculateDriftColor(originalEstimate, remainingWork, completedWork, colors, thresholds) {
    // Validation des données
    if (originalEstimate <= 0) {
      return this.computeColor(colors.noEstimate.r, colors.noEstimate.g, colors.noEstimate.b);
    }

    // Calcul de la dérive relative
    const totalWork = completedWork + remainingWork;
    const drift = ((totalWork - originalEstimate) / originalEstimate) * 100;

    // Définir les seuils de couleur
    if (drift <= thresholds.first) {
      // Pas de retard : couleur du premier seuil
      return this.computeColor(
        colors.firstThreshold.r, 
        colors.firstThreshold.g, 
        colors.firstThreshold.b
      );
    } else if (drift <= thresholds.second) {
      // Légère dérive : interpoler entre premier seuil et deuxième seuil
      const ratio = (drift - thresholds.first) / (thresholds.second - thresholds.first);
      return this.interpolateColor(colors.firstThreshold, colors.secondThreshold, ratio);
    } else {
      // Dérive importante : interpoler entre deuxième seuil et dernier seuil
      const ratio = (drift - thresholds.second) / (100 - thresholds.second);
      return this.interpolateColor(colors.secondThreshold, colors.lastThreshold, Math.min(ratio, 1));
    }
  }
};

export default ColorUtils;