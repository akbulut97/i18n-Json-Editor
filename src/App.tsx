import React, { useState, useEffect } from 'react';
import { FileUp, Languages, Key, BarChart3, Download, Save, Plus, Settings, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FileUpload from './components/FileUpload';
import LanguageManager from './components/LanguageManager';
import KeyManager from './components/KeyManager';
import AutoTranslate from './components/AutoTranslate';
import Statistics from './components/Statistics';
import ExportManager from './components/ExportManager';
import ToastContainer from './components/ToastContainer';
import LanguageSelector from './components/LanguageSelector';
import { useToast } from './hooks/useToast';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { Language, TranslationKey, TranslationFile, ProjectData } from './types';
import { getLanguageByCode } from './utils/languageUtils';
import { getValueType } from './utils/jsonUtils';

type Tab = 'upload' | 'languages' | 'keys' | 'translate' | 'stats' | 'export';

function App() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('upload');
  const [projectData, setProjectData] = useLocalStorage<ProjectData>('i18n-project', {
    languages: [],
    keys: []
  });
  const [showClearModal, setShowClearModal] = useState(false);

  const { toasts, success, error, warning, info, removeToast } = useToast();

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'ctrl+s': () => {
      success(t('common.save'), 'LocalStorage kullanılarak verileriniz korunmaktadır');
    },
    'ctrl+n': () => {
      if (activeTab === 'keys') {
        // Focus on add key functionality if we're on keys tab
        success(t('keyManagement.addKey'));
      } else if (activeTab === 'languages') {
        success(t('languageManagement.addLanguage'));
      }
    },
    'escape': () => {
      // This would close any open modals - would be implemented in modal components
    }
  });

  const updateCompletionRates = (languages: Language[], keys: TranslationKey[]) => {
    return languages.map(lang => {
      let completedTranslations = 0;
      
      keys.forEach(key => {
        const translation = key.translations[lang.code];
        if (translation !== undefined && translation !== null && translation !== '') {
          completedTranslations++;
        }
      });
      
      const completionRate = keys.length > 0 ? (completedTranslations / keys.length) * 100 : 0;
      
      return { ...lang, completionRate };
    });
  };

  const handleFilesUploaded = (files: TranslationFile[]) => {
    const newLanguages: Language[] = [];
    const keyMap = new Map<string, { [langCode: string]: any }>();

    // Process each uploaded file
    files.forEach(file => {
      // Add language if not exists
      const existingLang = projectData.languages.find(lang => lang.code === file.languageCode);
      if (!existingLang) {
        const languageInfo = getLanguageByCode(file.languageCode);
        if (languageInfo) {
          newLanguages.push({ ...languageInfo });
        }
      }

      // Process translation keys
      Object.entries(file.data).forEach(([key, value]) => {
        if (!keyMap.has(key)) {
          keyMap.set(key, {});
        }
        keyMap.get(key)![file.languageCode] = value;
      });
    });

    // Merge with existing keys
    const existingKeyMap = new Map<string, { [langCode: string]: any }>();
    projectData.keys.forEach(key => {
      existingKeyMap.set(key.key, { ...key.translations });
    });

    // Combine keys
    const combinedKeys: TranslationKey[] = [];
    const allKeys = new Set([...keyMap.keys(), ...existingKeyMap.keys()]);

    allKeys.forEach(key => {
      const translations = {
        ...existingKeyMap.get(key),
        ...keyMap.get(key)
      };
      
      // Determine the type from the first non-null value
      let type: 'string' | 'number' | 'boolean' | 'object' = 'string';
      for (const value of Object.values(translations)) {
        if (value !== null && value !== undefined && value !== '') {
          type = getValueType(value);
          break;
        }
      }

      combinedKeys.push({
        key,
        translations,
        type
      });
    });

    // Update project data
    const allLanguages = [...projectData.languages, ...newLanguages];
    const updatedLanguages = updateCompletionRates(allLanguages, combinedKeys);

    setProjectData({
      languages: updatedLanguages,
      keys: combinedKeys
    });

    success('Dosyalar başarıyla yüklendi!', `${files.length} dosya, ${keyMap.size} anahtar eklendi`);
    setActiveTab('languages');
  };

  const handleLanguageAdd = (language: Language) => {
    const updatedLanguages = updateCompletionRates([...projectData.languages, language], projectData.keys);
    setProjectData(prev => ({
      ...prev,
      languages: updatedLanguages
    }));
    success('Dil başarıyla eklendi!', `${language.name} dili projeye eklendi`);
  };

  const handleLanguageRemove = (code: string) => {
    const language = projectData.languages.find(lang => lang.code === code);
    
    // Remove translations for this language from all keys
    const updatedKeys = projectData.keys.map(key => ({
      ...key,
      translations: Object.fromEntries(
        Object.entries(key.translations).filter(([langCode]) => langCode !== code)
      )
    }));

    const updatedLanguages = projectData.languages.filter(lang => lang.code !== code);

    setProjectData({
      languages: updateCompletionRates(updatedLanguages, updatedKeys),
      keys: updatedKeys
    });

    warning('Dil silindi!', `${language?.name || code} dili ve tüm çevirileri kaldırıldı`);
  };

  const handleKeyAdd = (key: string) => {
    if (projectData.keys.find(k => k.key === key)) {
      error('Anahtar zaten mevcut!', `"${key}" anahtarı zaten tanımlı`);
      return;
    }

    const newKey: TranslationKey = {
      key,
      translations: {},
      type: 'string'
    };

    const updatedKeys = [...projectData.keys, newKey];
    const updatedLanguages = updateCompletionRates(projectData.languages, updatedKeys);

    setProjectData({
      languages: updatedLanguages,
      keys: updatedKeys
    });

    success('Anahtar eklendi!', `"${key}" anahtarı başarıyla oluşturuldu`);
  };

  const handleKeyRemove = (key: string) => {
    const updatedKeys = projectData.keys.filter(k => k.key !== key);
    const updatedLanguages = updateCompletionRates(projectData.languages, updatedKeys);

    setProjectData({
      languages: updatedLanguages,
      keys: updatedKeys
    });

    warning('Anahtar silindi!', `"${key}" anahtarı ve tüm çevirileri kaldırıldı`);
  };

  const handleKeyEdit = (oldKey: string, newKey: string) => {
    if (oldKey === newKey) return;
    
    if (projectData.keys.find(k => k.key === newKey)) {
      error('Anahtar zaten mevcut!', `"${newKey}" anahtarı zaten tanımlı`);
      return;
    }

    const updatedKeys = projectData.keys.map(key =>
      key.key === oldKey ? { ...key, key: newKey } : key
    );

    setProjectData(prev => ({
      ...prev,
      keys: updatedKeys
    }));

    info('Anahtar güncellendi!', `"${oldKey}" -> "${newKey}"`);
  };

  const handleTranslationUpdate = (key: string, languageCode: string, value: any) => {
    console.log('handleTranslationUpdate called:', { key, languageCode, value });
    
    setProjectData(prevData => {
      // Deep clone to avoid mutation issues
      const updatedKeys = prevData.keys.map(k => {
        if (k.key === key) {
          // Create completely new objects to ensure React detects changes
          const updatedTranslations = { 
            ...k.translations, 
            [languageCode]: value 
          };
          const newType = value !== null && value !== undefined && value !== '' ? getValueType(value) : k.type;
          
          console.log('Updating key:', k.key, 'with translations:', updatedTranslations);
          
          return {
            key: k.key,
            translations: updatedTranslations,
            type: newType
          };
        }
        // Return a new object even for unchanged keys to ensure immutability
        return { ...k };
      });

      const updatedLanguages = updateCompletionRates([...prevData.languages], updatedKeys);
      const newData = {
        languages: updatedLanguages,
        keys: updatedKeys
      };
      
      console.log('Setting new project data with keys:', updatedKeys.length);
      console.log('Updated key data:', updatedKeys.find(k => k.key === key));
      return newData;
    });
  };

  const handleBatchTranslationUpdate = (updates: Array<{key: string, languageCode: string, value: any}>) => {
    console.log('handleBatchTranslationUpdate called with:', updates.length, 'updates');
    
    setProjectData(prevData => {
      // Create a map of all updates for quick lookup
      const updateMap = new Map<string, Map<string, any>>();
      
      updates.forEach(update => {
        if (!updateMap.has(update.key)) {
          updateMap.set(update.key, new Map());
        }
        updateMap.get(update.key)!.set(update.languageCode, update.value);
      });
      
      // Apply all updates to keys
      const updatedKeys = prevData.keys.map(k => {
        const keyUpdates = updateMap.get(k.key);
        if (keyUpdates) {
          const updatedTranslations = { ...k.translations };
          
          // Apply all language updates for this key
          keyUpdates.forEach((value, languageCode) => {
            updatedTranslations[languageCode] = value;
          });
          
          // Determine type from first non-empty value
          let newType = k.type;
          for (const value of Object.values(updatedTranslations)) {
            if (value !== null && value !== undefined && value !== '') {
              newType = getValueType(value);
              break;
            }
          }
          
          console.log('Batch updating key:', k.key, 'with translations:', updatedTranslations);
          
          return {
            key: k.key,
            translations: updatedTranslations,
            type: newType
          };
        }
        return { ...k };
      });

      const updatedLanguages = updateCompletionRates([...prevData.languages], updatedKeys);
      const newData = {
        languages: updatedLanguages,
        keys: updatedKeys
      };
      
      console.log('Setting new project data with', updatedKeys.length, 'keys after batch update');
      return newData;
    });
  };
  const handleClearAllData = () => {
    setProjectData({
      languages: [],
      keys: []
    });
    setShowClearModal(false);
    setActiveTab('upload');
    warning(t('common.dataCleared'), t('common.dataClearedDescription'));
  };

  const tabs = [
    { id: 'upload', label: t('navigation.fileUpload'), icon: FileUp },
    { id: 'languages', label: t('navigation.languageManagement'), icon: Languages },
    { id: 'keys', label: t('navigation.keyManagement'), icon: Key },
    { id: 'translate', label: t('navigation.autoTranslate'), icon: Settings },
    { id: 'stats', label: t('navigation.statistics'), icon: BarChart3 },
    { id: 'export', label: t('navigation.export'), icon: Download }
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-teal-500 rounded-lg">
                <Languages className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{t('app.title')}</h1>
                <p className="text-sm text-gray-400">{t('app.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSelector />
              <div className="text-right">
                <p className="text-sm text-gray-300">
                  {projectData.languages.length} {t('languageManagement.languages')} • {projectData.keys.length} {t('keyManagement.totalKeys').toLowerCase()}
                </p>
                <p className="text-xs text-gray-400">
                  {t('app.autoSaving')}
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <Save className="w-5 h-5 text-emerald-400" />
                {(projectData.languages.length > 0 || projectData.keys.length > 0) && (
                  <button
                    onClick={() => setShowClearModal(true)}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    title={t('common.clearAllData')}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 space-y-2">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow-lg'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Keyboard Shortcuts Info */}
            <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">{t('keyboard.title')}</h3>
              <div className="space-y-1 text-xs text-gray-400">
                <div>Ctrl + S: {t('keyboard.save')}</div>
                <div>Ctrl + N: {t('keyboard.new')}</div>
                <div>Esc: {t('keyboard.close')}</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 shadow-lg">
              {activeTab === 'upload' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">{t('fileUpload.title')}</h2>
                    <p className="text-gray-400">{t('fileUpload.subtitle')}</p>
                  </div>
                  <FileUpload onFilesUploaded={handleFilesUploaded} onError={error} />
                </div>
              )}

              {activeTab === 'languages' && (
                <LanguageManager
                  languages={projectData.languages}
                  onLanguageAdd={handleLanguageAdd}
                  onLanguageRemove={handleLanguageRemove}
                />
              )}

              {activeTab === 'keys' && (
                <KeyManager
                  keys={projectData.keys}
                  languages={projectData.languages}
                  onKeyAdd={handleKeyAdd}
                  onKeyRemove={handleKeyRemove}
                  onKeyEdit={handleKeyEdit}
                  onTranslationUpdate={handleTranslationUpdate}
                  onSuccess={success}
                  onError={error}
                />
              )}

              {activeTab === 'translate' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold text-white mb-2">{t('autoTranslate.title')}</h2>
                    <p className="text-gray-400">{t('autoTranslate.subtitle')}</p>
                  </div>
                  <AutoTranslate
                    languages={projectData.languages}
                    keys={projectData.keys}
                    onBatchTranslationUpdate={handleBatchTranslationUpdate}
                    onSuccess={success}
                    onError={error}
                  />
                </div>
              )}

              {activeTab === 'stats' && (
                <Statistics
                  languages={projectData.languages}
                  keys={projectData.keys}
                />
              )}

              {activeTab === 'export' && (
                <ExportManager
                  languages={projectData.languages}
                  keys={projectData.keys}
                  onSuccess={success}
                  onError={error}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Clear Data Confirmation Modal */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <Trash2 className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{t('common.clearAllData')}</h3>
                <p className="text-sm text-gray-400">{t('common.irreversibleAction')}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300 mb-2">{t('common.clearDataWarning')}</p>
                <ul className="text-xs text-red-400 space-y-1">
                  <li>• {projectData.languages.length} {t('languageManagement.languages').toLowerCase()}</li>
                  <li>• {projectData.keys.length} {t('keyManagement.totalKeys').toLowerCase()}</li>
                  <li>• {t('common.allTranslations')}</li>
                </ul>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowClearModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleClearAllData}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200"
                >
                  {t('common.clearData')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;