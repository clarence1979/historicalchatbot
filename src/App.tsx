import React, { useState } from 'react';
import { Sparkles, BookOpen, Brain, Shield, Info } from 'lucide-react';
import { PDFUploader } from './components/PDFUploader';
import { CharacterCreator } from './components/CharacterCreator';
import { ChatInterface } from './components/ChatInterface';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { FictionalCharacterCreator } from './components/FictionalCharacterCreator';
import { LoginScreen } from './components/LoginScreen';
import { AuthHeader } from './components/AuthHeader';
import { SharedChatView } from './components/SharedChatView';
import { useAuth } from './contexts/AuthContext';
import { HistoricalFigure, VoiceSettings, AppSettings } from './types';
import { PDFProcessingResult } from './utils/pdfProcessor';

// Detect share link before any auth checks
const shareSlug = new URLSearchParams(window.location.search).get('share');

type AppStep = 'welcome' | 'choice' | 'upload' | 'fictional' | 'character' | 'chat';

function App() {
  const { user, isAuthenticated, isLoading, login } = useAuth();

  // Public share links bypass the entire auth flow
  if (shareSlug) {
    return <SharedChatView shareSlug={shareSlug} />;
  }
  const [currentStep, setCurrentStep] = useState<AppStep>('welcome');
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [pdfResult, setPdfResult] = useState<PDFProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentCharacter, setCurrentCharacter] = useState<HistoricalFigure | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    theme: 'light',
    voice: {
      enabled: true,
      voice: 'alloy',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
    },
    apiKey: '',
    autoScroll: true,
    showTimestamps: true,
    enableNotifications: true,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} />;
  }

  const apiKey = user?.openaiApiKey || '';

  const handleStartJourney = () => {
    setCurrentStep('choice');
  };

  const handleFictionalCharacterGenerated = (result: PDFProcessingResult, portraitUrl?: string) => {
    setPdfResult({
      ...result,
      generatedPortrait: portraitUrl
    });
    setCurrentStep('character');
  };

  const handleFileProcessed = (result: PDFProcessingResult) => {
    setPdfResult(result);
    setCurrentStep('character');
  };

  const handleCharacterCreated = (character: HistoricalFigure) => {
    setCurrentCharacter(character);
    setCurrentStep('chat');
  };

  const handleVoiceSettingsChange = (voiceSettings: VoiceSettings) => {
    setSettings(prev => ({ ...prev, voice: voiceSettings }));
  };

  const handleCharacterUpdate = (updatedCharacter: HistoricalFigure) => {
    setCurrentCharacter(updatedCharacter);
  };

  const handleBackToCharacterCreator = () => {
    setCurrentStep('character');
    setCurrentCharacter(null);
  };

  const resetToWelcome = () => {
    setCurrentStep('welcome');
    setPdfResult(null);
    setCurrentCharacter(null);
    setIsProcessing(false);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return (
          <>
            <AuthHeader />
            <DisclaimerBanner />
            <div className="min-h-screen relative flex items-center justify-center">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(https://images.pexels.com/photos/262780/pexels-photo-262780.jpeg?auto=compress&cs=tinysrgb&w=1920)',
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              </div>

              <div className="relative z-10 max-w-4xl mx-auto px-6 py-12 text-center">
                <div className="mb-8">
                  <div className="flex justify-center mb-6">
                    <a
                      href="https://digitalvector.com.au"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition-transform hover:scale-105 duration-200"
                    >
                      <img
                        src="/digivec_logo_white.png"
                        alt="Digital Vector Logo"
                        className="h-16 w-auto drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
                      />
                    </a>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
                    Historical Figures
                    <span className="block text-amber-300">AI Chat</span>
                  </h1>
                  <p className="text-lg sm:text-xl text-gray-100 mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow-md px-4">
                    Upload documents about historical figures and engage in realistic conversations with AI representations of history's greatest minds. Experience the past through immersive dialogue.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12 px-4">
                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white border-opacity-30">
                    <div className="bg-blue-100 bg-opacity-80 p-3 rounded-full w-fit mx-auto mb-4">
                      <Brain className="h-8 w-8 text-blue-700" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">AI-Powered Conversations</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Chat with historically accurate AI representations using advanced language models
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white border-opacity-30">
                    <div className="bg-purple-100 bg-opacity-80 p-3 rounded-full w-fit mx-auto mb-4">
                      <Sparkles className="h-8 w-8 text-purple-700" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Voice & Images</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Hear their voices and generate historical images to enhance your learning experience
                    </p>
                  </div>

                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-6 shadow-lg border border-white border-opacity-30">
                    <div className="bg-green-100 bg-opacity-80 p-3 rounded-full w-fit mx-auto mb-4">
                      <BookOpen className="h-8 w-8 text-green-700" />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">Educational Focus</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Learn history through personal stories, experiences, and authentic perspectives
                    </p>
                  </div>
                </div>

                <div className="space-y-4 px-4">
                  <button
                    onClick={handleStartJourney}
                    className="bg-amber-600 bg-opacity-90 backdrop-blur-sm text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg text-base sm:text-lg font-semibold hover:bg-amber-700 hover:bg-opacity-95 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 duration-200 border border-amber-500 border-opacity-50 w-full sm:w-auto"
                  >
                    Start Your Historical Journey
                  </button>

                  <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-200">
                    <button
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="flex items-center hover:text-amber-300 transition-colors drop-shadow-sm relative"
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </button>
                  </div>
                </div>

                <div className="mt-6 text-xs text-gray-300 max-w-2xl mx-auto drop-shadow-sm px-4">
                  <p className="mb-2">
                    <Info className="h-3 w-3 inline mr-1" />
                    Compliant with Australian Privacy Act 1988 and suitable for educational institutions.
                  </p>
                  <p>
                    By using this application, you acknowledge that you have read and understood our{' '}
                    <button
                      onClick={() => setShowPrivacyPolicy(true)}
                      className="underline hover:text-amber-300 transition-colors"
                    >
                      Privacy Policy and Terms of Use
                    </button>
                    .
                  </p>
                </div>

                <div className="mt-12 pt-8 border-t border-white border-opacity-20 px-4">
                  <div className="flex flex-col md:flex-row items-center justify-between space-y-6 md:space-y-0">
                    <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <span className="text-white text-sm font-medium drop-shadow-sm">
                        Proudly Made By:
                      </span>
                      <a
                        href="https://digitalvector.com.au"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="transition-transform hover:scale-105 duration-200"
                      >
                        <img
                          src="/digivec_logo_white.png"
                          alt="Digital Vector"
                          className="h-10 sm:h-12 w-auto drop-shadow-lg hover:drop-shadow-xl transition-all duration-200"
                        />
                      </a>
                    </div>

                    <div className="flex items-center">
                      <form action="https://www.paypal.com/donate" method="post" target="_top">
                        <input type="hidden" name="hosted_button_id" value="PSXE6LDM3ZJDC" />
                        <input
                          type="image"
                          src="https://www.paypalobjects.com/en_AU/i/btn/btn_donateCC_LG.gif"
                          border="0"
                          name="submit"
                          title="PayPal - The safer, easier way to pay online!"
                          alt="Donate with PayPal button"
                          className="hover:scale-105 transition-transform duration-200 drop-shadow-lg hover:drop-shadow-xl"
                        />
                        <img alt="" border="0" src="https://www.paypal.com/en_AU/i/scr/pixel.gif" width="1" height="1" />
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'choice':
        return (
          <>
            <AuthHeader />
            <DisclaimerBanner />
            <div className="min-h-screen relative py-12">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(https://images.pexels.com/photos/3566187/pexels-photo-3566187.jpeg?auto=compress&cs=tinysrgb&w=1920)',
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-60"></div>
              </div>

              <div className="relative z-10 max-w-5xl mx-auto px-4">
                <div className="text-center mb-8">
                  <button
                    onClick={resetToWelcome}
                    className="text-amber-300 hover:text-amber-200 font-medium mb-4 drop-shadow-lg"
                  >
                    ← Back to Home
                  </button>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 drop-shadow-lg">
                    Choose Your Path
                  </h2>
                  <p className="text-lg text-gray-100 drop-shadow-md">
                    Would you like to create a historical or fictional character?
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setCurrentStep('upload')}
                    className="group bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-amber-100 p-4 rounded-full mr-4">
                        <BookOpen className="h-10 w-10 text-amber-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Historical Figure</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Upload documents, research real historical figures, or manually enter information about people from history.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        AI-powered research
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Upload PDFs or images
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Extract from websites
                      </li>
                    </ul>
                  </button>

                  <button
                    onClick={() => setCurrentStep('fictional')}
                    className="group bg-white bg-opacity-95 backdrop-blur-sm rounded-xl p-8 shadow-xl hover:shadow-2xl transition-all hover:scale-105 text-left"
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-purple-100 p-4 rounded-full mr-4">
                        <Sparkles className="h-10 w-10 text-purple-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900">Fictional Character</h3>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Create your own unique character with guided options. Perfect for students who need help bringing their imagination to life.
                    </p>
                    <ul className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        Easy visual selection
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        No writing required
                      </li>
                      <li className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        AI generates the story
                      </li>
                    </ul>
                  </button>
                </div>
              </div>
            </div>
          </>
        );

      case 'fictional':
        return (
          <>
            <AuthHeader />
            <FictionalCharacterCreator
              apiKey={apiKey}
              onCharacterGenerated={handleFictionalCharacterGenerated}
              onBack={() => setCurrentStep('choice')}
            />
          </>
        );

      case 'upload':
        return (
          <>
            <AuthHeader />
            <DisclaimerBanner />
            <div className="min-h-screen relative py-6 sm:py-12">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                  backgroundImage: 'url(https://images.pexels.com/photos/3566187/pexels-photo-3566187.jpeg?auto=compress&cs=tinysrgb&w=1920)',
                }}
              >
                <div className="absolute inset-0 bg-black bg-opacity-60"></div>
              </div>

              <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6">
                <div className="text-center mb-8 sm:mb-12">
                  <button
                    onClick={() => setCurrentStep('choice')}
                    className="text-amber-300 hover:text-amber-200 font-medium mb-4 drop-shadow-lg"
                  >
                    ← Back to Options
                  </button>
                </div>

                <PDFUploader
                  onFileProcessed={handleFileProcessed}
                  isProcessing={isProcessing}
                  setIsProcessing={setIsProcessing}
                  apiKey={apiKey}
                />
              </div>
            </div>
          </>
        );

      case 'character':
        return (
          <>
            <AuthHeader />
            <DisclaimerBanner />
            <div className="min-h-screen bg-gray-50 px-4 sm:px-0">
              <CharacterCreator
                pdfResult={pdfResult}
                apiKey={apiKey}
                onCharacterCreated={handleCharacterCreated}
                onBack={() => setCurrentStep('choice')}
              />
            </div>
          </>
        );

      case 'chat':
        return currentCharacter ? (
          <>
            <AuthHeader />
            <ChatInterface
              character={currentCharacter}
              apiKey={apiKey}
              voiceSettings={settings.voice}
              onVoiceSettingsChange={handleVoiceSettingsChange}
              onBack={handleBackToCharacterCreator}
              onCreateNew={resetToWelcome}
              onCharacterUpdate={handleCharacterUpdate}
            />
          </>
        ) : null;

      default:
        return null;
    }
  };

  return (
    <>
      {renderCurrentStep()}

      <PrivacyPolicy
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
      />
    </>
  );
}

export default App;
