import React, { useState } from 'react';
import { Languages, Zap, Play, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language, TranslationKey } from '../types';
import { TranslationService } from '../utils/translationService';

interface AutoTranslateProps {
  languages: Language[];
  keys: TranslationKey[];
  onBatchTranslationUpdate: (updates: Array<{key: string, languageCode: string, value: any}>) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}
const AutoTranslate: React.FC<AutoTranslateProps> = ({
  languages,
  keys,
  onBatchTranslationUpdate,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [timeTracking, setTimeTracking] = useState({
    startTime: 0,
    elapsedTime: 0,
    estimatedTotal: 0,
    remainingTime: 0
  });
  

  const handleTargetLanguageToggle = (langCode: string) => {
    setTargetLanguages(prev =>
      prev.includes(langCode)
        ? prev.filter(code => code !== langCode)
        : [...prev, langCode]
    );
  };

  const getTranslatableKeys = () => {
    if (!onlyMissing) return keys;
    
    return keys.filter(key => {
      return targetLanguages.some(targetLang => 
        !key.translations[targetLang] ||
        key.translations[targetLang] === '' ||
        key.translations[targetLang] === null ||
        key.translations[targetLang] === undefined
      );
    });
  };

  const handleStartTranslation = async () => {
    if (!sourceLanguage || targetLanguages.length === 0) {
      
      onError(t('autoTranslate.selectLanguagesError'));
      return;
    }

    const translatableKeys = getTranslatableKeys();
    if (translatableKeys.length === 0) {
      onError(t('autoTranslate.noKeysToTranslate'));
      return;
    }

    setIsTranslating(true);
    const totalTranslations = translatableKeys.length * targetLanguages.length;
    let completedCount = 0;
    setProgress({ completed: 0, total: totalTranslations });
    
    const startTime = Date.now();
    setTimeTracking({
      startTime,
      elapsedTime: 0,
      estimatedTotal: 0,
      remainingTime: 0
    });

    // Timer for updating elapsed time
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      
      const currentProgress = completedCount / totalTranslations;
      const estimatedTotal = currentProgress > 0 ? elapsed / currentProgress : 0;
      const remaining = Math.max(0, estimatedTotal - elapsed);
      
      setTimeTracking(prev => ({
        ...prev,
        elapsedTime: elapsed,
        estimatedTotal: Math.floor(estimatedTotal),
        remainingTime: Math.floor(remaining)
      }));
    }, 1000);

    try {
      const translationUpdates: Array<{key: string, languageCode: string, value: any}> = [];
      
      for (const key of translatableKeys) {
        const sourceText = key.translations[sourceLanguage];
        
        if (!sourceText || typeof sourceText !== 'string') {
          completedCount += targetLanguages.length;
          setProgress({ completed: completedCount, total: totalTranslations });
          continue;
        }


        for (const targetLang of targetLanguages) {
          if (onlyMissing && key.translations[targetLang]) {
            completedCount++;
            setProgress({ completed: completedCount, total: totalTranslations });
            continue;
          }
          
          try {
            const translations = await TranslationService.translateMultiple(
              [sourceText],
              TranslationService.normalizeLanguageCode(sourceLanguage),
              TranslationService.normalizeLanguageCode(targetLang),
              (completed, total) => {
                // Progress is handled at the key level
              }
            );
            
            translationUpdates.push({
              key: key.key,
              languageCode: targetLang,
              value: translations[0]
            });
            
            completedCount++;
            setProgress({ completed: completedCount, total: totalTranslations });
          } catch (error) {
            console.error(`Translation error for ${key.key} -> ${targetLang}:`, error);
            completedCount++;
            setProgress({ completed: completedCount, total: totalTranslations });
          }
        }
      }

      console.log('Translation updates to apply:', translationUpdates);
      
      translationUpdates.forEach(update => {
      });
      
      // Apply all updates in a single batch
      console.log('Applying all updates in batch:', translationUpdates);
      onBatchTranslationUpdate(translationUpdates);
      
      onSuccess(t('autoTranslate.translationComplete', { count: translatableKeys.length }));
      setShowModal(false);
    } catch (error) {
      onError(t('autoTranslate.translationError'));
    } finally {
      clearInterval(timer);
      setIsTranslating(false);
      setProgress({ completed: 0, total: 0 });
      setTimeTracking({
        startTime: 0,
        elapsedTime: 0,
        estimatedTotal: 0,
        remainingTime: 0
      });
    }
  };
  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  };

  if (languages.length < 2) {
    return (
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="text-center text-gray-400">
          <Languages className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>{t('autoTranslate.minLanguagesRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <Languages className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">{t('autoTranslate.title')}</h3>
              <p className="text-sm text-gray-400">{t('autoTranslate.description')}</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105"
          >
            <Zap className="w-4 h-4" />
            <span>{t('autoTranslate.startTranslation')}</span>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-2xl">
            <h3 className="text-xl font-semibold text-white mb-6">{t('autoTranslate.settings')}</h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t('autoTranslate.sourceLanguage')}
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.name} ({lang.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    {t('autoTranslate.targetLanguages')}
                  </label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {languages
                      .filter(lang => lang.code !== sourceLanguage)
                      .map((lang) => (
                        <label key={lang.code} className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={targetLanguages.includes(lang.code)}
                            onChange={() => handleTargetLanguageToggle(lang.code)}
                            className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                          />
                          <span className="text-sm text-white">
                            {lang.flag} {lang.name} ({lang.code})
                          </span>
                        </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="onlyMissing"
                  checked={onlyMissing}
                  onChange={(e) => setOnlyMissing(e.target.checked)}
                  className="w-4 h-4 text-purple-500 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 focus:ring-2"
                />
                <label htmlFor="onlyMissing" className="text-sm text-gray-300">
                  {t('autoTranslate.onlyMissing')}
                </label>
              </div>

              {isTranslating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-300">
                    <span>{t('autoTranslate.progress')}</span>
                    <span>{progress.completed} / {progress.total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-400 to-pink-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress.total > 0 ? (progress.completed / progress.total) * 100 : 0}%` }}
                    />
                  </div>
                  
                  {/* Time Tracking */}
                  <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-gray-700 rounded-lg">
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">{t('autoTranslate.elapsedTime')}</div>
                      <div className="text-sm font-mono text-emerald-400">
                        {formatTime(timeTracking.elapsedTime)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-gray-400 mb-1">{t('autoTranslate.remainingTime')}</div>
                      <div className="text-sm font-mono text-orange-400">
                        {timeTracking.remainingTime > 0 ? formatTime(timeTracking.remainingTime) : '--'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Speed Info */}
                  {progress.completed > 0 && (
                    <div className="text-center text-xs text-gray-400 mt-2">
                      {t('autoTranslate.translationSpeed', { 
                        speed: timeTracking.elapsedTime > 0 ? 
                          Math.round((progress.completed / timeTracking.elapsedTime) * 60) : 0 
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  disabled={!isTranslating}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleStartTranslation}
                  disabled={isTranslating || targetLanguages.length === 0}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {isTranslating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t('autoTranslate.translating')}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>{t('autoTranslate.start')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AutoTranslate;