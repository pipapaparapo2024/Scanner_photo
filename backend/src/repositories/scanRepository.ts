import { firestore } from "../config/firebase";
import { ScanDoc } from "../types/firestore";
import { NotFoundError, ForbiddenError } from "../utils/errors";

const USERS_COLLECTION = "users";
const SCANS_SUBCOLLECTION = "scans";

/**
 * Получить скан по ID и проверить владельца
 * Возвращает скан если он существует и принадлежит пользователю
 * @throws NotFoundError если скан не найден
 * @throws ForbiddenError если скан не принадлежит пользователю
 */
export async function getScanById(
  userId: string,
  scanId: string,
): Promise<ScanDoc> {
  const scanDoc = await firestore
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(SCANS_SUBCOLLECTION)
    .doc(scanId)
    .get();

  if (!scanDoc.exists) {
    throw new NotFoundError("Скан", scanId);
  }

  return scanDoc.data() as ScanDoc;
}

/**
 * Проверить, существует ли скан и принадлежит ли он пользователю
 */
export async function verifyScanOwnership(
  userId: string,
  scanId: string,
): Promise<boolean> {
  const scanDoc = await firestore
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(SCANS_SUBCOLLECTION)
    .doc(scanId)
    .get();

  return scanDoc.exists;
}

export async function addScan(
  userId: string,
  scan: ScanDoc,
): Promise<void> {
  try {
    await firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SCANS_SUBCOLLECTION)
      .doc(scan.scanId)
      .set(scan);
  } catch (error) {
    console.error("[scanRepository] Error adding scan:", error);
    throw error;
  }
}

export interface GetUserScansResult {
  scans: ScanDoc[];
  nextCursor: string | null;
}

/**
 * Получить страницу сканов пользователя (cursor-based пагинация)
 * @param cursor — scanId последнего документа предыдущей страницы (для следующей страницы)
 */
export async function getUserScans(
  userId: string,
  limit = 50,
  cursor?: string | null,
): Promise<GetUserScansResult> {
  const coll = firestore
    .collection(USERS_COLLECTION)
    .doc(userId)
    .collection(SCANS_SUBCOLLECTION);

  let query = coll.orderBy("scanDate", "desc").limit(limit + 1);

  if (cursor && cursor.trim()) {
    const cursorDoc = await coll.doc(cursor).get();
    if (cursorDoc.exists) {
      query = coll.orderBy("scanDate", "desc").startAfter(cursorDoc).limit(limit + 1);
    }
  }

  const snap = await query.get();
  const docs = snap.docs;
  const hasMore = docs.length > limit;
  const scans = (hasMore ? docs.slice(0, limit) : docs).map((d) => d.data() as ScanDoc);
  const nextCursor = hasMore && docs[limit] ? (docs[limit].data() as ScanDoc).scanId : null;

  return { scans, nextCursor };
}

/**
 * Обновить комментарий к скану
 * @throws NotFoundError если скан не найден
 */
export async function updateScanComment(
  userId: string,
  scanId: string,
  comment: string,
): Promise<void> {
  // Проверяем, что скан существует и принадлежит пользователю
  const exists = await verifyScanOwnership(userId, scanId);
  if (!exists) {
    throw new NotFoundError("Скан", scanId);
  }

  try {
    await firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SCANS_SUBCOLLECTION)
      .doc(scanId)
      .update({ comment });
  } catch (error) {
    console.error("[scanRepository] Error updating scan comment:", error);
    throw error;
  }
}

/**
 * Обновить статус избранного
 * @throws NotFoundError если скан не найден
 */
export async function updateScanFavorite(
  userId: string,
  scanId: string,
  isFavorite: boolean,
): Promise<void> {
  // Проверяем, что скан существует и принадлежит пользователю
  const exists = await verifyScanOwnership(userId, scanId);
  if (!exists) {
    throw new NotFoundError("Скан", scanId);
  }

  try {
    await firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SCANS_SUBCOLLECTION)
      .doc(scanId)
      .update({ isFavorite });
  } catch (error) {
    console.error("[scanRepository] Error updating scan favorite:", error);
    throw error;
  }
}

/**
 * Удалить скан пользователя
 * @throws NotFoundError если скан не найден
 */
export async function deleteScan(
  userId: string,
  scanId: string,
): Promise<void> {
  // Проверяем, что скан существует и принадлежит пользователю
  const exists = await verifyScanOwnership(userId, scanId);
  if (!exists) {
    throw new NotFoundError("Скан", scanId);
  }

  try {
    await firestore
      .collection(USERS_COLLECTION)
      .doc(userId)
      .collection(SCANS_SUBCOLLECTION)
      .doc(scanId)
      .delete();
  } catch (error) {
    console.error("[scanRepository] Error deleting scan:", error);
    throw error;
  }
}

