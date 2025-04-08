/**
 * Utilitaires pour manipuler le markdown dans la fonctionnalité Better Wiki
 */
const MarkdownUtils = {
  /**
   * Insère le contenu d'un template dans la zone d'édition du wiki
   * @param {string} content - Contenu du template à insérer
   */
  insertTemplateContent(content) {
    const textarea = document.querySelector("textarea");
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const scrollTop = textarea.scrollTop;
      const before = textarea.value.substring(0, startPos);
      const after = textarea.value.substring(endPos, textarea.value.length);
      
      textarea.value = before + content + after;
      
      // Replacer le curseur après le contenu inséré
      textarea.selectionStart = startPos + content.length;
      textarea.selectionEnd = startPos + content.length;
      
      // Conserver la position de défilement
      textarea.scrollTop = scrollTop;
      
      // Déclencher un événement input pour mettre à jour la prévisualisation
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Focus sur le textarea
      textarea.focus();
    }
  }
};

export default MarkdownUtils;