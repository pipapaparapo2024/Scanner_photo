import { randomUUID } from "crypto";
import { addScan, getUserScans, deleteScan, updateScanComment, updateScanFavorite } from "../repositories/scanRepository";
import { updateUserScanCredits } from "../repositories/userRepository";
import { getOrCreateUser } from "./userService";
import { NoCreditsError, UserNotFoundError } from "../utils/errors";
import type { ScanDoc } from "../types/firestore";

export async function performScan(
  userId: string,
  email: string | undefined,
  extractedText: string,
): Promise<{ scan: ScanDoc; remainingCredits: number }> {
  const user = await getOrCreateUser(userId, email);

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  if (user.scanCredits <= 0) {
    throw new NoCreditsError();
  }

  // Нормализуем текст для правильного сохранения кириллицы
  // Убираем возможные проблемы с кодировкой
  let normalizedText = extractedText || "";
  if (normalizedText) {
    try {
      // Нормализуем Unicode (NFD -> NFC) для правильного отображения
      normalizedText = normalizedText.normalize("NFC");
    } catch (e) {
      console.warn("scanService: Failed to normalize text, using as-is");
    }
  }

  const now = new Date().toISOString();
  const scan: ScanDoc = {
    scanId: randomUUID(),
    scanDate: now,
    extractedText: normalizedText,
  };

  await addScan(userId, scan);

  const updatedUser = await updateUserScanCredits(userId, -1);

  return { scan, remainingCredits: updatedUser.scanCredits };
}

export async function listScans(
  userId: string,
  limit = 20,
  cursor?: string | null,
): Promise<{ scans: ScanDoc[]; nextCursor: string | null }> {
  return getUserScans(userId, limit, cursor);
}

/**
 * Обновить комментарий к скану
 */
export async function updateComment(
  userId: string,
  scanId: string,
  comment: string,
): Promise<void> {
  await updateScanComment(userId, scanId, comment);
}

/**
 * Обновить статус избранного
 */
export async function updateFavorite(
  userId: string,
  scanId: string,
  isFavorite: boolean,
): Promise<void> {
  await updateScanFavorite(userId, scanId, isFavorite);
}

/**
 * Удалить скан пользователя
 */
export async function removeScan(userId: string, scanId: string): Promise<void> {
  await deleteScan(userId, scanId);
}


