import { HistoricalFigure, ChatMessage } from '../types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class OpenAIService {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;

    // Validate that environment variables are loaded
    if (!SUPABASE_URL) {
      console.error('VITE_SUPABASE_URL is not defined in environment variables');
      throw new Error('Supabase configuration is missing. Please check environment variables.');
    }

    if (!SUPABASE_ANON_KEY) {
      console.error('VITE_SUPABASE_ANON_KEY is not defined in environment variables');
      throw new Error('Supabase configuration is missing. Please check environment variables.');
    }

    this.baseUrl = `${SUPABASE_URL}/functions/v1`;
    console.log('OpenAI Service initialized with baseUrl:', this.baseUrl);
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/openai-validate`;
      console.log('Validating API key at:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: this.apiKey }),
      });

      console.log('Validation response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Validation failed with response:', errorText);
        return false;
      }

      const data = await response.json();
      console.log('Validation result:', data);
      return data.valid;
    } catch (error) {
      console.error('API key validation failed:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        baseUrl: this.baseUrl,
        supabaseUrl: SUPABASE_URL
      });
      return false;
    }
  }

  async sendMessage(prompt: string): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          tier: 'smart',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message to AI');
    }
  }

  async generateCharacterProfile(pdfContent: string, basicInfo: Partial<HistoricalFigure>): Promise<Partial<HistoricalFigure>> {
    const prompt = `Based on the following text about ${basicInfo.name}, create a detailed character profile for an AI roleplay system. The profile should be historically accurate and help the AI embody this person authentically.

PDF Content: ${pdfContent.substring(0, 8000)}

Please provide a JSON response with the following structure:
{
  "name": "Full name of the historical figure",
  "birthYear": birth_year_as_number,
  "deathYear": death_year_as_number_or_null,
  "nationality": "Nationality",
  "timePeriod": "Historical period they lived in",
  "occupation": "Primary occupation or role",
  "biography": "A concise 2-3 sentence biography",
  "personality": "Personality traits and characteristics",
  "beliefs": "Core beliefs, values, and worldview",
  "keyEvents": ["array of important life events"],
  "achievements": ["array of major accomplishments"]
}`;

    try {
      const response = await fetch(`${this.baseUrl}/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          tier: 'fast',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        const jsonString = jsonMatch ? jsonMatch[1] : content;
        const parsed = JSON.parse(jsonString);
        return {
          ...basicInfo,
          ...parsed,
        };
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        return basicInfo;
      }
    } catch (error) {
      console.error('Error generating character profile:', error);
      throw new Error('Failed to generate character profile');
    }
  }

  async generateResponse(
    character: HistoricalFigure,
    messages: ChatMessage[],
    userMessage: string
  ): Promise<string> {
    const systemPrompt = `You are ${character.name}, a historical figure from ${character.timePeriod}. 

BACKGROUND:
- Occupation: ${character.occupation}
- Personality: ${character.personality}
- Beliefs: ${character.beliefs}
- Biography: ${character.biography}
- Key Events: ${character.keyEvents?.join(', ')}
- Achievements: ${character.achievements?.join(', ')}

ROLEPLAY INSTRUCTIONS:
1. Respond as ${character.name} would, using first person ("I", "me", "my")
2. Reference your historical knowledge and personal experiences
3. Use language appropriate to your time period, but remain understandable
4. Be historically accurate based on known facts about your life
5. Show your personality traits and beliefs in your responses
6. If asked about events after your death, acknowledge the limitation of your knowledge
7. Be educational and engaging for students learning about history
8. Feel free to ask questions back to engage in meaningful dialogue

KNOWLEDGE BASE:
${character.pdfContent ? `Additional information about you: ${character.pdfContent.substring(0, 4000)}` : ''}

Remember: You are truly embodying this historical figure. Students are talking to you to learn about history through personal conversation.`;

    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.content,
    }));

    try {
      const response = await fetch(`${this.baseUrl}/openai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          tier: 'smart',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: 800,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error('Failed to generate response');
    }
  }

  async generateImage(prompt: string, characterContext?: string): Promise<string> {
    const enhancedPrompt = characterContext 
      ? `Historical illustration in the style of ${characterContext}: ${prompt}`
      : prompt;

    try {
      const response = await fetch(`${this.baseUrl}/openai-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          prompt: enhancedPrompt,
          size: '1024x1024',
          quality: 'standard',
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Image generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data[0].url;
    } catch (error) {
      console.error('Error generating image:', error);
      throw new Error('Failed to generate image');
    }
  }

  async generateSpeech(text: string, voice: string = 'alloy'): Promise<ArrayBuffer> {
    try {
      const response = await fetch(`${this.baseUrl}/openai-speech`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          text,
          voice,
          speed: 1.0,
        }),
      });

      if (!response.ok) {
        throw new Error(`Speech generation failed: ${response.statusText}`);
      }

      return await response.arrayBuffer();
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate speech');
    }
  }
}