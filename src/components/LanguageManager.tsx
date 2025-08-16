import React, { useState } from 'react';
import { Plus, Globe, Trash2, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language } from '../types';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../utils/languageUtils';

interface LanguageManagerProps {
  languages: Language[];
  onLanguageAdd: (language: Language) => void;
  onLanguageRemove: (code: string) => void;
}

const LanguageManager: React.FC<LanguageManagerProps> = ({
  languages,
  onLanguageAdd,
  onLanguageRemove
}) => {
  const { t } = useTranslation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLanguageCode, setSelectedLanguageCode] = useState('');

  const availableLanguages = SUPPORTED_LANGUAGES.filter(
    lang => !languages.find(l => l.code === lang.code)
  );

  const handleAddLanguage = () => {
    if (selectedLanguageCode) {
      const language = getLanguageByCode(selectedLanguageCode);
      if (language) {
        onLanguageAdd({ ...language });
        setSelectedLanguageCode('');
        setShowAddModal(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">{t('languageManagement.title')}</h2>
          <span className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded-full">
            {languages.length} {t('languageManagement.languages')}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 transition-all duration-200 transform hover:scale-105"
        >
          <Plus className="w-4 h-4" />
          <span>{t('languageManagement.addLanguage')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {languages.map((language) => (
          <div
            key={language.code}
            className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{language.flag}</span>
                <div>
                  <h3 className="font-medium text-white">{language.name}</h3>
                  <p className="text-sm text-gray-400 uppercase">{language.code}</p>
                </div>
              </div>
              <button
                onClick={() => onLanguageRemove(language.code)}
                className="p-2 text-gray-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{t('languageManagement.completion')}</span>
                <span className="text-white font-medium">{Math.round(language.completionRate)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${language.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">{t('languageManagement.newLanguage')}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t('languageManagement.selectLanguage')}
                </label>
                <select
                  value={selectedLanguageCode}
                  onChange={(e) => setSelectedLanguageCode(e.target.value)}
                  className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('languageManagement.selectLanguage')}...</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleAddLanguage}
                  disabled={!selectedLanguageCode}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-lg hover:from-blue-600 hover:to-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
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

export default LanguageManager;