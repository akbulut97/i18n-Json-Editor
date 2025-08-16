// Mock Google Translate service
export class TranslationService {
  private static instance: TranslationService;
    private static readonly API_URL = 'https://translate.googleapis.com/translate_a/single';
  
  static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }
  
  
  static async translateText(text: string, fromLang: string, toLang: string): Promise<string> {
    try {
      // Google Translate'in ücretsiz API'sini kullan
      const params = new URLSearchParams({
        client: 'gtx',
        sl: fromLang,
        tl: toLang,
        dt: 't',
        q: text
      });

      const response = await fetch(`${this.API_URL}?${params}`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // Google Translate API'nin döndürdüğü format: [[[translated_text, original_text, null, null, 0]]]
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      throw new Error('Unexpected response format');
    } catch (error) {
      console.error('Translation error:', error);
      throw new Error('Çeviri yapılırken hata oluştu');
    }
  }

  static async translateMultiple(
    texts: string[], 
    fromLang: string, 
    toLang: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<string[]> {
    const results: string[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const translated = await this.translateText(texts[i], fromLang, toLang);
        results.push(translated);
        
        // Progress callback
        onProgress?.(i + 1, texts.length);
        
        // Rate limiting - Google'ın limitlerini aşmamak için
        if (i < texts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Translation failed for text ${i}:`, error);
        results.push(texts[i]); // Hata durumunda orijinal metni koru
      }
    }
    
    return results;
  }

  // Dil kodlarını Google Translate formatına çevir
  static normalizeLanguageCode(code: string): string {
    const mapping: Record<string, string> = {
      'en': 'en',
      'tr': 'tr',
      'es': 'es',
      'fr': 'fr',
      'de': 'de',
      'it': 'it',
      'pt': 'pt',
      'ru': 'ru',
      'ja': 'ja',
      'ko': 'ko',
      'zh': 'zh',
      'ar': 'ar',
      'hi': 'hi',
      'pl': 'pl',
      'nl': 'nl',
      'sv': 'sv',
      'no': 'no',
      'da': 'da',
      'fi': 'fi',
      'cs': 'cs',
      'hu': 'hu',
      'ro': 'ro',
      'bg': 'bg',
      'hr': 'hr',
      'sk': 'sk',
      'sl': 'sl',
      'et': 'et',
      'lv': 'lv',
      'lt': 'lt',
      'uk': 'uk',
      'he': 'iw', // Google uses 'iw' for Hebrew
      'th': 'th',
      'vi': 'vi',
      'id': 'id',
      'ms': 'ms',
      'tl': 'tl',
      'ca': 'ca',
      'eu': 'eu',
      'gl': 'gl'
    };
    
    return mapping[code.toLowerCase()] || code.toLowerCase();
  }
}