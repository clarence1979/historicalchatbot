import React, { useState, useEffect } from 'react';
import { User, Calendar, Briefcase, Globe, Wand2, Save, Image as ImageIcon } from 'lucide-react';
import { HistoricalFigure } from '../types';
import { OpenAIService } from '../services/openaiService';
import { PDFProcessingResult } from '../utils/pdfProcessor';
import { ImageUploader } from './ImageUploader';
import { ImageProcessingResult } from '../utils/imageProcessor';

interface CharacterCreatorProps {
  pdfResult: PDFProcessingResult | null;
  apiKey: string;
  onCharacterCreated: (character: HistoricalFigure) => void;
  onBack: () => void;
}

export const CharacterCreator: React.FC<CharacterCreatorProps> = ({
  pdfResult,
  apiKey,
  onCharacterCreated,
  onBack
}) => {
  const [formData, setFormData] = useState({
    name: '',
    timePeriod: '',
    occupation: '',
    nationality: '',
    birthYear: '',
    deathYear: '',
  });
  
  const [generatedProfile, setGeneratedProfile] = useState<Partial<HistoricalFigure> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  const [customBackground, setCustomBackground] = useState<string | null>(null);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGeneratingBackground, setIsGeneratingBackground] = useState(false);

  // Auto-suggest from PDF metadata
  useEffect(() => {
    if (pdfResult?.extractedBasicInfo) {
      // Auto-fill from AI research
      const info = pdfResult.extractedBasicInfo;
      setFormData(prev => ({
        ...prev,
        name: info.name || prev.name,
        birthYear: info.birthYear || prev.birthYear,
        deathYear: info.deathYear || prev.deathYear,
        nationality: info.nationality || prev.nationality,
        occupation: info.occupation || prev.occupation,
        timePeriod: info.timePeriod || prev.timePeriod,
      }));
    } else if (pdfResult?.title || pdfResult?.author) {
      // Fallback for PDF uploads
      setFormData(prev => ({
        ...prev,
        name: pdfResult.author || prev.name,
      }));
    }
    
    // Set generated portrait if available from AI research
    if (pdfResult?.generatedPortrait) {
      setCustomAvatar(pdfResult.generatedPortrait);
    }
  }, [pdfResult]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateProfile = async () => {
    if (!formData.name) {
      alert('Please provide a character name');
      return;
    }

    setIsGenerating(true);
    try {
      const openaiService = new OpenAIService(apiKey);

      // If we have PDF content, use it. Otherwise, create a basic context from form data
      const contextText = pdfResult?.text || `
        Name: ${formData.name}
        ${formData.occupation ? `Occupation: ${formData.occupation}` : ''}
        ${formData.nationality ? `Nationality: ${formData.nationality}` : ''}
        ${formData.timePeriod ? `Time Period: ${formData.timePeriod}` : ''}
        ${formData.birthYear ? `Birth Year: ${formData.birthYear}` : ''}
        ${formData.deathYear ? `Death Year: ${formData.deathYear}` : ''}
      `.trim();

      const profile = await openaiService.generateCharacterProfile(
        contextText,
        formData
      );
      setGeneratedProfile(profile);
    } catch (error) {
      console.error('Error generating profile:', error);
      alert('Failed to generate character profile. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const createCharacter = async () => {
    if (!generatedProfile || !formData.name) return;

    setIsCreating(true);

    const character: HistoricalFigure = {
      id: `char_${Date.now()}`,
      name: formData.name,
      timePeriod: generatedProfile.timePeriod || formData.timePeriod,
      occupation: generatedProfile.occupation || formData.occupation,
      nationality: formData.nationality,
      birthYear: formData.birthYear ? parseInt(formData.birthYear) : undefined,
      deathYear: formData.deathYear ? parseInt(formData.deathYear) : undefined,
      biography: generatedProfile.biography || '',
      keyEvents: generatedProfile.keyEvents || [],
      personality: generatedProfile.personality || '',
      beliefs: generatedProfile.beliefs || '',
      achievements: generatedProfile.achievements || [],
      pdfContent: pdfResult?.text || '',
      customAvatar: customAvatar || undefined,
      customBackground: customBackground || undefined,
    };

    // Generate a unique ID for the character
    character.id = `char_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    setTimeout(() => {
      onCharacterCreated(character);
      setIsCreating(false);
    }, 1000);
  };

  const handleAvatarProcessed = (result: ImageProcessingResult) => {
    setCustomAvatar(result.dataUrl);
  };

  const handleBackgroundProcessed = (result: ImageProcessingResult) => {
    setCustomBackground(result.dataUrl);
  };

  const removeAvatar = () => {
    setCustomAvatar(null);
  };

  const removeBackground = () => {
    setCustomBackground(null);
  };

  const generateAIAvatar = async () => {
    if (!formData.name) {
      alert('Please enter the character name first');
      return;
    }

    setIsGeneratingAvatar(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      const prompt = `A historically accurate portrait photograph of ${formData.name}${formData.occupation ? `, ${formData.occupation}` : ''}${formData.timePeriod ? ` from ${formData.timePeriod}` : ''}. Professional historical portrait, realistic style${formData.nationality ? `, ${formData.nationality} heritage` : ''}, period-appropriate attire, facing forward, neutral background.`;

      const portraitUrl = await openaiService.generateImage(
        prompt,
        `Historical portrait of ${formData.name}`
      );

      setCustomAvatar(portraitUrl);
    } catch (error) {
      console.error('Error generating avatar:', error);
      alert('Failed to generate AI portrait. Please try again.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const generateAIBackground = async () => {
    if (!formData.name) {
      alert('Please enter the character name first');
      return;
    }

    setIsGeneratingBackground(true);
    try {
      const openaiService = new OpenAIService(apiKey);
      const prompt = `A historically accurate background scene representing the era of ${formData.name}${formData.timePeriod ? ` from ${formData.timePeriod}` : ''}. Historical setting${formData.nationality ? ` in ${formData.nationality} style` : ''}, period-appropriate architecture and environment, cinematic composition, wide angle, no people.`;

      const backgroundUrl = await openaiService.generateImage(
        prompt,
        `Historical background for ${formData.name}`
      );

      setCustomBackground(backgroundUrl);
    } catch (error) {
      console.error('Error generating background:', error);
      alert('Failed to generate AI background. Please try again.');
    } finally {
      setIsGeneratingBackground(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="mb-8">
        <button
          onClick={onBack}
          className="text-amber-600 hover:text-amber-700 font-medium mb-4"
        >
          ← Back to Upload
        </button>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Create Historical Character</h2>
        <p className="text-sm sm:text-base text-gray-600">
          Provide basic information and let AI generate a detailed character profile.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Basic Information Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <User className="h-5 w-5 mr-2 text-amber-600" />
            Basic Information
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., Abraham Lincoln"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 sm:h-4 w-3 sm:w-4 inline mr-1" />
                  Birth Year
                </label>
                <input
                  type="number"
                  name="birthYear"
                  value={formData.birthYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="1809"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Death Year
                </label>
                <input
                  type="number"
                  name="deathYear"
                  value={formData.deathYear}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="1865"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="h-3 sm:h-4 w-3 sm:w-4 inline mr-1" />
                Occupation/Role
              </label>
              <input
                type="text"
                name="occupation"
                value={formData.occupation}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., 16th President of the United States"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Globe className="h-3 sm:h-4 w-3 sm:w-4 inline mr-1" />
                Nationality
              </label>
              <input
                type="text"
                name="nationality"
                value={formData.nationality}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., American"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <input
                type="text"
                name="timePeriod"
                value={formData.timePeriod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="e.g., American Civil War era"
              />
            </div>

            <button
              onClick={generateProfile}
              disabled={!formData.name || isGenerating}
              className="w-full bg-amber-600 text-white py-2 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              title={!formData.name ? "Please enter a character name first" : "Generate detailed AI profile"}
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Generating Profile...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate AI Profile
                </>
              )}
            </button>
            {!formData.name && (
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter a character name to generate their profile
              </p>
            )}
          </div>
        </div>

        {/* Image Uploads */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <ImageIcon className="h-5 w-5 mr-2 text-purple-600" />
            Character Images
          </h3>
          
          <div className="space-y-6">
            <ImageUploader
              label="Character Portrait"
              description="Upload a portrait image of the historical figure or generate one with AI. This will appear in the chat interface."
              onImageProcessed={handleAvatarProcessed}
              currentImage={customAvatar || undefined}
              onImageRemoved={removeAvatar}
              maxWidth={400}
              quality={0.9}
              aspectRatio="square"
              allowAIGeneration={true}
              onAIGenerate={generateAIAvatar}
              isGenerating={isGeneratingAvatar}
            />

            <ImageUploader
              label="Chat Background"
              description="Upload a background image that represents the character's era or environment, or generate one with AI. This will be used as the chat background."
              onImageProcessed={handleBackgroundProcessed}
              currentImage={customBackground || undefined}
              onImageRemoved={removeBackground}
              maxWidth={1200}
              quality={0.8}
              aspectRatio="16:9"
              allowAIGeneration={true}
              onAIGenerate={generateAIBackground}
              isGenerating={isGeneratingBackground}
            />
          </div>
        </div>
        {/* Generated Profile */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
            AI-Generated Profile
          </h3>
          
          {!generatedProfile ? (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <Wand2 className="h-10 sm:h-12 w-10 sm:w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-sm sm:text-base px-4">Fill in the basic information and click "Generate AI Profile" to create a detailed character profile.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Biography</h4>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  {generatedProfile.biography}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Personality</h4>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  {generatedProfile.personality}
                </p>
              </div>
              
              <div>
                <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Core Beliefs</h4>
                <p className="text-gray-700 text-xs sm:text-sm leading-relaxed">
                  {generatedProfile.beliefs}
                </p>
              </div>
              
              {generatedProfile.keyEvents && generatedProfile.keyEvents.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Key Life Events</h4>
                  <ul className="list-disc list-inside text-gray-700 text-xs sm:text-sm space-y-1">
                    {generatedProfile.keyEvents.map((event, index) => (
                      <li key={index}>{event}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {generatedProfile.achievements && generatedProfile.achievements.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Major Achievements</h4>
                  <ul className="list-disc list-inside text-gray-700 text-xs sm:text-sm space-y-1">
                    {generatedProfile.achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <button
                onClick={createCharacter}
                disabled={isCreating}
                className="w-full bg-green-600 text-white py-3 sm:py-4 px-4 rounded-lg text-sm sm:text-base font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center mt-6"
              >
                {isCreating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Character...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Character
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};