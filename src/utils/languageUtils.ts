import { Language } from '../types';

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', completionRate: 0 },
  { code: 'en', name: 'English', flag: '🇺🇸', completionRate: 0 },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', completionRate: 0 },
  { code: 'fr', name: 'Français', flag: '🇫🇷', completionRate: 0 },
  { code: 'es', name: 'Español', flag: '🇪🇸', completionRate: 0 },
  { code: 'it', name: 'Italiano', flag: '🇮🇹', completionRate: 0 },
  { code: 'pt', name: 'Português', flag: '🇵🇹', completionRate: 0 },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', completionRate: 0 },
  { code: 'ja', name: '日本語', flag: '🇯🇵', completionRate: 0 },
  { code: 'ko', name: '한국어', flag: '🇰🇷', completionRate: 0 },
  { code: 'zh', name: '中文', flag: '🇨🇳', completionRate: 0 },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', completionRate: 0 },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳', completionRate: 0 },
  { code: 'th', name: 'ไทย', flag: '🇹🇭', completionRate: 0 },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳', completionRate: 0 },
  { code: 'pl', name: 'Polski', flag: '🇵🇱', completionRate: 0 },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱', completionRate: 0 },
  { code: 'sv', name: 'Svenska', flag: '🇸🇪', completionRate: 0 },
  { code: 'da', name: 'Dansk', flag: '🇩🇰', completionRate: 0 },
  { code: 'no', name: 'Norsk', flag: '🇳🇴', completionRate: 0 },
  { code: 'fi', name: 'Suomi', flag: '🇫🇮', completionRate: 0 },
  { code: 'cs', name: 'Čeština', flag: '🇨🇿', completionRate: 0 },
  { code: 'sk', name: 'Slovenčina', flag: '🇸🇰', completionRate: 0 },
  { code: 'hu', name: 'Magyar', flag: '🇭🇺', completionRate: 0 },
  { code: 'ro', name: 'Română', flag: '🇷🇴', completionRate: 0 },
  { code: 'bg', name: 'Български', flag: '🇧🇬', completionRate: 0 },
  { code: 'hr', name: 'Hrvatski', flag: '🇭🇷', completionRate: 0 },
  { code: 'sr', name: 'Српски', flag: '🇷🇸', completionRate: 0 },
  { code: 'sl', name: 'Slovenščina', flag: '🇸🇮', completionRate: 0 },
  { code: 'et', name: 'Eesti', flag: '🇪🇪', completionRate: 0 },
  { code: 'lv', name: 'Latviešu', flag: '🇱🇻', completionRate: 0 },
  { code: 'lt', name: 'Lietuvių', flag: '🇱🇹', completionRate: 0 },
  { code: 'el', name: 'Ελληνικά', flag: '🇬🇷', completionRate: 0 },
  { code: 'he', name: 'עברית', flag: '🇮🇱', completionRate: 0 },
  { code: 'fa', name: 'فارسی', flag: '🇮🇷', completionRate: 0 },
  { code: 'ur', name: 'اردو', flag: '🇵🇰', completionRate: 0 },
  { code: 'bn', name: 'বাংলা', flag: '🇧🇩', completionRate: 0 },
  { code: 'ta', name: 'தமிழ்', flag: '🇱🇰', completionRate: 0 },
  { code: 'ml', name: 'മലയാളം', flag: '🇮🇳', completionRate: 0 },
  { code: 'te', name: 'తెలుగు', flag: '🇮🇳', completionRate: 0 }
];

export const detectLanguageFromFilename = (filename: string): string => {
  const langCode = filename.replace('.json', '').toLowerCase();
  const found = SUPPORTED_LANGUAGES.find(lang => lang.code === langCode);
  return found ? langCode : 'en';
};

export const getLanguageByCode = (code: string): Language | undefined => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};