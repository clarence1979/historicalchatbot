import React, { useState } from 'react';
import { Sparkles, Check, Wand2, ChevronRight } from 'lucide-react';
import { OpenAIService } from '../services/openaiService';
import { PDFProcessingResult } from '../utils/pdfProcessor';

interface FictionalCharacterCreatorProps {
  apiKey: string;
  onCharacterGenerated: (result: PDFProcessingResult, portraitUrl?: string) => void;
  onBack: () => void;
}

const PERSONALITY_TRAITS = [
  { label: 'Brave', emoji: '🦁', description: 'Courageous and fearless' },
  { label: 'Wise', emoji: '🦉', description: 'Knowledgeable and thoughtful' },
  { label: 'Kind', emoji: '❤️', description: 'Compassionate and caring' },
  { label: 'Funny', emoji: '😄', description: 'Humorous and entertaining' },
  { label: 'Mysterious', emoji: '🎭', description: 'Enigmatic and secretive' },
  { label: 'Adventurous', emoji: '🗺️', description: 'Bold and daring' },
  { label: 'Intelligent', emoji: '🧠', description: 'Smart and clever' },
  { label: 'Creative', emoji: '🎨', description: 'Artistic and imaginative' },
  { label: 'Strong', emoji: '💪', description: 'Powerful and resilient' },
  { label: 'Loyal', emoji: '🤝', description: 'Faithful and devoted' },
  { label: 'Curious', emoji: '🔍', description: 'Inquisitive and eager to learn' },
  { label: 'Gentle', emoji: '🕊️', description: 'Mild and tender' }
];

const OCCUPATIONS = [
  { label: 'Explorer', emoji: '🧭', description: 'Discovers new lands' },
  { label: 'Inventor', emoji: '💡', description: 'Creates amazing things' },
  { label: 'Knight', emoji: '⚔️', description: 'Protects the realm' },
  { label: 'Scientist', emoji: '🔬', description: 'Studies the world' },
  { label: 'Artist', emoji: '🎨', description: 'Creates beautiful art' },
  { label: 'Musician', emoji: '🎵', description: 'Makes wonderful music' },
  { label: 'Teacher', emoji: '📚', description: 'Shares knowledge' },
  { label: 'Athlete', emoji: '🏃', description: 'Excels at sports' },
  { label: 'Chef', emoji: '👨‍🍳', description: 'Cooks delicious food' },
  { label: 'Wizard', emoji: '🧙', description: 'Masters magic' },
  { label: 'Detective', emoji: '🔎', description: 'Solves mysteries' },
  { label: 'Pilot', emoji: '✈️', description: 'Flies aircraft' }
];

const SETTINGS = [
  { label: 'Medieval Kingdom', emoji: '🏰', description: 'Castles and dragons' },
  { label: 'Space Station', emoji: '🚀', description: 'Among the stars' },
  { label: 'Magical Forest', emoji: '🌲', description: 'Enchanted woods' },
  { label: 'Modern City', emoji: '🌆', description: 'Urban environment' },
  { label: 'Underwater World', emoji: '🌊', description: 'Beneath the sea' },
  { label: 'Desert Island', emoji: '🏝️', description: 'Tropical paradise' },
  { label: 'Mountain Peak', emoji: '⛰️', description: 'High altitude' },
  { label: 'Ancient Ruins', emoji: '🏛️', description: 'Lost civilization' }
];

const SPECIAL_ABILITIES = [
  { label: 'Super Strength', emoji: '💪', description: 'Incredible power' },
  { label: 'Telepathy', emoji: '🧠', description: 'Read minds' },
  { label: 'Invisibility', emoji: '👻', description: 'Become unseen' },
  { label: 'Flight', emoji: '🦅', description: 'Soar through the air' },
  { label: 'Healing', emoji: '✨', description: 'Cure ailments' },
  { label: 'Time Control', emoji: '⏰', description: 'Manipulate time' },
  { label: 'Elemental Magic', emoji: '🔥', description: 'Control elements' },
  { label: 'Super Speed', emoji: '⚡', description: 'Move incredibly fast' }
];

const APPEARANCE_OPTIONS = [
  { label: 'Young Adult', emoji: '👤', age: '20-30 years old' },
  { label: 'Middle-Aged', emoji: '🧑', age: '40-50 years old' },
  { label: 'Elderly', emoji: '👴', age: '60+ years old' },
  { label: 'Child', emoji: '🧒', age: '8-12 years old' }
];

export const FictionalCharacterCreator: React.FC<FictionalCharacterCreatorProps> = ({
  apiKey,
  onCharacterGenerated,
  onBack
}) => {
  const [characterName, setCharacterName] = useState('');
  const [selectedPersonality, setSelectedPersonality] = useState<string[]>([]);
  const [selectedOccupation, setSelectedOccupation] = useState('');
  const [selectedSetting, setSelectedSetting] = useState('');
  const [selectedAbility, setSelectedAbility] = useState('');
  const [selectedAppearance, setSelectedAppearance] = useState('');
  const [customDetails, setCustomDetails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);

  const togglePersonality = (trait: string) => {
    if (selectedPersonality.includes(trait)) {
      setSelectedPersonality(selectedPersonality.filter(t => t !== trait));
    } else if (selectedPersonality.length < 3) {
      setSelectedPersonality([...selectedPersonality, trait]);
    }
  };

  const canGenerate = characterName.trim().length > 0 &&
                      selectedPersonality.length > 0 &&
                      selectedOccupation &&
                      selectedSetting;

  const generateCharacter = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setGenerationProgress(0);

    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 5;
      });
    }, 200);

    try {
      const openaiService = new OpenAIService(apiKey);

      const personalityDesc = selectedPersonality.join(', ');
      const appearanceObj = APPEARANCE_OPTIONS.find(a => a.label === selectedAppearance);
      const abilityDesc = selectedAbility ? `\n- Special Ability: ${selectedAbility}` : '';
      const customDesc = customDetails.trim() ? `\n\nAdditional Details:\n${customDetails}` : '';

      const prompt = `Create a detailed biographical profile for a fictional character with the following characteristics:

Name: ${characterName}
Personality Traits: ${personalityDesc}
Occupation: ${selectedOccupation}
Setting/World: ${selectedSetting}
Age Appearance: ${appearanceObj?.age || 'Not specified'}${abilityDesc}${customDesc}

Please provide a comprehensive character profile including:
1. Full Background Story (childhood, upbringing, key life events)
2. Personality Description (detailed exploration of their traits and how they manifest)
3. Physical Appearance (detailed description including height, build, distinctive features)
4. Accomplishments and Achievements
5. Goals and Motivations
6. Strengths and Weaknesses
7. Relationships and Social Connections
8. Daily Life and Routines
9. Challenges They've Overcome
10. Philosophy and Worldview

Make the character feel real, three-dimensional, and engaging. Include specific examples and anecdotes that bring them to life.`;

      const response = await openaiService.sendMessage(prompt);

      const characterContent = response.choices[0].message.content;

      const portraitPrompt = `A professional character portrait of ${characterName}, ${appearanceObj?.age || 'adult'}, ${selectedOccupation.toLowerCase()}, ${personalityDesc.toLowerCase()} personality, in a ${selectedSetting.toLowerCase()} setting. High quality, detailed, realistic art style, facing forward, professional character art.`;

      const portraitUrl = await openaiService.generateImage(
        portraitPrompt,
        `Portrait of ${characterName}`
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);

      const result: PDFProcessingResult = {
        text: `Fictional Character: ${characterName}\n\n${characterContent}`,
        numPages: 1,
        title: `Fictional Character: ${characterName}`,
        author: 'AI Character Generator'
      };

      setTimeout(() => {
        onCharacterGenerated(result, portraitUrl);
      }, 500);

    } catch (error) {
      console.error('Character generation error:', error);
      alert('Failed to generate character. Please try again.');
      setIsGenerating(false);
      setGenerationProgress(0);
      clearInterval(progressInterval);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={onBack}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            ← Back to Options
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <div className="bg-purple-100 p-3 rounded-full mr-4">
              <Sparkles className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Create a Fictional Character
              </h2>
              <p className="text-gray-600 mt-1">
                Build your own unique character by selecting options below
              </p>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                1. Character Name *
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="e.g., Captain Nova, Professor Elm, Luna Starlight..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                2. Personality Traits * (Choose up to 3)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {PERSONALITY_TRAITS.map((trait) => (
                  <button
                    key={trait.label}
                    onClick={() => togglePersonality(trait.label)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedPersonality.includes(trait.label)
                        ? 'border-purple-500 bg-purple-50 shadow-md'
                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{trait.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{trait.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{trait.description}</div>
                    {selectedPersonality.includes(trait.label) && (
                      <Check className="h-5 w-5 text-purple-600 mx-auto mt-2" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                3. Occupation *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {OCCUPATIONS.map((occupation) => (
                  <button
                    key={occupation.label}
                    onClick={() => setSelectedOccupation(occupation.label)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedOccupation === occupation.label
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{occupation.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{occupation.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{occupation.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                4. Setting/World *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {SETTINGS.map((setting) => (
                  <button
                    key={setting.label}
                    onClick={() => setSelectedSetting(setting.label)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedSetting === setting.label
                        ? 'border-green-500 bg-green-50 shadow-md'
                        : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{setting.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{setting.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{setting.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                5. Age Appearance (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {APPEARANCE_OPTIONS.map((appearance) => (
                  <button
                    key={appearance.label}
                    onClick={() => setSelectedAppearance(appearance.label)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAppearance === appearance.label
                        ? 'border-amber-500 bg-amber-50 shadow-md'
                        : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{appearance.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{appearance.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{appearance.age}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                6. Special Ability (Optional)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {SPECIAL_ABILITIES.map((ability) => (
                  <button
                    key={ability.label}
                    onClick={() => setSelectedAbility(ability.label)}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedAbility === ability.label
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-3xl mb-2">{ability.emoji}</div>
                    <div className="font-medium text-sm text-gray-900">{ability.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{ability.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-lg font-semibold text-gray-900 mb-3">
                7. Additional Details (Optional)
              </label>
              <textarea
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Add any other details about your character... (e.g., has a pet dragon, loves reading, afraid of heights, etc.)"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-base resize-none"
                disabled={isGenerating}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={generateCharacter}
                disabled={!canGenerate || isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl flex items-center justify-center"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating Your Character...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-6 w-6 mr-3" />
                    Generate Character
                    <ChevronRight className="h-6 w-6 ml-3" />
                  </>
                )}
              </button>

              {isGenerating && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Creating your character...</span>
                    <span className="text-sm text-gray-500">{generationProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${generationProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {!canGenerate && !isGenerating && (
                <p className="mt-3 text-sm text-gray-500 text-center">
                  Please complete all required fields (*) to generate your character
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
