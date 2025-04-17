/**
 * Utilitaires pour la gestion des utilisateurs dans la fonctionnalité QuickFilter
 */
const UserUtils = {
  /**
   * Fonction de hachage simple pour générer un ordre pseudo-aléatoire
   * @param {string} str - Chaîne de caractères à hacher
   * @returns {number} - Valeur de hachage
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Conversion en entier 32 bits
    }
    return hash;
  },

  /**
   * Mélange la liste des utilisateurs de manière fixe pour une date donnée
   * @param {Array<string>} users - Liste des utilisateurs à mélanger
   * @param {string} date - Date au format YYYY-MM-DD (défaut: date du jour)
   * @returns {Array<string>} - Liste mélangée des utilisateurs
   */
  shuffleUsersByDate(users, date = null) {
    // Utiliser la date du jour par défaut ou la date fournie
    const dateStr = date || new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD
    const seed = this.hashString(dateStr);

    return users
      .map(user => ({ user, sortKey: this.hashString(user + seed) }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(item => item.user);
  }
};

export default UserUtils;