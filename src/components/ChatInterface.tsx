import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Image, Download, Volume2, VolumeX, RotateCcw, Settings, Play, Volume1, RefreshCw, Share2 } from 'lucide-react';
import { HistoricalFigure, ChatMessage, VoiceSettings } from '../types';
import { OpenAIService } from '../services/openaiService';
import { ShareModal } from './ShareModal';

interface ChatInterfaceProps {
  character: HistoricalFigure;
  apiKey: string;
  voiceSettings: VoiceSettings;
  onVoiceSettingsChange: (settings: VoiceSettings) => void;
  onBack?: () => void;
  onCreateNew?: () => void;
  onCharacterUpdate?: (character: HistoricalFigure) => void;
}

const CONVERSATION_STARTERS = [
  "Tell me about your greatest achievement",
  "What was daily life like in your time?",
  "What do you think about modern society?",
  "Describe the most challenging moment in your life",
  "What advice would you give to young people today?",
];

const VOICE_OPTIONS = [
  { value: 'alloy', label: 'Alloy (Neutral)', gender: 'neutral' },
  { value: 'echo', label: 'Echo (Male)', gender: 'male' },
  { value: 'fable', label: 'Fable (British)', gender: 'male' },
  { value: 'onyx', label: 'Onyx (Deep Male)', gender: 'male' },
  { value: 'nova', label: 'Nova (Female)', gender: 'female' },
  { value: 'shimmer', label: 'Shimmer (Soft Female)', gender: 'female' },
];

// Function to get background based on character
const getCharacterBackground = (character: HistoricalFigure): string => {
  // If user uploaded a custom background, use it
  if (character.customBackground) {
    return `url("${character.customBackground}") center/cover`;
  }
  
  const name = character.name.toLowerCase();
  const timePeriod = character.timePeriod.toLowerCase();
  const occupation = character.occupation.toLowerCase();
  const nationality = character.nationality?.toLowerCase() || '';
  
  // Jesus/Biblical figures
  if (name.includes('jesus') || name.includes('christ') || occupation.includes('messiah') || occupation.includes('savior')) {
    return 'linear-gradient(135deg, rgba(139, 69, 19, 0.8), rgba(160, 82, 45, 0.8)), url("https://images.pexels.com/photos/3680219/pexels-photo-3680219.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop") center/cover';
  }
  
  // Ancient figures (Greek, Roman, Egyptian)
  if (timePeriod.includes('ancient') || timePeriod.includes('roman') || timePeriod.includes('greek') || timePeriod.includes('egyptian')) {
    return 'linear-gradient(135deg, rgba(101, 67, 33, 0.8), rgba(139, 69, 19, 0.8)), url("https://images.pexels.com/photos/161154/greek-ancient-column-temple-161154.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop") center/cover';
  }
  
  // Medieval figures
  if (timePeriod.includes('medieval') || timePeriod.includes('middle ages') || occupation.includes('king') || occupation.includes('queen')) {
    return 'linear-gradient(135deg, rgba(75, 85, 99, 0.8), rgba(107, 114, 128, 0.8)), url("https://images.pexels.com/photos/208736/pexels-photo-208736.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop") center/cover';
  }
  
  // Renaissance figures
  if (timePeriod.includes('renaissance') || name.includes('leonardo') || name.includes('michelangelo')) {
    return 'linear-gradient(135deg, rgba(120, 53, 15, 0.8), rgba(146, 64, 14, 0.8)), url("https://images.pexels.com/photos/2901209/pexels-photo-2901209.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop") center/cover';
  }
  
  // American Civil War era and American Presidents
  if (timePeriod.includes('civil war') || name.includes('lincoln') || name.includes('washington') || occupation.includes('president')) {
    return 'linear-gradient(135deg, rgba(45, 55, 72, 0.7), rgba(75, 85, 99, 0.7)), url("/abraham-lincoln-statue.webp") center/cover';
  }
  
  // Asian figures
  if (nationality.includes('chinese') || nationality.includes('japanese') || nationality.includes('asian')) {
    return 'linear-gradient(135deg, rgba(127, 29, 29, 0.8), rgba(153, 27, 27, 0.8)), url("https://images.pexels.com/photos/2613260/pexels-photo-2613260.jpeg?auto=compress&cs=tinysrgb&w=1920&h=1080&fit=crop") center/cover';
  }
  
  // Default historical background - Lincoln Memorial
  return 'linear-gradient(135deg, rgba(45, 55, 72, 0.7), rgba(75, 85, 99, 0.7)), url("/abraham-lincoln-statue.webp") center/cover';
};
export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  character,
  apiKey,
  voiceSettings,
  onVoiceSettingsChange,
  onBack,
  onCreateNew,
  onCharacterUpdate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = useState<string | null>(null);
  const [isRegeneratingPhoto, setIsRegeneratingPhoto] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognition = useRef<any>(null);
  const openaiService = useRef(new OpenAIService(apiKey));

  useEffect(() => {
    // Initialize with greeting message
    const greeting: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'character',
      content: `Greetings! I am ${character.name}. I lived during ${character.timePeriod} and was known for ${character.occupation}. I'm here to share my experiences and knowledge with you. What would you like to know about my life or my era?`,
      timestamp: new Date(),
      type: 'text',
    };
    setMessages([greeting]);
  }, [character]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize speech recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognition.current = new SpeechRecognition();
      recognition.current.continuous = false;
      recognition.current.interimResults = false;
      recognition.current.lang = 'en-US';
      
      recognition.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };
      
      recognition.current.onerror = () => {
        setIsListening(false);
      };
      
      recognition.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return;

    // Check if user is requesting an image - improved detection
    const imageKeywords = ['picture', 'image', 'show me', 'generate', 'create', 'draw', 'paint', 'illustration', 'visual', 'depict', 'sketch', 'portrait', 'scene'];
    const isImageRequest = imageKeywords.some(keyword =>
      inputMessage.toLowerCase().includes(keyword)
    );

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: inputMessage.trim(),
      timestamp: new Date(),
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    const messageContent = inputMessage.trim();
    setInputMessage('');
    setIsTyping(true);

    // If it's an image request, use AI to help create contextual prompt
    if (isImageRequest) {
      try {
        // First, get AI to interpret what image should be created based on conversation context
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
        const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

        const imagePromptRequest = `Based on this request: "${messageContent}", and the context that you are ${character.name} from ${character.timePeriod} (${character.occupation}), create a concise, detailed image generation prompt (maximum 100 words) that captures what the user wants to see. Include:
        1. The main subject or scene
        2. Historical accuracy for the time period (${character.timePeriod})
        3. Art style appropriate to the era
        4. Key visual details

        Respond with ONLY the image prompt, no additional text.`;

        const promptResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            apiKey: apiKey,
            tier: 'smart',
            messages: [
              { role: 'system', content: `You are ${character.name}. Create image generation prompts that are historically accurate and contextually appropriate.` },
              { role: 'user', content: imagePromptRequest }
            ],
            temperature: 0.7,
            max_tokens: 150,
          }),
        });

        const promptData = await promptResponse.json();
        const generatedPrompt = promptData.choices[0].message.content.trim();

        // Generate the image with the AI-created prompt
        const imageUrl = await openaiService.current.generateImage(
          generatedPrompt,
          `${character.timePeriod} ${character.name}`
        );

        const imageMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'character',
          content: `I have created this visual for you as requested.`,
          timestamp: new Date(),
          type: 'image',
          imageUrl: imageUrl,
        };

        setMessages(prev => [...prev, imageMessage]);
      } catch (error) {
        console.error('Error generating image:', error);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'character',
          content: 'I apologize, but I cannot create that visual representation at the moment. Please try again later.',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } else {
      // Regular text response
      try {
        const response = await openaiService.current.generateResponse(
          character,
          messages,
          userMessage.content
        );

        const aiMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'character',
          content: response,
          timestamp: new Date(),
          type: 'text',
        };

        setMessages(prev => [...prev, aiMessage]);

        // Generate speech if voice is enabled
        if (voiceSettings.enabled) {
          try {
            const audioBuffer = await openaiService.current.generateSpeech(
              response,
              voiceSettings.voice
            );
            const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audio.play();
            setCurrentAudio(audio);
            setIsPlayingAudio(true);
            
            audio.onended = () => {
              setIsPlayingAudio(false);
              setCurrentAudio(null);
            };
          } catch (error) {
            console.error('Error generating speech:', error);
          }
        }
      } catch (error) {
        console.error('Error generating response:', error);
        const errorMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          sender: 'character',
          content: 'I apologize, but I seem to be having difficulty responding at the moment. Could you please try again?',
          timestamp: new Date(),
          type: 'text',
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    }
    
    setIsTyping(false);
  };

  const startListening = () => {
    if (recognition.current && !isListening) {
      setIsListening(true);
      recognition.current.start();
    }
  };

  const stopListening = () => {
    if (recognition.current && isListening) {
      recognition.current.stop();
      setIsListening(false);
    }
  };

  const toggleAudio = () => {
    if (currentAudio) {
      if (isPlayingAudio) {
        currentAudio.pause();
        setIsPlayingAudio(false);
      } else {
        currentAudio.play();
        setIsPlayingAudio(true);
      }
    }
  };

  const requestImage = async (prompt: string) => {
    const userPrompt = prompt.trim() || `Show me a scene from your life`;

    setIsTyping(true);
    try {
      // Use AI to create contextually appropriate image prompt
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const imagePromptRequest = `Based on this request: "${userPrompt}", and the context that you are ${character.name} from ${character.timePeriod} (${character.occupation}), create a concise, detailed image generation prompt (maximum 100 words) that captures what should be visualized. Include:
      1. The main subject or scene
      2. Historical accuracy for the time period (${character.timePeriod})
      3. Art style appropriate to the era
      4. Key visual details

      Respond with ONLY the image prompt, no additional text.`;

      const promptResponse = await fetch(`${SUPABASE_URL}/functions/v1/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: apiKey,
          tier: 'smart',
          messages: [
            { role: 'system', content: `You are ${character.name}. Create image generation prompts that are historically accurate and contextually appropriate.` },
            { role: 'user', content: imagePromptRequest }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      const promptData = await promptResponse.json();
      const generatedPrompt = promptData.choices[0].message.content.trim();

      const imageUrl = await openaiService.current.generateImage(
        generatedPrompt,
        `${character.timePeriod} ${character.name}`
      );

      setGeneratedImages(prev => [...prev, imageUrl]);

      const imageMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'character',
        content: `I have created this visual for you as requested.`,
        timestamp: new Date(),
        type: 'image',
        imageUrl: imageUrl,
      };

      setMessages(prev => [...prev, imageMessage]);
    } catch (error) {
      console.error('Error generating image:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        sender: 'character',
        content: 'I apologize, but I cannot create that visual representation at the moment. Please try again later.',
        timestamp: new Date(),
        type: 'text',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const previewVoice = async (voiceId: string) => {
    setIsPreviewingVoice(voiceId);
    try {
      const previewText = `Peace be with you. I am ${character.name}, and I speak to you with love and compassion.`;
      const audioBuffer = await openaiService.current.generateSpeech(previewText, voiceId);
      const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        setIsPreviewingVoice(null);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error) {
      console.error('Error previewing voice:', error);
      setIsPreviewingVoice(null);
    }
  };

  const updateVoiceSettings = (newSettings: Partial<VoiceSettings>) => {
    const updatedSettings = { ...voiceSettings, ...newSettings };
    onVoiceSettingsChange(updatedSettings);
  };

  const regeneratePhoto = async () => {
    setIsRegeneratingPhoto(true);
    try {
      const prompt = `A historically accurate portrait photograph of ${character.name}, ${character.occupation} from ${character.timePeriod}. Professional historical portrait, realistic style, ${character.nationality} heritage, period-appropriate attire.`;

      const newPhotoUrl = await openaiService.current.generateImage(
        prompt,
        `${character.timePeriod} ${character.name}`
      );

      const updatedCharacter = {
        ...character,
        customAvatar: newPhotoUrl,
      };

      if (onCharacterUpdate) {
        onCharacterUpdate(updatedCharacter);
      }
    } catch (error) {
      console.error('Error regenerating photo:', error);
      alert('Failed to regenerate photo. Please try again.');
    } finally {
      setIsRegeneratingPhoto(false);
    }
  };

  const exportTranscript = () => {
    const transcript = messages.map(msg => 
      `[${msg.timestamp.toLocaleTimeString()}] ${msg.sender === 'user' ? 'You' : character.name}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `conversation-with-${character.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div 
      className="flex flex-col h-screen relative"
      style={{
        background: getCharacterBackground(character),
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Background overlay for better readability */}
      <div className="absolute inset-0 bg-black bg-opacity-20 pointer-events-none"></div>
      
      {/* Header */}
      <div className="relative z-10 bg-white bg-opacity-95 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex flex-col sm:flex-row gap-2 mr-2 sm:mr-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="text-amber-600 hover:text-amber-700 font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  ← Edit Character
                </button>
              )}
              {onCreateNew && (
                <button
                  onClick={onCreateNew}
                  className="text-amber-600 hover:text-amber-700 font-medium text-sm sm:text-base whitespace-nowrap"
                >
                  {onBack ? 'Create New' : '← Create Your Own'}
                </button>
              )}
            </div>
            <div className="flex items-center">
              <div className="relative mr-3 sm:mr-4">
                <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full shadow-lg overflow-hidden border-2 border-white">
                  {character.customAvatar ? (
                    <img
                      src={character.customAvatar}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg sm:text-xl">
                        {character.name[0]}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={regeneratePhoto}
                  disabled={isRegeneratingPhoto}
                  className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors shadow-md disabled:bg-gray-300 disabled:cursor-not-allowed"
                  title="Regenerate Photo"
                >
                  {isRegeneratingPhoto ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  ) : (
                    <RefreshCw className="h-3 w-3" />
                  )}
                </button>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{character.name}</h1>
                <p className="text-sm sm:text-base text-gray-600 font-medium">
                  {character.occupation} • {character.timePeriod}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setShowShareModal(true)}
              className="p-2 sm:p-3 bg-amber-100 text-amber-600 rounded-lg hover:bg-amber-200 transition-colors shadow-sm"
              title="Share Chatbot"
            >
              <Share2 className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
            <button
              onClick={() => updateVoiceSettings({ enabled: !voiceSettings.enabled })}
              className={`p-2 sm:p-3 rounded-lg transition-colors shadow-sm ${
                voiceSettings.enabled
                  ? 'bg-green-100 text-green-600 hover:bg-green-200'
                  : 'bg-red-100 text-red-600 hover:bg-red-200'
              }`}
              title={voiceSettings.enabled ? 'Disable Voice Responses' : 'Enable Voice Responses'}
            >
              {voiceSettings.enabled ? <Volume1 className="h-5 sm:h-6 w-5 sm:w-6" /> : <VolumeX className="h-5 sm:h-6 w-5 sm:w-6" />}
            </button>
            <button
              onClick={() => setShowVoiceSettings(!showVoiceSettings)}
              className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              title="Voice Settings"
            >
              <Settings className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
            <button
              onClick={toggleAudio}
              className={`p-2 sm:p-3 rounded-lg transition-colors shadow-sm ${
                isPlayingAudio ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              disabled={!currentAudio}
              title={isPlayingAudio ? 'Pause Audio' : 'Play Audio'}
            >
              {isPlayingAudio ? <Volume2 className="h-5 sm:h-6 w-5 sm:w-6" /> : <Play className="h-5 sm:h-6 w-5 sm:w-6" />}
            </button>
            <button
              onClick={exportTranscript}
              className="p-2 sm:p-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors shadow-sm"
              title="Download Transcript"
            >
              <Download className="h-5 sm:h-6 w-5 sm:w-6" />
            </button>
          </div>
        </div>

        {/* Character Portrait in Corner */}
        {character.customAvatar && (
          <div className="fixed bottom-6 right-6 z-20 hidden lg:block">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-2xl bg-white">
                <img
                  src={character.customAvatar}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={regeneratePhoto}
                disabled={isRegeneratingPhoto}
                className="absolute -top-1 -right-1 p-2 bg-amber-500 text-white rounded-full hover:bg-amber-600 transition-colors shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
                title="Regenerate Photo"
              >
                {isRegeneratingPhoto ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-2 text-center">
              <div className="bg-white bg-opacity-90 backdrop-blur-sm px-3 py-1 rounded-full shadow-lg">
                <span className="text-xs font-medium text-gray-800">{character.name}</span>
              </div>
            </div>
          </div>
        )}
        {/* Voice Settings Panel */}
        {showVoiceSettings && (
          <div className="mt-4 p-4 sm:p-6 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg border border-gray-200 shadow-lg">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Voice Settings</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-base font-medium text-gray-700 mb-3">
                  Voice Selection
                </label>
                <div className="space-y-2">
                  {VOICE_OPTIONS.map((voice) => (
                    <div key={voice.value} className="flex items-center justify-between p-3 sm:p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="flex items-center">
                        <input
                          type="radio"
                          id={voice.value}
                          name="voice"
                          value={voice.value}
                          checked={voiceSettings.voice === voice.value}
                          onChange={(e) => updateVoiceSettings({ voice: e.target.value })}
                          className="mr-3 text-amber-600 focus:ring-amber-500"
                        />
                        <label htmlFor={voice.value} className="text-sm sm:text-base font-medium text-gray-900">
                          {voice.label}
                        </label>
                      </div>
                      <button
                        onClick={() => previewVoice(voice.value)}
                        disabled={isPreviewingVoice === voice.value}
                        className="p-2 sm:p-3 text-amber-600 hover:text-amber-700 disabled:text-gray-400 transition-colors"
                        title="Preview Voice"
                      >
                        {isPreviewingVoice === voice.value ? (
                          <div className="animate-spin rounded-full h-4 sm:h-5 w-4 sm:w-5 border-b-2 border-amber-600"></div>
                        ) : (
                          <Play className="h-4 sm:h-5 w-4 sm:w-5" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={voiceSettings.enabled}
                      onChange={(e) => updateVoiceSettings({ enabled: e.target.checked })}
                      className="mr-2 text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-base font-medium text-gray-700">Enable Voice Responses</span>
                  </label>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Speed: {voiceSettings.speed}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => updateVoiceSettings({ speed: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-base font-medium text-gray-700 mb-2">
                      Volume: {Math.round(voiceSettings.volume * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={voiceSettings.volume}
                      onChange={(e) => updateVoiceSettings({ volume: parseFloat(e.target.value) })}
                      className="w-full accent-amber-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.length === 1 && (
          <div className="mb-6">
            <h3 className="text-lg sm:text-xl font-bold text-white mb-4 drop-shadow-lg">Conversation Starters</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CONVERSATION_STARTERS.map((starter, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(starter)}
                  className="text-left p-3 sm:p-4 bg-white bg-opacity-90 backdrop-blur-sm border border-amber-200 rounded-lg hover:bg-amber-50 hover:bg-opacity-95 transition-all duration-200 text-sm sm:text-base font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-sm lg:max-w-lg px-5 py-4 rounded-2xl shadow-lg ${
                message.sender === 'user'
                  ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-amber-200'
                  : 'bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 text-gray-900 shadow-gray-200'
              }`}
            >
              {message.type === 'image' && message.imageUrl && (
                <div className="mb-2">
                  <img
                    src={message.imageUrl}
                    alt="Generated image"
                    className="rounded-xl max-w-full h-auto w-full shadow-lg"
                  />
                </div>
              )}
              <p className="text-sm sm:text-base leading-relaxed break-words font-medium">{message.content}</p>
              <p className={`text-xs mt-2 ${
                message.sender === 'user' ? 'text-amber-100' : 'text-gray-500'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white bg-opacity-95 backdrop-blur-sm border border-gray-200 px-5 py-4 rounded-2xl shadow-lg">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 px-4 sm:px-6 py-4 sm:py-5 shadow-lg">
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={`Chat with ${character.name}...`}
              className="w-full px-4 sm:px-5 py-3 sm:py-4 text-base sm:text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-20 sm:pr-24 font-medium shadow-sm"
              disabled={isTyping}
            />
            <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
              <button
                onClick={() => requestImage(inputMessage || 'Show me a scene from your life and teachings')}
                disabled={isTyping}
                className="p-2 text-gray-400 hover:text-amber-600 transition-colors touch-manipulation rounded-lg hover:bg-gray-100"
                title="Generate image"
              >
                <Image className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isTyping}
                className={`p-2 transition-colors rounded-lg hover:bg-gray-100 ${
                  isListening ? 'text-red-500' : 'text-gray-400 hover:text-amber-600'
                } touch-manipulation`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="h-4 sm:h-5 w-4 sm:w-5" /> : <Mic className="h-4 sm:h-5 w-4 sm:w-5" />}
              </button>
            </div>
          </div>
          
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="bg-gradient-to-br from-amber-500 to-amber-600 text-white p-3 sm:p-4 rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 touch-manipulation shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Send className="h-5 sm:h-6 w-5 sm:w-6" />
          </button>
        </div>
      </div>

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        character={character}
      />
    </div>
  );
};