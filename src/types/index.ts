export interface Language {
  code: string;
  name: string;
  flag: string;
  completionRate: number;
}

export interface TranslationKey {
  key: string;
  translations: { [languageCode: string]: any };
  type: 'string' | 'number' | 'boolean' | 'object';
}

export interface ProjectData {
  languages: Language[];
  keys: TranslationKey[];
}

export interface TranslationFile {
  filename: string;
  languageCode: string;
  data: { [key: string]: any };
  size: number;
}

export interface Statistics {
  totalKeys: number;
  totalLanguages: number;
  totalTranslations: number;
  averageCompletion: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}