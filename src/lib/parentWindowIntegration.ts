/**
 * Parent Window Integration Guide
 *
 * If you're embedding this application in an iframe, the parent window needs to handle
 * postMessage communication to share the API key with the iframe.
 *
 * Add this code to your parent window:
 *
 * ```javascript
 * // Listen for API key requests from iframe
 * window.addEventListener('message', (event) => {
 *   // Verify the origin if needed for security
 *   // if (event.origin !== 'https://your-iframe-domain.com') return;
 *
 *   if (event.data && event.data.type === 'REQUEST_API_KEY') {
 *     const apiKey = localStorage.getItem('openai_api_key');
 *
 *     // Send the API key back to the iframe
 *     event.source.postMessage({
 *       type: 'API_KEY_RESPONSE',
 *       value: apiKey
 *     }, event.origin);
 *   }
 *
 *   // Handle API key updates from iframe (optional)
 *   if (event.data && event.data.type === 'SET_API_KEY') {
 *     localStorage.setItem(event.data.key, event.data.value);
 *   }
 *
 *   // Handle API key removal from iframe (optional)
 *   if (event.data && event.data.type === 'REMOVE_API_KEY') {
 *     localStorage.removeItem(event.data.key);
 *   }
 * });
 *
 * // Notify iframe when API key changes in parent (optional)
 * function notifyIframeOfApiKeyUpdate() {
 *   const iframe = document.getElementById('your-iframe-id');
 *   if (iframe && iframe.contentWindow) {
 *     iframe.contentWindow.postMessage({
 *       type: 'API_KEY_UPDATED'
 *     }, '*');
 *   }
 * }
 * ```
 *
 * For same-origin iframes, no special code is needed - localStorage is automatically shared.
 */

export const parentWindowIntegration = {
  getSampleCode(): string {
    return `
// Add this to your parent window
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'REQUEST_API_KEY') {
    const apiKey = localStorage.getItem('openai_api_key');
    event.source.postMessage({
      type: 'API_KEY_RESPONSE',
      value: apiKey
    }, event.origin);
  }

  if (event.data && event.data.type === 'SET_API_KEY') {
    localStorage.setItem(event.data.key, event.data.value);
  }

  if (event.data && event.data.type === 'REMOVE_API_KEY') {
    localStorage.removeItem(event.data.key);
  }
});
    `.trim();
  }
};
