import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { OpenAIService } from '../services/openaiService';
import { apiKeyStorage } from '../lib/apiKeyStorage';

interface APIKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeySet: (apiKey: string) => void;
  currentApiKey?: string;
}

export const APIKeyModal: React.FC<APIKeyModalProps> = ({
  isOpen,
  onClose,
  onApiKeySet,
  currentApiKey = ''
}) => {
  const [apiKey, setApiKey] = useState(currentApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // Load API key from shared storage when modal opens
    // This pre-fills the input but user can always override by typing
    if (isOpen) {
      const savedKey = apiKeyStorage.get();
      if (savedKey) {
        setApiKey(savedKey);
      } else if (currentApiKey) {
        setApiKey(currentApiKey);
      } else {
        // No key in storage or props, start with empty input
        setApiKey('');
      }
    }
  }, [isOpen, currentApiKey]);

  if (!isOpen) return null;

  const validateAndSave = async () => {
    // Always use the value currently typed in the input field
    // This ensures user input takes precedence over any stored values
    if (!apiKey.trim()) {
      setValidationError('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Validate the API key that the user has typed
      const openaiService = new OpenAIService(apiKey);
      const isValid = await openaiService.validateApiKey();
      
      if (isValid) {
        setIsValid(true);
        onApiKeySet(apiKey);
        setTimeout(() => {
          onClose();
          setIsValid(false);
        }, 1000);
      } else {
        setValidationError('Invalid API key. Please check your key and try again.');
      }
    } catch (error) {
      setValidationError('Failed to validate API key. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      validateAndSave();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center mb-6">
          <Key className="h-6 w-6 text-amber-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">OpenAI API Configuration</h2>
        </div>

        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            To use this application, you need an OpenAI API key. Type or paste your key in the field below to get started.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="font-medium text-amber-900 mb-2">How to get your API key:</h3>
            <ol className="text-sm text-amber-800 space-y-1">
              <li>1. Visit <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">platform.openai.com/api-keys</a></li>
              <li>2. Sign in to your OpenAI account</li>
              <li>3. Click "Create new secret key"</li>
              <li>4. Copy and paste the key in the field below</li>
            </ol>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent pr-10"
              placeholder="sk-... (paste your OpenAI API key here)"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {validationError && (
          <div className="mb-4 flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
            <p className="text-red-700 text-sm">{validationError}</p>
          </div>
        )}

        {isValid && (
          <div className="mb-4 flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            <p className="text-green-700 text-sm">API key validated successfully!</p>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            disabled={isValidating}
          >
            Cancel
          </button>
          <button
            onClick={validateAndSave}
            disabled={!apiKey.trim() || isValidating || isValid}
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
          >
            {isValidating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Validating...
              </>
            ) : isValid ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Validated!
              </>
            ) : (
              'Save & Validate'
            )}
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          <p className="mb-1"><strong>Privacy:</strong> The key you type here is stored securely in your browser's local storage only.</p>
          <p><strong>Security:</strong> Your API key is never transmitted to our servers. It goes directly to OpenAI's API.</p>
        </div>
      </div>
    </div>
  );
};