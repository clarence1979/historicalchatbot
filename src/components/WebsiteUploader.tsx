import React, { useState } from 'react';
import { Globe, AlertCircle, Check } from 'lucide-react';

interface WebsiteUploaderProps {
  onContentExtracted: (content: string, url: string) => void;
  isProcessing: boolean;
}

export const WebsiteUploader: React.FC<WebsiteUploaderProps> = ({
  onContentExtracted,
  isProcessing,
}) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    if (!url.match(/^https?:\/\/.+/i)) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.statusText}`);
      }

      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const scripts = doc.querySelectorAll('script, style, nav, footer, header');
      scripts.forEach(el => el.remove());

      const mainContent = doc.querySelector('main') || doc.querySelector('article') || doc.body;
      const textContent = mainContent?.textContent || '';

      const cleanedContent = textContent
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      if (!cleanedContent || cleanedContent.length < 100) {
        throw new Error('Could not extract sufficient content from the website');
      }

      onContentExtracted(cleanedContent, url);
      setUrl('');
    } catch (err) {
      console.error('Error fetching website:', err);
      setError(err instanceof Error ? err.message : 'Failed to extract content from website. The website may block automated access or have CORS restrictions.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-gray-200 hover:border-blue-400 transition-all">
      <div className="flex items-center mb-4">
        <div className="bg-blue-100 p-3 rounded-full mr-4">
          <Globe className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-900">Research from Website</h3>
          <p className="text-sm text-gray-600">Extract information from any webpage</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="website-url" className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            id="website-url"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://example.com/historical-figure"
            disabled={isProcessing || isLoading}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
        </div>

        {error && (
          <div className="flex items-start p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isProcessing || isLoading || !url.trim()}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Extracting Content...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Extract from Website
            </>
          )}
        </button>
      </form>

      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Note:</strong> Some websites may block automated access. For best results, use publicly accessible websites like Wikipedia, biography sites, or educational resources.
        </p>
      </div>
    </div>
  );
};
