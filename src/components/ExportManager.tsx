import React, { useState } from 'react';
import { Download, Package, File, CheckCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { Language, TranslationKey } from '../types';
import { unflattenObject, downloadJSON } from '../utils/jsonUtils';

interface ExportManagerProps {
  languages: Language[];
  keys: TranslationKey[];
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const ExportManager: React.FC<ExportManagerProps> = ({
  languages,
  keys,
  onSuccess,
  onError
}) => {
  const { t } = useTranslation();
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const handleLanguageToggle = (langCode: string) => {
    setSelectedLanguages(prev =>
      prev.includes(langCode)
        ? prev.filter(code => code !== langCode)
        : [...prev, langCode]
    );
  };

  const selectAllLanguages = () => {
    setSelectedLanguages(languages.map(lang => lang.code));
  };

  const clearSelection = () => {
    setSelectedLanguages([]);
  };

  const generateLanguageData = (languageCode: string): any => {
    const translations: { [key: string]: any } = {};
    
    keys.forEach(key => {
      const translation = key.translations[languageCode];
      if (translation !== undefined && translation !== null && translation !== '') {
        translations[key.key] = translation;
      }
    });

    return unflattenObject(translations);
  };

  const downloadZip = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportSingleLanguage = (languageCode: string) => {
    try {
      const data = generateLanguageData(languageCode);
      const language = languages.find(lang => lang.code === languageCode);
      const filename = `${languageCode}.json`;
      
      downloadJSON(data, filename);
      onSuccess(t('export.languageExported', { language: language?.name || languageCode }));
    } catch (error) {
      onError(t('export.exportError', { language: languageCode }));
    }
  };

  const exportMultipleLanguages = async () => {
    if (selectedLanguages.length === 0) {
      onError(t('export.selectLanguagesError'));
      return;
    }

    setIsExporting(true);

    try {
      // Single file export
      if (selectedLanguages.length === 1) {
        exportSingleLanguage(selectedLanguages[0]);
      } else {
        // Multiple files - create ZIP archive
        const zip = new JSZip();
        
        selectedLanguages.forEach(langCode => {
          const data = generateLanguageData(langCode);
          const jsonString = JSON.stringify(data, null, 2);
          zip.file(`${langCode}.json`, jsonString);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const zipFilename = `translations-${timestamp}.zip`;
        
        downloadZip(zipBlob, zipFilename);
        onSuccess(t('export.multipleExported', { count: selectedLanguages.length }));
      }
    } catch (error) {
      onError(t('export.exportProcessError'));
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllLanguages = async () => {
    if (languages.length === 0) {
      onError(t('export.selectLanguagesError'));
      return;
    }

    setIsExporting(true);

    try {
      if (languages.length === 1) {
        exportSingleLanguage(languages[0].code);
      } else {
        // Create ZIP with all languages
        const zip = new JSZip();
        
        languages.forEach(lang => {
          const data = generateLanguageData(lang.code);
          const jsonString = JSON.stringify(data, null, 2);
          zip.file(`${lang.code}.json`, jsonString);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const zipFilename = `all-translations-${timestamp}.zip`;
        
        downloadZip(zipBlob, zipFilename);
        onSuccess(t('export.allLanguagesExported', { count: languages.length }));
      }
    } catch (error) {
      onError(t('export.exportProcessError'));
    } finally {
      setIsExporting(false);
    }
  };

  const getLanguageStats = (languageCode: string) => {
    let completedTranslations = 0;
    
    keys.forEach(key => {
      const translation = key.translations[languageCode];
      if (translation !== undefined && translation !== null && translation !== '') {
        completedTranslations++;
      }
    });
    
    return {
      completed: completedTranslations,
      total: keys.length,
      percentage: keys.length > 0 ? Math.round((completedTranslations / keys.length) * 100) : 0
    };
  };

  if (languages.length === 0 || keys.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">{t('export.title')}</h2>
        </div>
        
        <div className="text-center py-12 text-gray-400">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('export.noData')}</p>
          <p className="text-sm">{t('export.noDataSubtitle')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Download className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white">{t('export.title')}</h2>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={selectAllLanguages}
            className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            {t('export.selectAll')}
          </button>
          <button
            onClick={clearSelection}
            className="px-3 py-1 text-sm border border-gray-600 text-gray-300 rounded hover:bg-gray-700 transition-colors"
          >
            {t('export.clear')}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={exportAllLanguages}
          disabled={isExporting}
          className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          <Package className="w-5 h-5" />
          <span>{t('export.exportAll')}</span>
        </button>

        <button
          onClick={exportMultipleLanguages}
          disabled={isExporting || selectedLanguages.length === 0}
          className="flex items-center justify-center space-x-3 p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
        >
          <Download className="w-5 h-5" />
          <span>{t('export.exportSelected')} ({selectedLanguages.length})</span>
        </button>
      </div>

      {/* Language Selection */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">{t('export.languageSelection')}</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {languages.map((language) => {
            const stats = getLanguageStats(language.code);
            const isSelected = selectedLanguages.includes(language.code);
            
            return (
              <div
                key={language.code}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-600 hover:border-gray-500'
                }`}
                onClick={() => handleLanguageToggle(language.code)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">{language.flag}</span>
                    <div>
                      <p className="font-medium text-white">{language.name}</p>
                      <p className="text-xs text-gray-400 uppercase">{language.code}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  )}
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>{t('export.completion')}</span>
                    <span>{stats.completed} / {stats.total} ({stats.percentage}%)</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-1">
                    <div
                      className="bg-gradient-to-r from-emerald-400 to-teal-400 h-1 rounded-full transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      exportSingleLanguage(language.code);
                    }}
                    className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors"
                  >
                    <File className="w-3 h-3" />
                    <span>{t('export.singleExport')}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Export Information */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h4 className="font-medium text-white mb-2">{t('export.info')}</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          {t('export.infoList', { returnObjects: true }).map((item: string, index: number) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ExportManager;