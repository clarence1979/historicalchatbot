import React, { useState, useEffect, useCallback } from 'react';
import { Share2, Copy, Check, X, Loader2, Link } from 'lucide-react';
import { HistoricalFigure } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: HistoricalFigure;
}

function generateSlug(): string {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function getShareUrl(slug: string): string {
  return `${window.location.origin}${window.location.pathname}?share=${slug}`;
}

const STORAGE_KEY_PREFIX = 'share_slug_';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, character }) => {
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const storageKey = `${STORAGE_KEY_PREFIX}${character.id}`;

  const generateLink = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    // Check if we already created a link for this character
    const existingSlug = localStorage.getItem(storageKey);
    if (existingSlug) {
      setShareUrl(getShareUrl(existingSlug));
      setIsGenerating(false);
      return;
    }

    const slug = generateSlug();
    const res = await fetch(`${SUPABASE_URL}/functions/v1/create-share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ share_slug: slug, character_data: character }),
    });

    if (!res.ok) {
      setError('Failed to generate share link. Please try again.');
      setIsGenerating(false);
      return;
    }

    localStorage.setItem(storageKey, slug);
    setShareUrl(getShareUrl(slug));
    setIsGenerating(false);
  }, [character, storageKey]);

  useEffect(() => {
    if (isOpen && !shareUrl) {
      generateLink();
    }
  }, [isOpen, shareUrl, generateLink]);

  // Reset state when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setIsCopied(false);
      setError(null);
    }
  }, [isOpen]);

  const copyToClipboard = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // Fallback for browsers that don't support clipboard API
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center mb-5">
          <div className="bg-amber-100 p-2.5 rounded-xl mr-3">
            <Share2 className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Share Chatbot</h2>
            <p className="text-sm text-gray-500">Anyone with this link can chat with {character.name}</p>
          </div>
        </div>

        {/* Character preview */}
        <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-xl mb-5">
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-amber-200 flex-shrink-0">
            {character.customAvatar ? (
              <img src={character.customAvatar} alt={character.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                <span className="text-white font-bold text-lg">{character.name[0]}</span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">{character.name}</p>
            <p className="text-sm text-gray-500 truncate">{character.occupation} · {character.timePeriod}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
            <button onClick={generateLink} className="ml-2 underline font-medium">
              Try again
            </button>
          </div>
        )}

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl min-w-0">
              <Link className="h-4 w-4 text-gray-400 flex-shrink-0" />
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />
                  <span className="text-sm text-gray-400">Generating link...</span>
                </div>
              ) : (
                <span className="text-sm text-gray-700 truncate font-mono">{shareUrl}</span>
              )}
            </div>
            <button
              onClick={copyToClipboard}
              disabled={!shareUrl || isGenerating}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex-shrink-0 ${
                isCopied
                  ? 'bg-green-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white disabled:bg-gray-200 disabled:text-gray-400'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Visitors will need their own OpenAI API key to chat. This link is permanent.
        </p>
      </div>
    </div>
  );
};
