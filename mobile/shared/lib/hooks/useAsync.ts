import { useState, useCallback, useRef, useEffect } from "react";
import { handleError, logError, ErrorInfo, ErrorCategory } from "../errorHandling/errorHandler";

/**
 * Состояние асинхронной операции
 */
export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Результат хука useAsync
 */
export interface UseAsyncResult<T> extends AsyncState<T> {
  /** Выполнить асинхронную операцию */
  execute: (...args: any[]) => Promise<T | null>;
  /** Сбросить состояние */
  reset: () => void;
  /** Установить данные вручную */
  setData: (data: T | null) => void;
  /** Очистить ошибку */
  clearError: () => void;
}

/**
 * Опции для useAsync
 */
export interface UseAsyncOptions<T> {
  /** Выполнить сразу при монтировании */
  immediate?: boolean;
  /** Начальные данные */
  initialData?: T | null;
  /** Контекст для логирования ошибок */
  context?: string;
  /** Callback при успешном выполнении */
  onSuccess?: (data: T) => void;
  /** Callback при ошибке */
  onError?: (error: ErrorInfo) => void;
  /** Показывать ошибку пользователю */
  showError?: boolean;
}

/**
 * Хук для работы с асинхронными операциями
 * Устраняет дублирование loading/error состояний
 * 
 * @example
 * const { data, loading, error, execute } = useAsync(
 *   () => api.getUser(userId),
 *   { context: "getUser", immediate: true }
 * );
 */
export function useAsync<T>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncResult<T> {
  const {
    immediate = false,
    initialData = null,
    context = "useAsync",
    onSuccess,
    onError,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: immediate,
    error: null,
    errorInfo: null,
  });

  // Ref для отслеживания монтирования компонента
  const mountedRef = useRef(true);
  // Ref для отслеживания текущего запроса (для race condition)
  const requestIdRef = useRef(0);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      // Увеличиваем ID запроса для отслеживания race condition
      const currentRequestId = ++requestIdRef.current;

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
        errorInfo: null,
      }));

      try {
        const result = await asyncFn(...args);

        // Проверяем, что компонент все еще смонтирован и это последний запрос
        if (mountedRef.current && currentRequestId === requestIdRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            errorInfo: null,
          });
          onSuccess?.(result);
        }

        return result;
      } catch (err) {
        // Обрабатываем ошибку через централизованный handler
        const errorInfo = logError(err, context);

        if (mountedRef.current && currentRequestId === requestIdRef.current) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: errorInfo.userMessage,
            errorInfo,
          }));
          onError?.(errorInfo);
        }

        return null;
      }
    },
    [asyncFn, context, onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      errorInfo: null,
    });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState((prev) => ({
      ...prev,
      data,
    }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({
      ...prev,
      error: null,
      errorInfo: null,
    }));
  }, []);

  // Выполнить при монтировании, если указано immediate
  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    clearError,
  };
}

/**
 * Хук для мутаций (POST, PUT, DELETE)
 * В отличие от useAsync, не выполняется автоматически
 */
export function useMutation<T, Args extends any[] = any[]>(
  mutationFn: (...args: Args) => Promise<T>,
  options: Omit<UseAsyncOptions<T>, "immediate"> = {}
): UseAsyncResult<T> {
  return useAsync(mutationFn, { ...options, immediate: false });
}

/**
 * Тип для функции, которая может быть отменена
 */
export interface CancellablePromise<T> extends Promise<T> {
  cancel: () => void;
}

/**
 * Создать отменяемую асинхронную функцию
 */
export function makeCancellable<T>(promise: Promise<T>): CancellablePromise<T> {
  let hasCancelled = false;

  const wrappedPromise = new Promise<T>((resolve, reject) => {
    promise
      .then((val) => {
        if (!hasCancelled) {
          resolve(val);
        }
      })
      .catch((error) => {
        if (!hasCancelled) {
          reject(error);
        }
      });
  }) as CancellablePromise<T>;

  wrappedPromise.cancel = () => {
    hasCancelled = true;
  };

  return wrappedPromise;
}

export default useAsync;
