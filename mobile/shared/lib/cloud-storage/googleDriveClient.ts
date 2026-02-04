/**
 * Google Drive API Client
 * Клиент для загрузки файлов в Google Drive
 */

import { GDrive } from "@robinbobin/react-native-google-drive-api-wrapper";
import { getGoogleDriveAccessToken } from "./googleDriveAuth";
import RNFS from "react-native-fs";

const API_BASE_URL = "https://www.googleapis.com/drive/v3";

/**
 * Создать клиент Google Drive
 */
async function createGDriveClient(): Promise<GDrive> {
  const accessToken = await getGoogleDriveAccessToken();
  if (!accessToken) {
    throw new Error("Не авторизован в Google Drive");
  }

  const gdrive = new GDrive();
  gdrive.accessToken = accessToken;
  return gdrive;
}

/**
 * Получить список папок пользователя
 */
export async function getGoogleDriveFolders(): Promise<Array<{ id: string; name: string }>> {
  try {
    const gdrive = await createGDriveClient();
    
    // Ищем только папки (mimeType = 'application/vnd.google-apps.folder')
    const response = await gdrive.files.list({
      q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: "files(id, name)",
      orderBy: "name",
    });

    return response.files?.map((file: any) => ({
      id: file.id,
      name: file.name,
    })) || [];
  } catch (error) {
    console.error("[GoogleDriveClient] Failed to get folders:", error);
    throw new Error(`Не удалось получить список папок: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Создать папку если не существует
 */
export async function ensureFolderExists(folderName: string): Promise<string> {
  try {
    const gdrive = await createGDriveClient();
    
    // Проверяем, существует ли папка
    const existingFolders = await getGoogleDriveFolders();
    const existingFolder = existingFolders.find((f) => f.name === folderName);
    
    if (existingFolder) {
      return existingFolder.id;
    }

    // Создаем новую папку
    const folder = await gdrive.files.create({
      name: folderName,
      mimeType: "application/vnd.google-apps.folder",
    });

    return folder.id;
  } catch (error) {
    console.error("[GoogleDriveClient] Failed to create folder:", error);
    throw new Error(`Не удалось создать папку: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Загрузить файл в Google Drive
 */
export async function uploadFileToGoogleDrive(
  filePath: string,
  fileName: string,
  folderId?: string
): Promise<string> {
  try {
    const gdrive = await createGDriveClient();
    
    // Читаем файл
    const fileData = await RNFS.readFile(filePath, "base64");
    const fileBuffer = Buffer.from(fileData, "base64");

    // Определяем MIME type по расширению
    const mimeType = fileName.endsWith(".pdf")
      ? "application/pdf"
      : fileName.endsWith(".docx")
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/octet-stream";

    // Метаданные файла
    const metadata: any = {
      name: fileName,
      mimeType,
    };

    // Если указана папка, добавляем в родители
    if (folderId) {
      metadata.parents = [folderId];
    }

    // Загружаем файл
    const uploadedFile = await gdrive.files.create({
      resource: metadata,
      media: {
        mimeType,
        body: fileBuffer,
      },
    });

    return uploadedFile.id;
  } catch (error) {
    console.error("[GoogleDriveClient] Failed to upload file:", error);
    throw new Error(`Не удалось загрузить файл: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Проверить доступность Google Drive API
 */
export async function checkGoogleDriveAvailability(): Promise<boolean> {
  try {
    const accessToken = await getGoogleDriveAccessToken();
    if (!accessToken) {
      return false;
    }

    // Пробуем получить информацию о диске
    const response = await fetch(`${API_BASE_URL}/about?fields=user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error("[GoogleDriveClient] Availability check failed:", error);
    return false;
  }
}
