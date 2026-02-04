import { i18n } from '../i18n/i18n';

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface FAQCategory {
  id: string;
  name: string;
}

export const getFAQCategories = (): FAQCategory[] => {
  const t = i18n.t.bind(i18n);
  return [
    {
      id: "general",
      name: t('faq.categories.general'),
    },
    {
      id: "scanning",
      name: t('faq.categories.scanning'),
    },
    {
      id: "credits",
      name: t('faq.categories.credits'),
    },
    {
      id: "account",
      name: t('faq.categories.account'),
    },
    {
      id: "technical",
      name: t('faq.categories.technical'),
    },
  ];
};

export const FAQ_CATEGORIES: FAQCategory[] = getFAQCategories();

export const getFAQData = (): FAQItem[] => {
  const t = i18n.t.bind(i18n);
  
  return [
    // General
    {
      id: "what-is-app",
      question: t('faq.items.what-is-app.question'),
      answer: t('faq.items.what-is-app.answer'),
      category: "general",
    },
    {
      id: "how-to-use",
      question: t('faq.items.how-to-use.question'),
      answer: t('faq.items.how-to-use.answer'),
      category: "general",
    },
    {
      id: "supported-languages",
      question: t('faq.items.supported-languages.question'),
      answer: t('faq.items.supported-languages.answer'),
      category: "general",
    },

    // Scanning
    {
      id: "how-to-scan",
      question: t('faq.items.how-to-scan.question'),
      answer: t('faq.items.how-to-scan.answer'),
      category: "scanning",
    },
    {
      id: "scan-quality",
      question: t('faq.items.scan-quality.question'),
      answer: t('faq.items.scan-quality.answer'),
      category: "scanning",
    },
    {
      id: "scan-history",
      question: t('faq.items.scan-history.question'),
      answer: t('faq.items.scan-history.answer'),
      category: "scanning",
    },
    {
      id: "copy-text",
      question: t('faq.items.copy-text.question'),
      answer: t('faq.items.copy-text.answer'),
      category: "scanning",
    },

    // Credits
    {
      id: "what-are-credits",
      question: t('faq.items.what-are-credits.question'),
      answer: t('faq.items.what-are-credits.answer'),
      category: "credits",
    },
    {
      id: "how-to-get-credits",
      question: t('faq.items.how-to-get-credits.question'),
      answer: t('faq.items.how-to-get-credits.answer'),
      category: "credits",
    },
    {
      id: "credits-cost",
      question: t('faq.items.credits-cost.question'),
      answer: t('faq.items.credits-cost.answer'),
      category: "credits",
    },

    // Account
    {
      id: "create-account",
      question: t('faq.items.create-account.question'),
      answer: t('faq.items.create-account.answer'),
      category: "account",
    },
    {
      id: "forgot-password",
      question: t('faq.items.forgot-password.question'),
      answer: t('faq.items.forgot-password.answer'),
      category: "account",
    },
    {
      id: "delete-account",
      question: t('faq.items.delete-account.question'),
      answer: t('faq.items.delete-account.answer'),
      category: "account",
    },

    // Technical
    {
      id: "app-crashes",
      question: t('faq.items.app-crashes.question'),
      answer: t('faq.items.app-crashes.answer'),
      category: "technical",
    },
    {
      id: "camera-not-working",
      question: t('faq.items.camera-not-working.question'),
      answer: t('faq.items.camera-not-working.answer'),
      category: "technical",
    },
    {
      id: "slow-recognition",
      question: t('faq.items.slow-recognition.question'),
      answer: t('faq.items.slow-recognition.answer'),
      category: "technical",
    },
    {
      id: "offline-mode",
      question: t('faq.items.offline-mode.question'),
      answer: t('faq.items.offline-mode.answer'),
      category: "technical",
    },
  ];
};

// Deprecated: use getFAQData() instead to get localized content
export const FAQ_DATA: FAQItem[] = getFAQData();

/**
 * Получить FAQ по категории
 */
export function getFAQByCategory(categoryId: string): FAQItem[] {
  return getFAQData().filter((item) => item.category === categoryId);
}

/**
 * Поиск по FAQ
 */
export function searchFAQ(query: string): FAQItem[] {
  const data = getFAQData();
  const lowerQuery = query.toLowerCase().trim();
  if (!lowerQuery) return data;

  return data.filter(
    (item) =>
      item.question.toLowerCase().includes(lowerQuery) ||
      item.answer.toLowerCase().includes(lowerQuery)
  );
}
