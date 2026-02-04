/**
 * Google Drive OAuth Authentication
 * Авторизация через Google Sign-In для доступа к Google Drive API
 */

import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { saveGoogleDriveToken, removeGoogleDriveToken } from "./authStorage";

// Google Drive API scope
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.file";

/**
 * Инициализация Google Sign-In
 * Должна быть вызвана один раз при запуске приложения
 */
export async function initGoogleSignIn(webClientId: string): Promise<void> {
  try {
    GoogleSignin.configure({
      webClientId, // OAuth 2.0 Client ID из Google Cloud Console
      scopes: [DRIVE_SCOPE], // Доступ к Google Drive
      offlineAccess: true, // Получить refresh token
    });
  } catch (error) {
    console.error("[GoogleDriveAuth] Failed to configure:", error);
    throw new Error("Не удалось настроить Google Sign-In");
  }
}

/**
 * Авторизация пользователя и получение токена доступа
 */
export async function authenticateGoogleDrive(): Promise<string> {
  try {
    // Проверяем, не авторизован ли уже пользователь
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      const tokens = await GoogleSignin.getTokens();
      if (tokens.accessToken) {
        await saveGoogleDriveToken(tokens.accessToken);
        return tokens.accessToken;
      }
    }

    // Запрашиваем авторизацию
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    
    if (!userInfo.data) {
      throw new Error("Не удалось получить данные пользователя");
    }

    // Получаем токены доступа
    const tokens = await GoogleSignin.getTokens();
    if (!tokens.accessToken) {
      throw new Error("Не удалось получить токен доступа");
    }

    // Сохраняем токен
    await saveGoogleDriveToken(tokens.accessToken);

    return tokens.accessToken;
  } catch (error: any) {
    console.error("[GoogleDriveAuth] Authentication failed:", error);
    
    if (error.code === "SIGN_IN_CANCELLED") {
      throw new Error("Авторизация отменена пользователем");
    } else if (error.code === "SIGN_IN_REQUIRED") {
      throw new Error("Требуется авторизация");
    } else if (error.message) {
      throw new Error(error.message);
    } else {
      throw new Error("Не удалось авторизоваться в Google Drive");
    }
  }
}

/**
 * Обновить токен доступа (если истек)
 */
export async function refreshGoogleDriveToken(): Promise<string | null> {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (!isSignedIn) {
      return null;
    }

    const tokens = await GoogleSignin.getTokens();
    if (tokens.accessToken) {
      await saveGoogleDriveToken(tokens.accessToken);
      return tokens.accessToken;
    }

    return null;
  } catch (error) {
    console.error("[GoogleDriveAuth] Failed to refresh token:", error);
    return null;
  }
}

/**
 * Отключить Google Drive (выйти)
 */
export async function disconnectGoogleDrive(): Promise<void> {
  try {
    const isSignedIn = await GoogleSignin.isSignedIn();
    if (isSignedIn) {
      await GoogleSignin.signOut();
    }
    await removeGoogleDriveToken();
  } catch (error) {
    console.error("[GoogleDriveAuth] Failed to disconnect:", error);
    throw new Error("Не удалось отключить Google Drive");
  }
}

/**
 * Получить текущий токен доступа
 */
export async function getGoogleDriveAccessToken(): Promise<string | null> {
  try {
    // Сначала пытаемся получить сохраненный токен
    const { getGoogleDriveToken } = await import("./authStorage");
    const savedToken = await getGoogleDriveToken();
    if (savedToken) {
      return savedToken;
    }

    // Если токена нет, пытаемся обновить
    return await refreshGoogleDriveToken();
  } catch (error) {
    console.error("[GoogleDriveAuth] Failed to get access token:", error);
    return null;
  }
}
