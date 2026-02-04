/**
 * Secure Token Storage
 * Хранение OAuth токенов в react-native-keychain
 */

import * as Keychain from "react-native-keychain";

const GOOGLE_DRIVE_SERVICE = "com.scanimg.google_drive";
const YANDEX_DISK_SERVICE = "com.scanimg.yandex_disk";

/**
 * Сохранить токен для Google Drive
 */
export async function saveGoogleDriveToken(token: string): Promise<void> {
  try {
    await Keychain.setInternetCredentials(
      GOOGLE_DRIVE_SERVICE,
      "token",
      token
    );
  } catch (error) {
    console.error("[AuthStorage] Failed to save Google Drive token:", error);
    throw new Error("Не удалось сохранить токен Google Drive");
  }
}

/**
 * Получить токен для Google Drive
 */
export async function getGoogleDriveToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getInternetCredentials(
      GOOGLE_DRIVE_SERVICE
    );
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error("[AuthStorage] Failed to get Google Drive token:", error);
    return null;
  }
}

/**
 * Удалить токен Google Drive
 */
export async function removeGoogleDriveToken(): Promise<void> {
  try {
    await Keychain.resetInternetCredentials(GOOGLE_DRIVE_SERVICE);
  } catch (error) {
    console.error("[AuthStorage] Failed to remove Google Drive token:", error);
  }
}

/**
 * Сохранить токен для Яндекс.Диск
 */
export async function saveYandexDiskToken(token: string): Promise<void> {
  try {
    await Keychain.setInternetCredentials(
      YANDEX_DISK_SERVICE,
      "token",
      token
    );
  } catch (error) {
    console.error("[AuthStorage] Failed to save Yandex Disk token:", error);
    throw new Error("Не удалось сохранить токен Яндекс.Диск");
  }
}

/**
 * Получить токен для Яндекс.Диск
 */
export async function getYandexDiskToken(): Promise<string | null> {
  try {
    const credentials = await Keychain.getInternetCredentials(
      YANDEX_DISK_SERVICE
    );
    return credentials ? credentials.password : null;
  } catch (error) {
    console.error("[AuthStorage] Failed to get Yandex Disk token:", error);
    return null;
  }
}

/**
 * Удалить токен Яндекс.Диск
 */
export async function removeYandexDiskToken(): Promise<void> {
  try {
    await Keychain.resetInternetCredentials(YANDEX_DISK_SERVICE);
  } catch (error) {
    console.error("[AuthStorage] Failed to remove Yandex Disk token:", error);
  }
}

/**
 * Проверить, подключен ли Google Drive
 */
export async function isGoogleDriveConnected(): Promise<boolean> {
  const token = await getGoogleDriveToken();
  return token !== null;
}

/**
 * Проверить, подключен ли Яндекс.Диск
 */
export async function isYandexDiskConnected(): Promise<boolean> {
  const token = await getYandexDiskToken();
  return token !== null;
}
