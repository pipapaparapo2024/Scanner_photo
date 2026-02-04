/**
 * Cloud Storage Settings Storage
 * Хранение настроек облачного хранилища в AsyncStorage
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CloudService } from "./cloudStorageClient";

const SETTINGS_KEY = "@scanimg:cloud_storage_settings";

export interface CloudStorageSettings {
  autoSyncEnabled: boolean;
  service: CloudService | null;
  folderId?: string; // Для Google Drive
  folderPath?: string; // Для Яндекс.Диск
  defaultFormat: "pdf" | "docx";
}

const DEFAULT_SETTINGS: CloudStorageSettings = {
  autoSyncEnabled: false,
  service: null,
  defaultFormat: "pdf",
};

/**
 * Получить настройки облачного хранилища
 */
export async function getCloudStorageSettings(): Promise<CloudStorageSettings> {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error("[SettingsStorage] Failed to get settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Сохранить настройки облачного хранилища
 */
export async function saveCloudStorageSettings(
  settings: Partial<CloudStorageSettings>
): Promise<void> {
  try {
    const currentSettings = await getCloudStorageSettings();
    const newSettings = { ...currentSettings, ...settings };
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
  } catch (error) {
    console.error("[SettingsStorage] Failed to save settings:", error);
    throw new Error("Не удалось сохранить настройки");
  }
}

/**
 * Сбросить настройки
 */
export async function resetCloudStorageSettings(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("[SettingsStorage] Failed to reset settings:", error);
  }
}
