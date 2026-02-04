import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Импорт переводов
import en from './locales/en.json';
import ru from './locales/ru.json';

const LANGUAGES = {
  en: { label: 'English', translation: en },
  ru: { label: 'Русский', translation: ru },
};

const LANG_CODES = Object.keys(LANGUAGES);

const LANGUAGE_DETECTOR = {
  type: 'languageDetector' as const,
  async: true,
  detect: (callback: (lang: string) => void) => {
    AsyncStorage.getItem('user-language', (err, language) => {
      if (err || !language) {
        // Fallback to 'ru' if no language set
        callback('ru');
        return;
      }
      callback(language);
    });
  },
  init: () => {},
  cacheUserLanguage: (language: string) => {
    AsyncStorage.setItem('user-language', language);
  },
};

if (!i18n.isInitialized) {
  i18n
    .use(LANGUAGE_DETECTOR)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        ru: { translation: ru },
      },
      fallbackLng: 'ru',
      debug: false,
      saveMissing: false,
      missingKeyHandler: () => {},
      interpolation: {
        escapeValue: false,
      },
    });
}

export { i18n, LANGUAGES };