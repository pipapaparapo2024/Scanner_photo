export interface UserDoc {
  userId: string;
  email: string;
  password?: string; // Захешированный пароль пользователя (bcrypt hash)
  scanCredits: number;
  language?: string; // Язык интерфейса (ru/en)
  lastScanDate?: string; // ISO-строка
}

export interface ScanDoc {
  scanId: string;
  scanDate: string; // ISO-строка
  extractedText: string;
  comment?: string; // Комментарий/заметка пользователя
  tags?: string[]; // Теги для группировки
  category?: string; // Категория: "Документы", "Чеки", "Заметки" и т.д.
  isFavorite?: boolean; // Избранное
}

export interface RewardTokenDoc {
  token: string;
  userId: string;
  isUsed: boolean;
  createdAt: string; // ISO-строка
}

export interface FeedbackDoc {
  feedbackId: string;
  userId?: string; // Опционально, если пользователь авторизован
  email?: string;
  subject: string;
  message: string;
  createdAt: string; // ISO-строка
  status?: "new" | "read" | "resolved"; // Статус обработки
}
