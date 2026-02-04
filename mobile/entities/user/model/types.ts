/**
 * Типы для пользователя
 */

export interface UserDoc {
  userId: string;
  email?: string;
  scanCredits: number;
  language?: string;
  lastScanDate?: string; // ISO date string
}

export interface User {
  uid: string;
  email?: string;
  scanCredits: number;
}

