/**
 * Gestionnaire de toasts pour afficher des notifications
 */
export default class ToastManager {
  /**
   * Map stockant les timers de debounce
   * @type {Map<string, number>}
   */
  static debounceTimers = new Map();

  /**
   * Exécute une fonction avec un délai de debounce
   * @param {Function} func - Fonction à exécuter
   * @param {number} delay - Délai en ms
   * @param {string} [id='default'] - Identifiant unique pour distinguer différents appels
   */
  static debounce(func, delay = 500, id = 'default') {
    // Annuler le timer précédent s'il existe
    if (this.debounceTimers.has(id)) {
      clearTimeout(this.debounceTimers.get(id));
    }
    
    // Créer un nouveau timer
    const timerId = setTimeout(() => {
      func();
      this.debounceTimers.delete(id);
    }, delay);
    
    // Stocker le timer
    this.debounceTimers.set(id, timerId);
  }

  /**
   * Affiche un toast avec un message
   * @param {string} message - Message à afficher
   * @param {string} type - Type de toast (success, error, warning, info)
   * @param {number} duration - Durée d'affichage en ms
   */
  static showToast(message, type = 'info', duration = 3000) {
    // Créer le conteneur principal s'il n'existe pas
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      document.body.appendChild(toastContainer);
      
      // Ajouter les styles CSS pour le conteneur de toasts
      const style = document.createElement('style');
      style.textContent = `
        #toast-container {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 9999;
        }
        .toast {
          padding: 12px 20px;
          margin-bottom: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
          display: flex;
          align-items: center;
          min-width: 250px;
          max-width: 350px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.3s, transform 0.3s;
        }
        .toast.show {
          opacity: 1;
          transform: translateY(0);
        }
        .toast.success {
          background-color: #4CAF50;
          color: white;
        }
        .toast.error {
          background-color: #F44336;
          color: white;
        }
        .toast.warning {
          background-color: #FF9800;
          color: white;
        }
        .toast.info {
          background-color: #2196F3;
          color: white;
        }
        .toast-icon {
          margin-right: 10px;
        }
        .toast-message {
          flex-grow: 1;
        }
      `;
      document.head.appendChild(style);
    }
    
    // Créer l'élément toast
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Ajouter l'icône appropriée
    const icon = document.createElement('i');
    switch (type) {
      case 'success':
        icon.className = 'fas fa-check-circle toast-icon';
        break;
      case 'error':
        icon.className = 'fas fa-exclamation-circle toast-icon';
        break;
      case 'warning':
        icon.className = 'fas fa-exclamation-triangle toast-icon';
        break;
      default:
        icon.className = 'fas fa-info-circle toast-icon';
    }
    toast.appendChild(icon);
    
    // Ajouter le message
    const messageEl = document.createElement('div');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);
    
    // Ajouter le toast au conteneur
    toastContainer.appendChild(toast);
    
    // Animer l'apparition du toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);
    
    // Supprimer le toast après la durée spécifiée
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, duration);
  }
}
