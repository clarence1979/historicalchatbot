const STORAGE_KEY = 'openai_api_key';

export const apiKeyStorage = {
  get(): string | null {
    try {
      // Try to get from localStorage first
      const localKey = localStorage.getItem(STORAGE_KEY);
      if (localKey) {
        return localKey;
      }

      // If in iframe, try to get from parent's localStorage
      if (window.parent && window.parent !== window) {
        try {
          return window.parent.localStorage.getItem(STORAGE_KEY);
        } catch (e) {
          // Cross-origin - can't access parent localStorage directly
          console.log('Running in cross-origin iframe, requesting API key from parent');
        }
      }

      return null;
    } catch (error) {
      console.error('Error reading API key from storage:', error);
      return null;
    }
  },

  set(apiKey: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, apiKey);

      // If in iframe, also try to set in parent
      if (window.parent && window.parent !== window) {
        try {
          window.parent.localStorage.setItem(STORAGE_KEY, apiKey);
        } catch (e) {
          // Cross-origin - notify parent via postMessage
          window.parent.postMessage({
            type: 'SET_API_KEY',
            key: STORAGE_KEY,
            value: apiKey
          }, '*');
        }
      }
    } catch (error) {
      console.error('Error saving API key to storage:', error);
    }
  },

  remove(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);

      // If in iframe, also try to remove from parent
      if (window.parent && window.parent !== window) {
        try {
          window.parent.localStorage.removeItem(STORAGE_KEY);
        } catch (e) {
          // Cross-origin - notify parent via postMessage
          window.parent.postMessage({
            type: 'REMOVE_API_KEY',
            key: STORAGE_KEY
          }, '*');
        }
      }
    } catch (error) {
      console.error('Error removing API key from storage:', error);
    }
  },

  // Request API key from parent window
  requestFromParent(): void {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'REQUEST_API_KEY',
        key: STORAGE_KEY
      }, '*');
    }
  }
};
