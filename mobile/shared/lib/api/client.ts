import { API_BASE_URL } from "../../config/api";
import { handleError, logError, ErrorCategory } from "../errorHandling/errorHandler";

/** Таймаут запроса в миллисекундах (20 с) */
const REQUEST_TIMEOUT_MS = 20000;

/** Максимум повторов при сетевой ошибке или 5xx */
const MAX_RETRIES = 2;

/** Задержка перед повтором: экспоненциальная (500 ms, 1000 ms) */
function retryDelay(attempt: number): number {
  return 500 * Math.pow(2, attempt);
}

/**
 * Базовый HTTP клиент для запросов к бэкенду
 * Использует fetch API с таймаутом и ограниченным retry при сетевых/5xx ошибках
 */

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  category?: ErrorCategory;
}

/** Коды ошибок, при которых не делаем retry (операционные ошибки) */
const NO_RETRY_CODES = new Set(["NO_CREDITS", "USER_NOT_FOUND", "VALIDATION_ERROR", "INVALID_TOKEN", "AUTHENTICATION_ERROR", "CONFLICT"]);

export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      "Content-Type": "application/json",
    };
  }

  /**
   * Установить Firebase ID Token для авторизации
   */
  setAuthToken(token: string | null) {
    if (token) {
      this.defaultHeaders = {
        ...this.defaultHeaders,
        Authorization: `Bearer ${token}`,
      };
    } else {
      const { Authorization, ...rest } = this.defaultHeaders as Record<
        string,
        string
      >;
      this.defaultHeaders = rest;
    }
  }

  /**
   * Базовый метод для выполнения запросов (таймаут 20 с, retry при сетевых/5xx)
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryAttempt = 0,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = {};
        const contentType = response.headers.get("content-type");
        
        try {
          if (contentType && contentType.includes("application/json")) {
            errorData = await response.json();
          } else {
            // Если ответ не JSON (например, HTML от nginx или текст), читаем как текст
            const text = await response.text();
            errorData = { 
              message: `HTTP ${response.status}: ${response.statusText}`, 
              error: response.statusText,
              details: text.substring(0, 500) // Берем начало ответа для отладки
            };
          }
        } catch (e) {
          // Fallback если не удалось прочитать ответ
          errorData = {
            message: `HTTP ${response.status}: ${response.statusText}`,
            error: response.statusText,
          };
        }

        const code = errorData.error ?? errorData.code;
        const shouldRetry =
          retryAttempt < MAX_RETRIES &&
          (response.status >= 500 || response.status === 429) &&
          (!code || !NO_RETRY_CODES.has(code));

        if (shouldRetry) {
          await new Promise((r) => setTimeout(r, retryDelay(retryAttempt)));
          return this.request<T>(endpoint, options, retryAttempt + 1);
        }

        let message = errorData.message || errorData.error || "Request failed";
        if (response.status === 404) {
          message = `Эндпоинт не найден (404). Убедитесь, что бэкенд запущен (в папке backend: npm run dev) и слушает порт 4000. Адрес: ${this.baseUrl}${endpoint}`;
        }

        throw {
          message,
          status: response.status,
          code,
        } as ApiError;
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        return await response.json();
      }

      return {} as T;
    } catch (error: unknown) {
      const isNetworkOrAbort =
        error instanceof TypeError ||
        (error instanceof Error && error.name === "AbortError");

      const shouldRetry =
        retryAttempt < MAX_RETRIES &&
        isNetworkOrAbort;

      if (shouldRetry) {
        await new Promise((r) => setTimeout(r, retryDelay(retryAttempt)));
        return this.request<T>(endpoint, options, retryAttempt + 1);
      }

      if (error && typeof error === "object" && "status" in error) {
        const err = error as ApiError;
        const errorInfo = handleError(err, `API ${options.method || "GET"} ${endpoint}`);
        logError(err, `API ${options.method || "GET"} ${endpoint}`, {
          url,
          status: err.status,
        });
        throw {
          message: errorInfo.userMessage,
          status: err.status,
          code: err.code,
          category: errorInfo.category,
        } as ApiError;
      }

      const errorInfo = handleError(error, `API ${options.method || "GET"} ${endpoint}`);
      logError(error, `API ${options.method || "GET"} ${endpoint}`, { url });
      throw {
        message: errorInfo.userMessage,
        status: 0,
        category: errorInfo.category,
      } as ApiError;
    }
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "GET",
    });
  }

  /**
   * POST запрос
   */
  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT запрос
   */
  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PATCH запрос
   */
  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestInit,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Экспортируем singleton экземпляр
export const apiClient = new ApiClient();

