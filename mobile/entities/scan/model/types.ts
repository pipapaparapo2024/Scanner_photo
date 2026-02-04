/**
 * Типы для скана
 */

export interface ScanDoc {
  scanId: string;
  scanDate: string; // ISO date string
  extractedText: string;
  comment?: string; // Комментарий/заметка пользователя
  tags?: string[]; // Теги для группировки
  category?: string; // Категория: "Документы", "Чеки", "Заметки" и т.д.
  isFavorite?: boolean; // Избранное
}

export interface Scan extends ScanDoc {
  // Дополнительные поля если нужны на клиенте
}

export interface CreateScanRequest {
  extractedText: string;
}

export interface CreateScanResponse {
  scan: ScanDoc;
  remainingCredits: number;
}

export interface GetScansResponse {
  scans: ScanDoc[];
  nextCursor: string | null;
}

