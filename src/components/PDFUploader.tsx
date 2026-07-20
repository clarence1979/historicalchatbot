import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, FileText, X, AlertCircle, CheckCircle, Type, Clipboard, Save, Download, Brain, Globe } from 'lucide-react';
import { PDFProcessor, PDFProcessingResult } from '../utils/pdfProcessor';
import { OpenAIService } from '../services/openaiService';
import { WebsiteUploader } from './WebsiteUploader';

interface PDFUploaderProps {
  onFileProcessed: (result: PDFProcessingResult) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  apiKey: string;
}

type InputMethod = 'research' | 'pdf' | 'manual' | 'paste' | 'website';

interface CollectedData {
  type: InputMethod;
  content: string;
  label: string;
  metadata?: any;
}

export const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFileProcessed,
  isProcessing,
  setIsProcessing,
  apiKey
}) => {
  const [activeMethod, setActiveMethod] = useState<InputMethod>('research');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [pdfUrl, setPdfUrl] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  // Collected data from multiple sources
  const [collectedData, setCollectedData] = useState<CollectedData[]>([]);
  const [showCollectedData, setShowCollectedData] = useState(false);
  
  // Manual input states
  const [manualText, setManualText] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  
  // Paste functionality states
  const [pasteText, setPasteText] = useState('');
  const [pasteSuccess, setPasteSuccess] = useState(false);
  
  // AI Research states
  const [researchName, setResearchName] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const [researchProgress, setResearchProgress] = useState(0);

  // Website extraction states
  const [websiteContents, setWebsiteContents] = useState<Array<{ url: string; content: string }>>([]);

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pasteAreaRef = useRef<HTMLTextAreaElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  const MAX_CHARACTERS = 50000;

  // Auto-save functionality
  useEffect(() => {
    if (manualText.length > 0) {
      setAutoSaveStatus('unsaved');
      
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      
      autoSaveTimeoutRef.current = setTimeout(() => {
        setAutoSaveStatus('saving');
        // Simulate save to localStorage
        localStorage.setItem('manual-character-text', manualText);
        setTimeout(() => setAutoSaveStatus('saved'), 500);
      }, 2000);
    }
    
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [manualText]);

  // Load saved text on component mount
  useEffect(() => {
    const savedText = localStorage.getItem('manual-character-text');
    if (savedText) {
      setManualText(savedText);
      setCharacterCount(savedText.length);
    }
  }, []);

  // Update character count
  useEffect(() => {
    setCharacterCount(manualText.length);
  }, [manualText]);

  // Helper function to extract basic information from AI research content
  const extractBasicInfoFromResearch = (content: string, name: string) => {
    const info: any = { name };
    
    // Extract birth year
    const birthMatch = content.match(/Born:?\s*(\d{4})/i) || content.match(/\b(\d{4})\s*[-–]\s*\d{4}\b/) || content.match(/\((\d{4})\s*[-–]/);
    if (birthMatch) info.birthYear = birthMatch[1];
    
    // Extract death year
    const deathMatch = content.match(/Died:?\s*(\d{4})/i) || content.match(/\b\d{4}\s*[-–]\s*(\d{4})\b/) || content.match(/[-–]\s*(\d{4})\)/);
    if (deathMatch) info.deathYear = deathMatch[1];
    
    // Extract nationality
    const nationalityMatch = content.match(/Nationality:?\s*([^\n\r]+)/i) || content.match(/was\s+(?:an?\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s+(?:president|king|queen|emperor|leader|scientist|artist|writer|philosopher)/i);
    if (nationalityMatch) info.nationality = nationalityMatch[1].trim();
    
    // Extract occupation
    const occupationMatch = content.match(/Occupation:?\s*([^\n\r]+)/i) || content.match(/was\s+(?:the\s+)?(?:a\s+)?([^,\n\r]+?)(?:\s+who|\s+known|\s+from|\.|,)/i);
    if (occupationMatch) info.occupation = occupationMatch[1].trim();
    
    // Extract time period
    const periodMatch = content.match(/Historical Period:?\s*([^\n\r]+)/i) || content.match(/lived\s+(?:during\s+)?(?:the\s+)?([^,\n\r]+?)(?:\s+era|\s+period|,|\.|$)/i);
    if (periodMatch) info.timePeriod = periodMatch[1].trim();
    
    return info;
  };

  const handleResearch = async () => {
    if (!researchName.trim()) {
      setError('Please enter the name of a historical figure');
      return;
    }

    setError(null);
    setIsResearching(true);
    setResearchProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setResearchProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Use OpenAI to research the historical figure
      const openaiService = new OpenAIService(apiKey);
      
      // Create comprehensive research prompt
      const researchPrompt = `Research and provide comprehensive information about ${researchName.trim()}. Include all biographical details and format as a detailed research document.

IMPORTANT: Include complete biographical information including:
1. Full name and any alternative names
2. Exact birth and death dates (years)
3. Nationality and place of birth
4. Primary occupation and roles
2. Historical context and time period they lived in
3. Major life events and milestones
4. Key achievements and contributions
5. Personality traits and characteristics
6. Core beliefs, values, and worldview
7. Historical significance and legacy
8. Interesting facts and lesser-known details

Format the response as detailed paragraphs that would help create an authentic AI character representation of this historical figure. Focus on information that would help someone understand their personality, motivations, and historical context.

Start with: "Full Name: [Complete name]
Born: [Year] in [Location]
Died: [Year] (if applicable)
Nationality: [Nationality]
Occupation: [Primary role/occupation]
Historical Period: [Time period]"

Then continue with detailed biographical information.`;

      // Generate research content using GPT-4 via edge function
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${SUPABASE_URL}/functions/v1/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey,
          tier: 'smart',
          messages: [{ role: 'user', content: researchPrompt }],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Research failed: ${response.statusText}`);
      }

      const data = await response.json();
      const researchContent = data.choices[0].message.content;

      // Generate character portrait using DALL-E 3
      const portraitPrompt = `A professional historical portrait of ${researchName.trim()}, realistic style, high quality, historically accurate appearance, neutral background, facing forward, dignified pose, painted in the style of classical historical portraits`;
      
      const portraitUrl = await openaiService.generateImage(portraitPrompt, `Historical portrait of ${researchName.trim()}`);
      
      clearInterval(progressInterval);
      setResearchProgress(100);
      
      // Create research result with generated portrait
      const researchText = `AI Research: ${researchName.trim()}\n\n${researchContent}`;
      
      // Extract basic information from research content for auto-filling form
      const extractedInfo = extractBasicInfoFromResearch(researchContent, researchName.trim());
      
      // Add to collected data instead of immediate processing
      const newData: CollectedData = {
        type: 'research',
        content: researchText,
        label: `AI Research: ${researchName.trim()}`,
        metadata: {
          portraitUrl,
          extractedInfo
        }
      };

      setCollectedData(prev => [...prev, newData]);
      setShowCollectedData(true);
      setIsResearching(false);
      setResearchProgress(0);
      setResearchName('');
      
    } catch (err) {
      console.error('Research error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to research historical figure';
      setError(`Research failed: ${errorMessage}. Please try again or use one of the other input methods.`);
      setIsResearching(false);
      setResearchProgress(0);
    }
  };

  const selectExampleFigure = (name: string) => {
    setResearchName(name);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    const validation = PDFProcessor.validateFile(file);
    if (!validation.isValid) {
      setError(validation.error!);
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await PDFProcessor.extractTextFromFile(file);

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Add to collected data
      const newData: CollectedData = {
        type: 'pdf',
        content: result.text,
        label: `PDF: ${file.name}`,
        metadata: result
      };

      setTimeout(() => {
        setCollectedData(prev => [...prev, newData]);
        setShowCollectedData(true);
        setIsProcessing(false);
        setUploadedFile(null);
        setProcessingProgress(0);
      }, 500);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process PDF');
      setIsProcessing(false);
      setUploadedFile(null);
      setProcessingProgress(0);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setError(null);
    setProcessingProgress(0);
  };

  const handleUrlSubmit = async () => {
    if (!pdfUrl.trim()) {
      setError('Please enter a PDF URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(pdfUrl);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setError(null);
    setIsDownloading(true);
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 70) {
            clearInterval(progressInterval);
            return 70;
          }
          return prev + 10;
        });
      }, 200);

      // Try multiple methods to handle CORS issues
      let blob: Blob;
      let fileName = pdfUrl.split('/').pop() || 'downloaded.pdf';
      
      try {
        // Method 1: Direct fetch (works for CORS-enabled URLs)
        const response = await fetch(pdfUrl, {
          mode: 'cors',
          headers: {
            'Accept': 'application/pdf,*/*',
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        blob = await response.blob();
        
        // Verify it's a PDF
        if (!blob.type.includes('pdf') && !pdfUrl.toLowerCase().includes('.pdf')) {
          throw new Error('The URL does not appear to point to a PDF file');
        }
        
      } catch (corsError) {
        // Method 2: Try multiple CORS proxy services
        const proxyServices = [
          `https://corsproxy.io/?${encodeURIComponent(pdfUrl)}`,
          `https://api.allorigins.win/raw?url=${encodeURIComponent(pdfUrl)}`
        ];
        
        let proxyError = corsError;
        blob = null as any;
        
        for (const proxyUrl of proxyServices) {
          try {
            console.log(`Trying proxy: ${proxyUrl}`);
            const response = await fetch(proxyUrl, {
              headers: {
                'Accept': 'application/pdf,*/*',
              }
            });
            
            if (response.ok) {
              blob = await response.blob();
              if (blob.size > 0) {
                console.log(`Success with proxy: ${proxyUrl}`);
                break;
              }
            }
          } catch (err) {
            console.log(`Proxy failed: ${proxyUrl}`, err);
            proxyError = err as Error;
            continue;
          }
        }
        
        if (!blob || blob.size === 0) {
          const errorMessage = proxyError?.message || 'Network or server issue occurred';
          throw new Error(`Unable to access PDF: ${errorMessage}. This may be due to CORS restrictions or server issues. Try downloading the file manually and uploading it instead.`);
        }
      }

      // Ensure we have a PDF-like blob
      if (blob.size === 0) {
        throw new Error('Downloaded file is empty');
      }
      
      // Convert blob to file with PDF mime type
      const file = new File([blob], fileName, { type: 'application/pdf' });

      clearInterval(progressInterval);
      setProcessingProgress(80);

      // Process the downloaded PDF
      const result = await PDFProcessor.extractTextFromFile(file);

      setProcessingProgress(100);

      // Add to collected data
      const newData: CollectedData = {
        type: 'pdf',
        content: result.text,
        label: `PDF from URL: ${fileName}`,
        metadata: result
      };

      setTimeout(() => {
        setCollectedData(prev => [...prev, newData]);
        setShowCollectedData(true);
        setIsProcessing(false);
        setIsDownloading(false);
        setPdfUrl('');
        setProcessingProgress(0);
      }, 500);
      
    } catch (err) {
      console.error('PDF URL processing error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to process PDF from URL';
      setError(`${errorMessage}\n\nTip: If the URL doesn't work, try right-clicking the link and selecting "Save As" to download the PDF manually, then upload it using the file uploader above.`);
      setIsProcessing(false);
      setIsDownloading(false);
      setProcessingProgress(0);
    }
  };

  const handleManualTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_CHARACTERS) {
      setManualText(text);
    }
  };

  const processManualText = () => {
    if (!manualText.trim()) {
      setError('Please enter some text about the historical figure');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Add to collected data
      const newData: CollectedData = {
        type: 'manual',
        content: manualText.trim(),
        label: `Manual Input (${manualText.trim().length} characters)`
      };

      setTimeout(() => {
        setCollectedData(prev => [...prev, newData]);
        setShowCollectedData(true);
        setIsProcessing(false);
        setProcessingProgress(0);
        setManualText('');
        localStorage.removeItem('manual-character-text');
      }, 500);
    }, 1000);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text.trim()) {
        setPasteText(text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      } else {
        setError('Clipboard is empty or contains no text');
      }
    } catch (err) {
      setError('Failed to access clipboard. Please ensure you have granted clipboard permissions.');
    }
  };

  const processPastedText = () => {
    if (!pasteText.trim()) {
      setError('Please paste some text first');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Add to collected data
      const newData: CollectedData = {
        type: 'paste',
        content: pasteText.trim(),
        label: `Pasted Text (${pasteText.trim().length} characters)`
      };

      setTimeout(() => {
        setCollectedData(prev => [...prev, newData]);
        setShowCollectedData(true);
        setIsProcessing(false);
        setProcessingProgress(0);
        setPasteText('');
      }, 500);
    }, 1000);
  };

  const handleWebsiteContent = (content: string, url: string) => {
    setWebsiteContents(prev => [...prev, { url, content }]);
    setError(null);
  };

  const removeWebsiteContent = (index: number) => {
    setWebsiteContents(prev => prev.filter((_, i) => i !== index));
  };

  const processWebsiteContents = () => {
    if (websiteContents.length === 0) {
      setError('Please add at least one website to extract information from');
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 100);

    setTimeout(() => {
      clearInterval(progressInterval);
      setProcessingProgress(100);

      const combinedText = websiteContents
        .map((item, index) => `Source ${index + 1}: ${item.url}\n\n${item.content}`)
        .join('\n\n---\n\n');

      // Add to collected data
      const newData: CollectedData = {
        type: 'website',
        content: combinedText,
        label: `Website Research (${websiteContents.length} ${websiteContents.length === 1 ? 'source' : 'sources'})`
      };

      setTimeout(() => {
        setCollectedData(prev => [...prev, newData]);
        setShowCollectedData(true);
        setIsProcessing(false);
        setProcessingProgress(0);
        setWebsiteContents([]);
      }, 500);
    }, 1000);
  };

  const insertFormatting = (format: 'bold' | 'italic' | 'bullet') => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = manualText.substring(start, end);

    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'bullet':
        formattedText = `\n• ${selectedText || 'bullet point'}`;
        break;
    }

    const newText = manualText.substring(0, start) + formattedText + manualText.substring(end);
    setManualText(newText);

    // Focus and set cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const getAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return <span className="text-blue-600 text-xs">Saving...</span>;
      case 'saved':
        return <span className="text-green-600 text-xs">Auto-saved</span>;
      case 'unsaved':
        return <span className="text-orange-600 text-xs">Unsaved changes</span>;
      default:
        return null;
    }
  };

  const removeCollectedData = (index: number) => {
    setCollectedData(prev => prev.filter((_, i) => i !== index));
  };

  const processAllCollectedData = () => {
    if (collectedData.length === 0) {
      setError('Please add at least one data source before proceeding');
      return;
    }

    // Combine all collected data
    const combinedText = collectedData
      .map((item, index) => `=== Data Source ${index + 1}: ${item.label} ===\n\n${item.content}`)
      .join('\n\n' + '='.repeat(80) + '\n\n');

    // Get the first research item's metadata if available (for portrait and basic info)
    const researchItem = collectedData.find(item => item.type === 'research');
    const portraitUrl = researchItem?.metadata?.portraitUrl;
    const extractedInfo = researchItem?.metadata?.extractedInfo;

    const result: PDFProcessingResult = {
      text: combinedText,
      numPages: collectedData.length,
      title: `Combined Research (${collectedData.length} sources)`,
      author: 'Multiple Sources',
      generatedPortrait: portraitUrl,
      extractedBasicInfo: extractedInfo
    };

    onFileProcessed(result);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-0">
      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 drop-shadow-lg">Add Historical Character Information</h2>
        <p className="text-sm sm:text-base text-gray-100 drop-shadow-md">
          Choose your preferred method to provide information about a historical figure.
        </p>
      </div>

      {/* Method Selection Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 bg-white bg-opacity-20 backdrop-blur-sm p-2 rounded-lg">
          <button
            onClick={() => setActiveMethod('research')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeMethod === 'research'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Research
          </button>
          <button
            onClick={() => setActiveMethod('pdf')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeMethod === 'pdf'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload PDF
          </button>
          <button
            onClick={() => setActiveMethod('manual')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeMethod === 'manual'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Type className="h-4 w-4 mr-2" />
            Type Manually
          </button>
          <button
            onClick={() => setActiveMethod('paste')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeMethod === 'paste'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Clipboard className="h-4 w-4 mr-2" />
            Paste Text
          </button>
          <button
            onClick={() => setActiveMethod('website')}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
              activeMethod === 'website'
                ? 'bg-white text-gray-900 shadow-lg'
                : 'text-white hover:bg-white hover:bg-opacity-20'
            }`}
          >
            <Globe className="h-4 w-4 mr-2" />
            From Website
          </button>
        </div>
      </div>

      {/* AI Research Method */}
      {activeMethod === 'research' && (
        <div className="space-y-6">
          {/* Main Research Section */}
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🔍 AI Historical Research</h3>
            <p className="text-sm text-gray-600 mb-4">
              Simply enter the name of any historical figure and our AI will automatically research and compile 
              comprehensive information including their biography, achievements, personality, and historical context.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Historical Figure Name
                </label>
                <input
                  type="text"
                  value={researchName}
                  onChange={(e) => setResearchName(e.target.value)}
                  placeholder="e.g., Abraham Lincoln, Marie Curie, Leonardo da Vinci..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-base"
                  disabled={isResearching}
                  onKeyPress={(e) => e.key === 'Enter' && handleResearch()}
                />
              </div>
              
              <button
                onClick={handleResearch}
                disabled={!researchName.trim() || isResearching}
                className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg text-base font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isResearching ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Researching {researchName}...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5 mr-2" />
                    Research Historical Figure
                  </>
                )}
              </button>
            </div>

            {isResearching && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Researching {researchName}...
                  </span>
                  <span className="text-sm text-gray-500">{researchProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${researchProgress}%` }}
                  ></div>
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  Gathering biographical information, achievements, personality traits, and historical context...
                </div>
              </div>
            )}

            {researchProgress === 100 && (
              <div className="mt-4 flex items-center justify-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">Research completed successfully!</span>
              </div>
            )}
          </div>

          {/* Quick Examples */}
          <div className="bg-blue-50 bg-opacity-95 backdrop-blur-sm border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">⚡ Quick Examples</h3>
            <p className="text-sm text-blue-800 mb-4">
              Click on any of these popular historical figures to instantly start researching:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                'Albert Einstein',
                'Marie Curie', 
                'Winston Churchill',
                'Cleopatra VII',
                'Leonardo da Vinci',
                'Mahatma Gandhi',
                'Napoleon Bonaparte',
                'Joan of Arc',
                'Martin Luther King Jr.'
              ].map((name) => (
                <button
                  key={name}
                  onClick={() => selectExampleFigure(name)}
                  disabled={isResearching}
                  className="text-left p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-green-50 bg-opacity-95 backdrop-blur-sm border border-green-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-green-900 mb-3">🎯 How AI Research Works</h3>
            <div className="space-y-3 text-sm text-green-800">
              <div className="flex items-start">
                <div className="bg-green-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-green-900 mr-3 mt-0.5">1</div>
                <div>
                  <strong>Enter Name:</strong> Simply type the name of any historical figure
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-green-900 mr-3 mt-0.5">2</div>
                <div>
                  <strong>AI Research:</strong> Our AI automatically gathers comprehensive information about their life, achievements, and personality
                </div>
              </div>
              <div className="flex items-start">
                <div className="bg-green-200 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold text-green-900 mr-3 mt-0.5">3</div>
                <div>
                  <strong>Character Creation:</strong> Proceed to create a detailed AI character with all the researched information
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Upload Method */}
      {activeMethod === 'pdf' && (
        <div className="space-y-6">
          {/* Sample PDF Section */}
          <div className="bg-blue-50 bg-opacity-95 backdrop-blur-sm border border-blue-200 rounded-lg p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">📖 Try with Sample PDF</h3>
            <p className="text-sm text-blue-800 mb-4">
              Want to test the app? Download this sample Bible PDF and upload it to create a biblical character.
            </p>
            <div className="space-y-3">
              <a
                href="https://www.ccel.org/ccel/b/bible/kjv/cache/kjv.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Sample Bible PDF
              </a>
              <div className="text-xs text-blue-700 space-y-1">
                <p><strong>Instructions:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Click the download link above</li>
                  <li>Save the PDF file to your computer</li>
                  <li>Upload it using the file uploader below</li>
                  <li>Create a biblical character (e.g., Jesus, Moses, David)</li>
                </ol>
              </div>
            </div>
          </div>

          {/* URL Input Section */}
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">🔗 Or Enter PDF URL</h3>
            <p className="text-sm text-gray-600 mb-4">
              Have a direct link to a PDF? Paste it here and we'll download and process it automatically.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://example.com/document.pdf"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                disabled={isProcessing}
              />
              <button
                onClick={handleUrlSubmit}
                disabled={!pdfUrl.trim() || isProcessing}
                className="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium whitespace-nowrap"
              >
                {isDownloading ? 'Downloading...' : 'Process URL'}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Try the sample URL above, or paste any direct PDF link here
            </p>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>Note:</strong> Some websites block direct PDF access due to security policies. 
                If a URL doesn't work, try downloading the PDF manually and using the file uploader above.
              </p>
            </div>
          </div>

          {/* Alternative Download Instructions */}
          <div className="bg-gray-50 bg-opacity-95 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">📥 Manual Download Alternative</h3>
            <p className="text-sm text-gray-600 mb-3">
              If the URL processing doesn't work, you can manually download any PDF:
            </p>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>Right-click on any PDF link and select <strong>"Save link as..."</strong> or <strong>"Download"</strong></li>
              <li>Choose a location on your computer to save the file</li>
              <li>Use the file uploader below to upload the downloaded PDF</li>
            </ol>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded">
              <p className="text-xs text-amber-800">
                💡 This method works with any PDF file from any website, even those with strict security policies.
              </p>
            </div>
          </div>

          {/* File Upload Section */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-4 sm:p-8 text-center transition-all duration-200 bg-white bg-opacity-95 backdrop-blur-sm shadow-xl ${
              dragActive
                ? 'border-amber-500 bg-amber-50 bg-opacity-95'
                : uploadedFile
                ? 'border-green-500 bg-green-50 bg-opacity-95'
                : 'border-gray-300 hover:border-amber-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {!uploadedFile ? (
              <>
                <Upload className={`mx-auto h-10 sm:h-12 w-10 sm:w-12 mb-4 ${dragActive ? 'text-amber-600' : 'text-gray-400'}`} />
                <div className="space-y-2">
                  <p className="text-base sm:text-lg font-medium text-gray-700">
                    Drop your PDF here, or{' '}
                    <label className="text-amber-600 hover:text-amber-700 cursor-pointer underline">
                      browse files
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                      />
                    </label>
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    Supports PDF files up to 10MB
                  </p>
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <FileText className="h-6 sm:h-8 w-6 sm:w-8 text-green-600" />
                  <div className="text-left">
                    <p className="text-sm sm:text-base font-medium text-gray-900 break-all">{uploadedFile.name}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {PDFProcessor.formatFileSize(uploadedFile.size)}
                    </p>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    onClick={removeFile}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">
                    {isDownloading ? 'Downloading and processing PDF...' : 'Processing PDF...'}
                  </span>
                  <span className="text-xs sm:text-sm text-gray-500">{processingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            {processingProgress === 100 && (
              <div className="mt-4 flex items-center justify-center text-green-600">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="text-xs sm:text-sm font-medium">PDF processed successfully!</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Manual Text Input Method */}
      {activeMethod === 'manual' && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 shadow-xl">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Manual Text Input</h3>
              {getAutoSaveIndicator()}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Type or paste detailed information about the historical figure. Include biographical details, 
              achievements, personality traits, and historical context.
            </p>
            
            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-50 rounded-lg">
              <button
                onClick={() => insertFormatting('bold')}
                className="px-3 py-1 text-sm font-bold bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Bold text"
              >
                B
              </button>
              <button
                onClick={() => insertFormatting('italic')}
                className="px-3 py-1 text-sm italic bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Italic text"
              >
                I
              </button>
              <button
                onClick={() => insertFormatting('bullet')}
                className="px-3 py-1 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                title="Bullet point"
              >
                • List
              </button>
            </div>
          </div>

          <textarea
            ref={textAreaRef}
            value={manualText}
            onChange={handleManualTextChange}
            placeholder="Enter detailed information about the historical figure here...

Example:
**Abraham Lincoln** (1809-1865) was the 16th President of the United States.

*Key achievements:*
• Led the nation through the Civil War
• Issued the Emancipation Proclamation
• Preserved the Union

*Personality traits:*
Known for his honesty, humility, and strong moral convictions..."
            className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed"
            disabled={isProcessing}
          />

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className={`${characterCount > MAX_CHARACTERS * 0.9 ? 'text-orange-600' : ''}`}>
                {characterCount.toLocaleString()} / {MAX_CHARACTERS.toLocaleString()} characters
              </span>
              <span className="text-gray-400">•</span>
              <span>Auto-save enabled</span>
            </div>
            
            <button
              onClick={processManualText}
              disabled={!manualText.trim() || isProcessing || characterCount > MAX_CHARACTERS}
              className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Process Text
                </>
              )}
            </button>
          </div>

          {isProcessing && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Processing text...</span>
                <span className="text-sm text-gray-500">{processingProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Paste Method */}
      {activeMethod === 'paste' && (
        <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 shadow-xl">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Paste from Clipboard</h3>
            <p className="text-sm text-gray-600 mb-4">
              Copy text from any source (websites, documents, etc.) and paste it here. 
              The system will automatically process various text formats.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handlePaste}
                disabled={isProcessing}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                <Clipboard className="h-5 w-5 mr-2" />
                Paste from Clipboard
              </button>
              
              {pasteSuccess && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Text pasted successfully!</span>
                </div>
              )}
            </div>

            {pasteText && (
              <div className="border border-gray-300 rounded-lg">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Pasted Content Preview</span>
                  <span className="text-xs text-gray-500">{pasteText.length.toLocaleString()} characters</span>
                </div>
                <textarea
                  ref={pasteAreaRef}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  className="w-full h-64 p-4 border-0 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none text-sm leading-relaxed"
                  placeholder="Pasted content will appear here..."
                />
              </div>
            )}

            {pasteText && (
              <div className="flex justify-end">
                <button
                  onClick={processPastedText}
                  disabled={!pasteText.trim() || isProcessing}
                  className="bg-amber-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Process Pasted Text
                    </>
                  )}
                </button>
              </div>
            )}

            {isProcessing && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Processing pasted text...</span>
                  <span className="text-sm text-gray-500">{processingProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeMethod === 'website' && (
        <div className="space-y-6">
          <WebsiteUploader
            onContentExtracted={handleWebsiteContent}
            isProcessing={isProcessing}
          />

          {websiteContents.length > 0 && (
            <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Extracted Content ({websiteContents.length} {websiteContents.length === 1 ? 'source' : 'sources'})
              </h3>

              <div className="space-y-3 mb-4">
                {websiteContents.map((item, index) => (
                  <div key={index} className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 mb-1">Source {index + 1}</p>
                      <p className="text-xs text-gray-600 truncate">{item.url}</p>
                      <p className="text-xs text-gray-500 mt-1">{item.content.length.toLocaleString()} characters</p>
                    </div>
                    <button
                      onClick={() => removeWebsiteContent(index)}
                      className="ml-3 text-red-600 hover:text-red-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                onClick={processWebsiteContents}
                disabled={isProcessing}
                className="w-full bg-amber-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Process All Sources
                  </>
                )}
              </button>

              {isProcessing && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Processing website content...</span>
                    <span className="text-sm text-gray-500">{processingProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${processingProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Collected Data Sources Section */}
      {collectedData.length > 0 && (
        <div className="mb-6 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-4 sm:p-6 shadow-xl border-2 border-green-500">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Collected Data Sources ({collectedData.length})
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                All sources will be combined when you proceed to character creation
              </p>
            </div>
            <button
              onClick={() => setShowCollectedData(!showCollectedData)}
              className="text-amber-600 hover:text-amber-700 font-medium text-sm"
            >
              {showCollectedData ? 'Hide' : 'Show'}
            </button>
          </div>

          {showCollectedData && (
            <div className="space-y-3 mb-4">
              {collectedData.map((item, index) => (
                <div key={index} className="flex items-start justify-between p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-2">
                      {item.type === 'research' && <Brain className="h-4 w-4 text-purple-600 mr-2" />}
                      {item.type === 'pdf' && <FileText className="h-4 w-4 text-red-600 mr-2" />}
                      {item.type === 'manual' && <Type className="h-4 w-4 text-blue-600 mr-2" />}
                      {item.type === 'paste' && <Clipboard className="h-4 w-4 text-green-600 mr-2" />}
                      {item.type === 'website' && <Globe className="h-4 w-4 text-orange-600 mr-2" />}
                      <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                    </div>
                    <p className="text-xs text-gray-600">{item.content.length.toLocaleString()} characters of content</p>
                    {item.metadata?.portraitUrl && (
                      <div className="mt-2 flex items-center text-xs text-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Includes generated portrait
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeCollectedData(index)}
                    className="ml-3 text-red-600 hover:text-red-700 transition-colors"
                    title="Remove this data source"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={processAllCollectedData}
              className="flex-1 bg-gradient-to-r from-green-600 to-blue-600 text-white px-6 py-4 rounded-lg font-semibold hover:from-green-700 hover:to-blue-700 transition-all shadow-lg flex items-center justify-center text-base"
            >
              <CheckCircle className="h-5 w-5 mr-2" />
              Proceed with {collectedData.length} {collectedData.length === 1 ? 'Source' : 'Sources'}
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all collected data sources?')) {
                  setCollectedData([]);
                }
              }}
              className="px-6 py-4 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
            >
              Clear All
            </button>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> You can continue adding more sources from any of the tabs above. All sources will be combined and used together for creating your character.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
          <p className="text-xs sm:text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
};