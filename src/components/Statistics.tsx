import React from 'react';
import { BarChart3, TrendingUp, Target, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Language, TranslationKey, Statistics as StatsType } from '../types';

interface StatisticsProps {
  languages: Language[];
  keys: TranslationKey[];
}

const Statistics: React.FC<StatisticsProps> = ({ languages, keys }) => {
  const { t } = useTranslation();

  const calculateStatistics = (): StatsType => {
    const totalKeys = keys.length;
    const totalLanguages = languages.length;
    
    let totalTranslations = 0;
    let totalPossibleTranslations = totalKeys * totalLanguages;
    
    keys.forEach(key => {
      languages.forEach(lang => {
        const translation = key.translations[lang.code];
        if (translation !== undefined && translation !== null && translation !== '') {
          totalTranslations++;
        }
      });
    });
    
    const averageCompletion = totalPossibleTranslations > 0 
      ? (totalTranslations / totalPossibleTranslations) * 100 
      : 0;
    
    return {
      totalKeys,
      totalLanguages,
      totalTranslations,
      averageCompletion
    };
  };

  const getLanguageStats = () => {
    return languages.map(lang => {
      let completedTranslations = 0;
      
      keys.forEach(key => {
        const translation = key.translations[lang.code];
        if (translation !== undefined && translation !== null && translation !== '') {
          completedTranslations++;
        }
      });
      
      const completionRate = keys.length > 0 ? (completedTranslations / keys.length) * 100 : 0;
      
      return {
        ...lang,
        completedTranslations,
        completionRate
      };
    });
  };

  const getMissingTranslationsByKey = () => {
    return keys.map(key => {
      const missingLanguages = languages.filter(lang => {
        const translation = key.translations[lang.code];
        return translation === undefined || translation === null || translation === '';
      });
      
      return {
        key: key.key,
        missingCount: missingLanguages.length,
        missingLanguages: missingLanguages.map(l => l.code)
      };
    }).filter(item => item.missingCount > 0)
      .sort((a, b) => b.missingCount - a.missingCount);
  };

  const stats = calculateStatistics();
  const languageStats = getLanguageStats();
  const missingTranslations = getMissingTranslationsByKey();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart3 className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-semibold text-white">{t('statistics.title')}</h2>
      </div>

      {/* Genel İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-lg border border-blue-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-300 text-sm font-medium">{t('statistics.totalKeys')}</p>
              <p className="text-2xl font-bold text-white">{stats.totalKeys}</p>
            </div>
            <Target className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-lg border border-teal-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-300 text-sm font-medium">{t('statistics.totalLanguages')}</p>
              <p className="text-2xl font-bold text-white">{stats.totalLanguages}</p>
            </div>
            <Globe className="w-8 h-8 text-teal-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-500/20 to-emerald-600/20 rounded-lg border border-emerald-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-300 text-sm font-medium">{t('statistics.completedTranslations')}</p>
              <p className="text-2xl font-bold text-white">{stats.totalTranslations}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-lg border border-orange-500/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-300 text-sm font-medium">{t('statistics.averageCompletion')}</p>
              <p className="text-2xl font-bold text-white">{Math.round(stats.averageCompletion)}%</p>
            </div>
            <BarChart3 className="w-8 h-8 text-orange-400" />
          </div>
        </div>
      </div>

      {/* Dil Bazında İlerleme */}
      {languageStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('statistics.languageProgress')}</h3>
          <div className="space-y-4">
            {languageStats
              .sort((a, b) => b.completionRate - a.completionRate)
              .map((lang) => (
                <div key={lang.code} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{lang.flag}</span>
                      <span className="font-medium text-white">{lang.name}</span>
                      <span className="text-sm text-gray-400 uppercase">({lang.code})</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-white">
                        {lang.completedTranslations} / {keys.length}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({Math.round(lang.completionRate)}%)
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-teal-400 to-emerald-400 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${lang.completionRate}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Eksik Çeviri Raporu */}
      {missingTranslations.length > 0 && (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">{t('statistics.missingTranslationReport')}</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {missingTranslations.slice(0, 10).map((item, index) => (
              <div
                key={item.key}
                className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <span className="font-mono text-sm text-white">{item.key}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs">
                    {item.missingCount} {t('statistics.missing')}
                  </span>
                  <div className="flex space-x-1">
                    {item.missingLanguages.slice(0, 3).map((langCode) => {
                      const lang = languages.find(l => l.code === langCode);
                      return lang ? (
                        <span key={langCode} className="text-xs opacity-70">
                          {lang.flag}
                        </span>
                      ) : null;
                    })}
                    {item.missingLanguages.length > 3 && (
                      <span className="text-xs text-gray-400">+{item.missingLanguages.length - 3}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {missingTranslations.length > 10 && (
              <div className="text-center text-gray-400 text-sm">
                {t('statistics.more', { count: missingTranslations.length - 10 })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Eğer hiç veri yoksa */}
      {stats.totalKeys === 0 && (
        <div className="text-center py-12 text-gray-400">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t('statistics.noData')}</p>
          <p className="text-sm">{t('statistics.noDataSubtitle')}</p>
        </div>
      )}
    </div>
  );
};

export default Statistics;