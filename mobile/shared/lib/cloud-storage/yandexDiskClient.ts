/**
 * Yandex Disk API Client
 * Клиент для загрузки файлов в Яндекс.Диск
 */

import { getYandexDiskAccessToken } from "./yandexDiskAuth";
import RNFS from "react-native-fs";

const API_BASE_URL = "https://cloud-api.yandex.net/v1/disk";

/**
 * Получить список папок пользователя
 */
export async function getYandexDiskFolders(): Promise<Array<{ path: string; name: string }>> {
  try {
    const accessToken = await getYandexDiskAccessToken();
    if (!accessToken) {
      throw new Error("Не авторизован в Яндекс.Диск");
    }

    const response = await fetch(`${API_BASE_URL}/resources?path=/&type=dir&limit=1000`, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const folders = data._embedded?.items || [];

    return folders
      .filter((item: any) => item.type === "dir")
      .map((item: any) => ({
        path: item.path,
        name: item.name,
      }));
  } catch (error) {
    console.error("[YandexDiskClient] Failed to get folders:", error);
    throw new Error(`Не удалось получить список папок: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Создать папку если не существует
 */
export async function ensureYandexDiskFolderExists(folderPath: string): Promise<void> {
  try {
    const accessToken = await getYandexDiskAccessToken();
    if (!accessToken) {
      throw new Error("Не авторизован в Яндекс.Диск");
    }

    // Проверяем, существует ли папка
    const checkResponse = await fetch(`${API_BASE_URL}/resources?path=${encodeURIComponent(folderPath)}`, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (checkResponse.ok) {
      // Папка уже существует
      return;
    }

    if (checkResponse.status !== 404) {
      throw new Error(`Failed to check folder: ${checkResponse.status}`);
    }

    // Создаем папку
    const createResponse = await fetch(`${API_BASE_URL}/resources?path=${encodeURIComponent(folderPath)}`, {
      method: "PUT",
      headers: {
        Authorization: `OAuth ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Не удалось создать папку");
    }
  } catch (error) {
    console.error("[YandexDiskClient] Failed to create folder:", error);
    throw new Error(`Не удалось создать папку: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Загрузить файл в Яндекс.Диск
 */
export async function uploadFileToYandexDisk(
  filePath: string,
  fileName: string,
  folderPath: string = "/ScanImg"
): Promise<string> {
  try {
    const accessToken = await getYandexDiskAccessToken();
    if (!accessToken) {
      throw new Error("Не авторизован в Яндекс.Диск");
    }

    // Убеждаемся, что папка существует
    await ensureYandexDiskFolderExists(folderPath);

    // Получаем URL для загрузки
    const uploadPath = `${folderPath}/${fileName}`;
    const getUploadUrlResponse = await fetch(
      `${API_BASE_URL}/resources/upload?path=${encodeURIComponent(uploadPath)}&overwrite=true`,
      {
        headers: {
          Authorization: `OAuth ${accessToken}`,
          Accept: "application/json",
        },
      }
    );

    if (!getUploadUrlResponse.ok) {
      const errorData = await getUploadUrlResponse.json().catch(() => ({}));
      throw new Error(errorData.message || "Не удалось получить URL для загрузки");
    }

    const uploadData = await getUploadUrlResponse.json();
    const uploadUrl = uploadData.href;

    if (!uploadUrl) {
      throw new Error("URL для загрузки не получен");
    }

    // Читаем файл
    const fileData = await RNFS.readFile(filePath, "base64");
    const fileBuffer = Buffer.from(fileData, "base64");

    // Загружаем файл
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": "application/octet-stream",
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Не удалось загрузить файл: ${uploadResponse.status}`);
    }

    return uploadPath;
  } catch (error) {
    console.error("[YandexDiskClient] Failed to upload file:", error);
    throw new Error(`Не удалось загрузить файл: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Проверить доступность Яндекс.Диск API
 */
export async function checkYandexDiskAvailability(): Promise<boolean> {
  try {
    const accessToken = await getYandexDiskAccessToken();
    if (!accessToken) {
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/`, {
      headers: {
        Authorization: `OAuth ${accessToken}`,
        Accept: "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.error("[YandexDiskClient] Availability check failed:", error);
    return false;
  }
}
