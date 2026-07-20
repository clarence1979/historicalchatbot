export interface HistoricalFigure {
  id: string;
  name: string;
  timePeriod: string;
  occupation: string;
  nationality: string;
  birthYear?: number;
  deathYear?: number;
  avatar?: string;
  customAvatar?: string;
  customBackground?: string;
  biography: string;
  keyEvents: string[];
  personality: string;
  beliefs: string;
  achievements: string[];
  pdfContent?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'character';
  content: string;
  timestamp: Date;
  type: 'text' | 'image';
  imageUrl?: string;
  audioUrl?: string;
}

export interface VoiceSettings {
  enabled: boolean;
  voice: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface AppSettings {
  theme: 'light' | 'dark';
  voice: VoiceSettings;
  apiKey: string;
  autoScroll: boolean;
  showTimestamps: boolean;
  enableNotifications: boolean;
}

export interface ConversationSession {
  id: string;
  characterId: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastActive: Date;
  title: string;
}