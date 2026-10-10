import type { Phrase } from './types';

/**
 * The original 20 languages from love.py, in the exact order of PHRASES.
 * Add new expressions here — the layout engine picks them up automatically.
 */
export const PHRASES: Phrase[] = [
  { id: 'en', language: 'English', native: 'English', text: 'I love you' },
  { id: 'tr', language: 'Turkish', native: 'Türkçe', text: 'Seni seviyorum' },
  { id: 'es', language: 'Spanish', native: 'Español', text: 'Te amo' },
  { id: 'fr', language: 'French', native: 'Français', text: "Je t'aime" },
  { id: 'de', language: 'German', native: 'Deutsch', text: 'Ich liebe dich' },
  { id: 'it', language: 'Italian', native: 'Italiano', text: 'Ti amo' },
  { id: 'pt', language: 'Portuguese', native: 'Português', text: 'Eu te amo' },
  { id: 'ru', language: 'Russian', native: 'Русский', text: 'Я тебя люблю' },
  { id: 'ko', language: 'Korean', native: '한국어', text: '사랑해' },
  { id: 'ja', language: 'Japanese', native: '日本語', text: '愛してる' },
  { id: 'zh', language: 'Chinese', native: '中文', text: '我爱你' },
  { id: 'hi', language: 'Hindi', native: 'हिन्दी', text: 'मैं तुमसे प्यार करता हूँ' },
  { id: 'el', language: 'Greek', native: 'Ελληνικά', text: "Σ' αγαπώ" },
  { id: 'nl', language: 'Dutch', native: 'Nederlands', text: 'Ik hou van jou' },
  { id: 'sv', language: 'Swedish', native: 'Svenska', text: 'Jag älskar dig' },
  { id: 'pl', language: 'Polish', native: 'Polski', text: 'Kocham cię' },
  { id: 'th', language: 'Thai', native: 'ไทย', text: 'ฉันรักเธอ' },
  { id: 'vi', language: 'Vietnamese', native: 'Tiếng Việt', text: 'Anh yêu em' },
  { id: 'id', language: 'Indonesian', native: 'Bahasa', text: 'Aku cinta kamu' },
  { id: 'uk', language: 'Ukrainian', native: 'Українська', text: 'Я тебе кохаю' },
];

export const ALL_PHRASE_IDS = PHRASES.map((p) => p.id);

export const MAX_CUSTOM_PHRASES = 12;
export const MAX_PHRASE_LENGTH = 40;
