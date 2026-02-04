/**
 * Yandex Disk OAuth Authentication
 * Авторизация через OAuth для доступа к Яндекс.Диск API
 */

import { Linking } from "react-native";
import { saveYandexDiskToken, removeYandexDiskToken } from "./authStorage";

// Яндекс OAuth endpoints
const YANDEX_OAUTH_URL = "https://oauth.yandex.com/authorize";
const YANDEX_TOKEN_URL = "https://oauth.yandex.com/token";

// Scopes для Яндекс.Диск
const DISK_SCOPES = "cloud_api:disk.write cloud_api:disk.read cloud_api:disk.app_folder";

/**
 * Инициализация Яндекс OAuth
 * Получить Client ID из https://oauth.yandex.com
 */
let yandexClientId: string | null = null;

export function initYandexOAuth(clientId: string): void {
  yandexClientId = clientId;
}

/**
 * Авторизация пользователя через OAuth
 * Открывает браузер для авторизации
 */
export async function authenticateYandexDisk(): Promise<string> {
  if (!yandexClientId) {
    throw new Error("Yandex Client ID не настроен. Вызовите initYandexOAuth()");
  }

  return new Promise((resolve, reject) => {
    // Генерируем state для защиты от CSRF
    const state = Math.random().toString(36).substring(7);
    
    // URL для авторизации
    const authUrl = `${YANDEX_OAUTH_URL}?response_type=code&client_id=${yandexClientId}&redirect_uri=scanimg://yandex-oauth&scope=${DISK_SCOPES}&state=${state}`;
    
    // Открываем браузер для авторизации
    Linking.openURL(authUrl).catch((error) => {
      reject(new Error(`Не удалось открыть браузер: ${error.message}`));
    });

    // Обработчик deep link для получения кода авторизации
    let subscription: any;
    
    const handleDeepLink = async (event: { url: string }) => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
      
      try {
        const url = new URL(event.url.replace("scanimg://", "https://"));
        const code = url.searchParams.get("code");
        const returnedState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error) {
          reject(new Error(`Ошибка авторизации: ${error}`));
          return;
        }

        if (!code || returnedState !== state) {
          reject(new Error("Неверный код авторизации"));
          return;
        }

        // Обмениваем код на токен
        const token = await exchangeCodeForToken(code);
        await saveYandexDiskToken(token);
        resolve(token);
      } catch (err) {
        reject(err);
      }
    };

    subscription = Linking.addEventListener("url", handleDeepLink);

    // Таймаут на случай, если пользователь не завершит авторизацию
    setTimeout(() => {
      if (subscription && subscription.remove) {
        subscription.remove();
      }
      reject(new Error("Авторизация не завершена"));
    }, 300000); // 5 минут
  });
}

/**
 * Обменять код авторизации на токен доступа
 */
async function exchangeCodeForToken(code: string): Promise<string> {
  if (!yandexClientId) {
    throw new Error("Yandex Client ID не настроен");
  }

  try {
    const response = await fetch(YANDEX_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: yandexClientId,
        redirect_uri: "scanimg://yandex-oauth",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error_description || "Не удалось получить токен");
    }

    const data = await response.json();
    if (!data.access_token) {
      throw new Error("Токен не получен");
    }

    return data.access_token;
  } catch (error) {
    console.error("[YandexDiskAuth] Failed to exchange code for token:", error);
    throw new Error(`Не удалось получить токен: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Обновить токен доступа (если есть refresh token)
 */
export async function refreshYandexDiskToken(): Promise<string | null> {
  // Для упрощения, если токен истек, нужно переавторизоваться
  // В реальном приложении можно сохранить refresh_token и использовать его
  return null;
}

/**
 * Отключить Яндекс.Диск
 */
export async function disconnectYandexDisk(): Promise<void> {
  try {
    await removeYandexDiskToken();
  } catch (error) {
    console.error("[YandexDiskAuth] Failed to disconnect:", error);
    throw new Error("Не удалось отключить Яндекс.Диск");
  }
}

/**
 * Получить текущий токен доступа
 */
export async function getYandexDiskAccessToken(): Promise<string | null> {
  try {
    const { getYandexDiskToken } = await import("./authStorage");
    return await getYandexDiskToken();
  } catch (error) {
    console.error("[YandexDiskAuth] Failed to get access token:", error);
    return null;
  }
}
