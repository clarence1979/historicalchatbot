import React, { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Loader2, AlertCircle, BookOpen, ExternalLink } from 'lucide-react';
import { HistoricalFigure, VoiceSettings } from '../types';
import { supabase } from '../lib/supabase';
import { apiKeyStorage } from '../lib/apiKeyStorage';
import { ChatInterface } from './ChatInterface';
import { OpenAIService } from '../services/openaiService';

interface SharedChatViewProps {
  shareSlug: string;
}

type ViewState = 'loading' | 'not_found' | 'api_key_prompt' | 'chat' | 'error';

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  enabled: true,
  voice: 'alloy',
  speed: 1.0,
  pitch: 1.0,
  volume: 1.0,
};

export const SharedChatView: React.FC<SharedChatViewProps> = ({ shareSlug }) => {
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [character, setCharacter] = useState<HistoricalFigure | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // Step 1: fetch character from DB
  useEffect(() => {
    const fetchCharacter = async () => {
      const { data, error } = await supabase
        .from('shared_characters')
        .select('character_data')
        .eq('share_slug', shareSlug)
        .maybeSingle();

      if (error || !data) {
        setViewState('not_found');
        return;
      }

      setCharacter(data.character_data as HistoricalFigure);

      // Check if visitor already has an API key saved
      const savedKey = apiKeyStorage.get();
      if (savedKey) {
        setApiKey(savedKey);
        setViewState('chat');
      } else {
        setViewState('api_key_prompt');
      }
    };

    fetchCharacter();
  }, [shareSlug]);

  const handleValidateKey = async () => {
    if (!apiKeyInput.trim()) return;
    setIsValidating(true);
    setValidationError(null);
    try {
      const svc = new OpenAIService(apiKeyInput.trim());
      const valid = await svc.validateApiKey();
      if (valid) {
        apiKeyStorage.set(apiKeyInput.trim());
        setApiKey(apiKeyInput.trim());
        setViewState('chat');
      } else {
        setValidationError('Invalid API key. Please check and try again.');
      }
    } catch {
      setValidationError('Could not validate key. Check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  if (viewState === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-amber-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading chatbot...</p>
        </div>
      </div>
    );
  }

  if (viewState === 'not_found') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="text-center max-w-md">
          <div className="bg-white bg-opacity-10 rounded-2xl p-8">
            <BookOpen className="h-12 w-12 text-amber-400 mx-auto mb-4 opacity-60" />
            <h2 className="text-2xl font-bold text-white mb-2">Chatbot Not Found</h2>
            <p className="text-gray-300 mb-6">
              This share link doesn't exist or may have been removed.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              Create Your Own
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (viewState === 'api_key_prompt' && character) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-md w-full">
          {/* Character card */}
          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 mb-4 border border-white border-opacity-10">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 flex-shrink-0">
                {character.customAvatar ? (
                  <img src={character.customAvatar} alt={character.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">{character.name[0]}</span>
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{character.name}</h2>
                <p className="text-amber-300 text-sm">{character.occupation}</p>
                <p className="text-gray-400 text-sm">{character.timePeriod}</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">{character.biography}</p>
          </div>

          {/* API key form */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-amber-100 p-2 rounded-xl">
                <Key className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Enter Your OpenAI API Key</h3>
                <p className="text-xs text-gray-500">Required to power the conversation</p>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4 text-xs text-amber-800">
              Your API key is stored only in your browser and never sent to our servers.
              Get one at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                platform.openai.com/api-keys
              </a>
            </div>

            <div className="relative mb-3">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidateKey()}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-3 text-sm text-red-700">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {validationError}
              </div>
            )}

            <button
              onClick={handleValidateKey}
              disabled={!apiKeyInput.trim() || isValidating}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isValidating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                `Start Chatting with ${character.name}`
              )}
            </button>
          </div>

          <p className="text-center text-gray-500 text-xs mt-4">
            Powered by{' '}
            <a href="/" className="text-amber-400 hover:text-amber-300 underline">
              Historical Figures AI
            </a>
            {' '}· Create your own chatbot for free
          </p>
        </div>
      </div>
    );
  }

  if (viewState === 'chat' && character) {
    return (
      <ChatInterface
        character={character}
        apiKey={apiKey}
        voiceSettings={voiceSettings}
        onVoiceSettingsChange={setVoiceSettings}
        onCreateNew={() => { window.location.href = '/'; }}
      />
    );
  }

  return null;
};
