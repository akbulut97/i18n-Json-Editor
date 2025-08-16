import React, { useState, useMemo } from 'react';
import { Plus, Search, Key, Edit3, Trash2, Languages, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { TranslationKey, Language } from '../types';
import { getValueType } from '../utils/jsonUtils';
import { TranslationService } from '../utils/translationService';

interface KeyManagerProps {
  keys: TranslationKey[];
  languages: Language[];
  onKeyAdd: (key: string) => void;
  onKeyRemove: (key: string) => void;
  onKeyEdit: (oldKey: string, newKey: string) => void;
  onTranslationUpdate: (key: string, languageCode: string, value: any) => void;
  onSuccess?: (message: string) => void;
  onError?: (message: string) => void;
}

const KeyManager: React.FC<KeyManagerProps> = ({
  keys,
  languages,
  onKeyAdd,
  onKeyRemove,
  onKeyEdit,
  onTranslationUpdate
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingKeyName, setEditingKeyName] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [sourceLanguage, setSourceLanguage] = useState('en');

  const filteredKeys = useMemo(() => {
    return keys.filter(key =>
      key.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [keys, searchTerm]);

  const selectedKeyData = useMemo(() => {
    return keys.find(key => key.key === selectedKey);
  }, [keys, selectedKey]);

  const handleAddKey = () => {
    if (newKeyName.trim()) {
      onKeyAdd(newKeyName.trim());
      setNewKeyName('');
      setShowAddModal(false);
      setSelectedKey(newKeyName.trim());
    }
  };

  const handleEditKey = (key: string) => {
    setEditingKey(key);
    setEditingKeyName(key);
  };

  const handleSaveEdit = () => {
    if (editingKey && editingKeyName.trim() && editingKeyName !== editingKey) {
      onKeyEdit(editingKey, editingKeyName.trim());
      if (selectedKey === editingKey) {
        setSelectedKey(editingKeyName.trim());
      }
    }
    setEditingKey(null);
    setEditingKeyName('');
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingKeyName('');
  };

  const getMissingTranslations = (translationKey: TranslationKey) => {
    return languages.filter(lang => 
      !translationKey.translations.hasOwnProperty(lang.code) ||
      translationKey.translations[lang.code] === '' ||
      translationKey.translations[lang.code] === null ||
      translationKey.translations[lang.code] === undefined
    );
  };

  const getCompletedTranslations = (translationKey: TranslationKey) => {
    return languages.filter(lang => 
      translationKey.translations.hasOwnProperty(lang.code) &&
      translationKey.translations[lang.code] !== '' &&
      translationKey.translations[lang.code] !== null &&
      translationKey.translations[lang.code] !== undefined
    );
  };

  const handleTranslationChange = (key: string, languageCode: string, value: string) => {
    let parsedValue: any = value;
    
    if (value === 'true') parsedValue = true;
    else if (value === 'false') parsedValue = false;
    else if (!isNaN(Number(value)) && value.trim() !== '') parsedValue = Number(value);
    
    onTranslationUpdate(key, languageCode, parsedValue);
  };

  const handleAutoTranslateKey = async () => {
    if (!selectedKeyData || languages.length < 2) return;
    
    const sourceText = selectedKeyData.translations[sourceLanguage];
    if (!sourceText || typeof sourceText !== 'string') {
      onError?.(t('autoTranslate.noSourceText'));
      return;
    }

    setIsTranslating(true);
    
    try {
      const targetLanguages = languages
        .filter(lang => lang.code !== sourceLanguage)
        .filter(lang => 
          !selectedKeyData.translations[lang.code] ||
          selectedKeyData.translations[lang.code] === '' ||
          selectedKeyData.translations[lang.code] === null ||
          selectedKeyData.translations[lang.code] === undefined
        );

      if (targetLanguages.length === 0) {
        onError?.(t('autoTranslate.noMissingTranslations'));
        setIsTranslating(false);
        return;
      }

      for (const targetLang of targetLanguages) {
        try {
          const translations = await TranslationService.translateMultiple(
            [sourceText],
            TranslationService.normalizeLanguageCode(sourceLanguage),
            TranslationService.normalizeLanguageCode(targetLang.code)
          );
          
          onTranslationUpdate(selectedKeyData.key, targetLang.code, translations[0]);
          
          // Small delay to avoid rate limiting
          if (targetLanguages.length > 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (error) {
          console.error(`Translation error for ${targetLang.code}:`, error);
        }
      }
      
      onSuccess?.(t('autoTranslate.keyTranslated', { 
        key: selectedKeyData.key, 
        count: targetLanguages.length 
      }));
    } catch (error) {
      onError?.(t('autoTranslate.translationError'));
    } finally {
      setIsTranslating(false);
    }
  };

  const getKeyStats = () => {
    const totalKeys = keys.length;
    const completedTranslations = keys.reduce((total, key) => {
      return total + getCompletedTranslations(key).length;
    }, 0);
    const totalPossibleTranslations = totalKeys * languages.length;
    const missingTranslations = totalPossibleTranslations - completedTranslations;

    return {
      totalKeys,
      completedTranslations,
      missingTranslations
    };
  };

  const stats = getKeyStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-semibold text-white">{t('keyManagement.title')}</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={t('keyManagement.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent min-w-[200px]"
            />
          </div>
          
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>{t('keyManagement.addKey')}</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.totalKeys}</div>
          <div className="text-sm text-gray-400">{t('keyManagement.totalKeys')}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.completedTranslations}</div>
          <div className="text-sm text-gray-400">{t('keyManagement.completed')}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 text-center">
          <div className="text-2xl font-bold text-orange-400">{stats.missingTranslations}</div>
          <div className="text-sm text-gray-400">{t('keyManagement.missing')}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Key List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-orange-400" />
              <h3 className="font-semibold text-white">{t('keyManagement.keyList')}</h3>
              <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
                {filteredKeys.length}
              </span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filteredKeys.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <Key className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">
                  {searchTerm ? t('keyManagement.noSearchResults') : t('keyManagement.noKeys')}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-center mt-2">{t('keyManagement.noKeysSubtitle')}</p>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {filteredKeys.map((translationKey) => {
                  const missingTranslations = getMissingTranslations(translationKey);
                  const completedTranslations = getCompletedTranslations(translationKey);
                  const isSelected = selectedKey === translationKey.key;
                  const completionRate = languages.length > 0 ? (completedTranslations.length / languages.length) * 100 : 0;
                  
                  return (
                    <div
                      key={translationKey.key}
                      className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-orange-500/20 border border-orange-500/50' 
                          : 'hover:bg-gray-700 border border-transparent'
                      }`}
                      onClick={() => setSelectedKey(translationKey.key)}
                    >
                      {editingKey === translationKey.key ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingKeyName}
                            onChange={(e) => setEditingKeyName(e.target.value)}
                            className="flex-1 p-2 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && handleSaveEdit()}
                            autoFocus
                          />
                          <button
                            onClick={handleSaveEdit}
                            className="px-2 py-1 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors text-xs"
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors text-xs"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <span className="font-mono text-sm text-white truncate">
                                {translationKey.key}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                                translationKey.type === 'string' ? 'bg-blue-500/20 text-blue-300' :
                                translationKey.type === 'number' ? 'bg-emerald-500/20 text-emerald-300' :
                                translationKey.type === 'boolean' ? 'bg-purple-500/20 text-purple-300' :
                                'bg-orange-500/20 text-orange-300'
                              }`}>
                                {translationKey.type}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditKey(translationKey.key);
                                }}
                                className="p-1 text-gray-400 hover:text-blue-400 transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onKeyRemove(translationKey.key);
                                  if (selectedKey === translationKey.key) {
                                    setSelectedKey(null);
                                  }
                                }}
                                className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {completionRate === 100 ? (
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <AlertCircle className="w-4 h-4 text-orange-400" />
                              )}
                              <span className="text-xs text-gray-400">
                                {completedTranslations.length}/{languages.length} {t('keyManagement.languages')}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <div className="w-16 bg-gray-700 rounded-full h-1">
                                <div
                                  className="bg-gradient-to-r from-orange-400 to-red-400 h-1 rounded-full transition-all duration-500"
                                  style={{ width: `${completionRate}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-8 text-right">
                                {Math.round(completionRate)}%
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Translation Editor */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 flex flex-col h-[600px]">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Languages className="w-4 h-4 text-teal-400" />
                <h3 className="font-semibold text-white">{selectedKeyData ? selectedKeyData.key : t('keyManagement.translationEditor')} </h3>
              </div>
              
              
              {selectedKeyData && (
                <div className=" space-x-2 space-y-2">
                  <span className="text-xs text-gray-400">{t('keyManagement.sourceLanguage')}</span>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-xs focus:ring-1 focus:ring-purple-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.flag} {lang.code.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <button 
                    onClick={handleAutoTranslateKey}
                    disabled={isTranslating || languages.length < 2}
                    className="flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-sm"
                  >
                    {isTranslating ? (
                      <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Zap className="w-3 h-3" />
                    )}
                    <span>{isTranslating ? t('autoTranslate.translating') : t('keyManagement.autoTranslate')}</span>
                  </button>
                </div>
              )}
            </div>
            {selectedKeyData && (
              <div className="mt-2">
                <code className="text-sm text-orange-300 bg-gray-700 px-2 py-1 rounded">
                  {selectedKeyData.key}
                </code>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {!selectedKeyData ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <Languages className="w-12 h-12 mb-4 opacity-50" />
                <p className="text-center">{t('keyManagement.selectKey')}</p>
                <p className="text-sm text-center mt-2 text-gray-500">
                  {t('keyManagement.selectKeySubtitle')}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {languages.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <p>{t('keyManagement.addLanguagesFirst')}</p>
                  </div>
                ) : (
                  languages.map((language) => {
                    const hasTranslation = selectedKeyData.translations[language.code] !== undefined &&
                                         selectedKeyData.translations[language.code] !== null &&
                                         selectedKeyData.translations[language.code] !== '';
                    
                    return (
                      <div key={language.code} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="text-xl">{language.flag}</span>
                            <div>
                              <span className="text-sm font-medium text-white">{language.name}</span>
                              <span className="text-xs text-gray-400 ml-2 uppercase">({language.code})</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {hasTranslation ? (
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-orange-400" />
                            )}
                            <span className="text-xs text-gray-400">
                              {hasTranslation ? t('keyManagement.completed') : t('keyManagement.missing')}
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          {selectedKeyData.type === 'object' ? (
                            <textarea
                              value={JSON.stringify(selectedKeyData.translations[language.code] || {}, null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  onTranslationUpdate(selectedKeyData.key, language.code, parsed);
                                } catch {
                                  // Invalid JSON, don't update
                                }
                              }}
                              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white font-mono text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                              rows={4}
                              placeholder={`${t('keyManagement.jsonPlaceholder')} ${language.name}...`}
                            />
                          ) : (
                            <input
                              type={selectedKeyData.type === 'number' ? 'number' : 'text'}
                              value={selectedKeyData.translations[language.code] || ''}
                              onChange={(e) => handleTranslationChange(selectedKeyData.key, language.code, e.target.value)}
                              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                              placeholder={`${language.name} ${t('keyManagement.translationPlaceholder')}`}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Key Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">{t('keyManagement.newKey')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('keyManagement.keyName')}
                </label>
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder={t('keyManagement.keyPlaceholder')}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddKey()}
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t('keyManagement.keyHint')}
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddKey}
                  disabled={!newKeyName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {t('common.add')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyManager;