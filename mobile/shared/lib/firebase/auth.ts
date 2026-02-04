import { getAuth } from "@react-native-firebase/auth";
import type { FirebaseAuthTypes } from "@react-native-firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { 
  sendVerificationCode as apiSendVerificationCode, 
  verifyCode as apiVerifyCode, 
  checkEmailVerified as apiCheckEmailVerified,
  registerUser as apiRegisterUser
} from "../api/authApi";
import { apiClient } from "../api/client";

/**
 * Хелперы для работы с Firebase Authentication
 * Использует новый модульный API вместо deprecated firebase() API
 */

export type User = FirebaseAuthTypes.User;
export type AuthCredential = FirebaseAuthTypes.AuthCredential;

/**
 * Получить экземпляр Firebase Auth
 */
function getAuthInstance() {
  return getAuth();
}

/**
 * Получить текущего авторизованного пользователя
 */
export function getCurrentUser(): User | null {
  return getAuthInstance().currentUser;
}

/**
 * Получить Firebase ID Token для авторизации запросов к бэкенду
 */
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }
  return user.getIdToken(forceRefresh);
}

/**
 * Подписаться на изменения состояния аутентификации
 */
export function onAuthStateChanged(
  callback: (user: User | null) => void,
): () => void {
  return getAuthInstance().onAuthStateChanged(callback);
}

/**
 * Войти анонимно (для MVP можно использовать анонимную аутентификацию)
 */
export async function signInAnonymously(): Promise<User> {
  try {
    // Используем новый API без deprecated методов
    const userCredential = await getAuthInstance().signInAnonymously();
    return userCredential.user;
  } catch (error: any) {
    // Более детальная обработка ошибок
    if (error?.code === 'auth/network-request-failed') {
      throw new Error('Проблема с сетью. Проверьте подключение к интернету.');
    } else if (error?.code === 'auth/too-many-requests') {
      throw new Error('Слишком много запросов. Попробуйте позже.');
    }
    throw error;
  }
}

/**
 * Войти с email и паролем
 */
export async function signInWithEmailAndPassword(
  email: string,
  password: string,
): Promise<User> {
  try {
    const userCredential = await getAuthInstance().signInWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error: any) {
    // Обработка всех возможных кодов ошибок аутентификации
    if (error?.code === 'auth/user-not-found' || 
        error?.code === 'auth/wrong-password' || 
        error?.code === 'auth/invalid-credential') {
      throw new Error('Неверно введены данные. Проверьте email и пароль.');
    } else if (error?.code === 'auth/invalid-email') {
      throw new Error('Неверный формат email');
    } else if (error?.code === 'auth/network-request-failed') {
      throw new Error('Проблема с сетью. Проверьте подключение к интернету.');
    } else if (error?.code === 'auth/too-many-requests') {
      throw new Error('Слишком много попыток входа. Попробуйте позже.');
    } else if (error?.code === 'auth/user-disabled') {
      throw new Error('Аккаунт заблокирован. Обратитесь в поддержку.');
    }
    // Для неизвестных ошибок возвращаем понятное сообщение
    const errorMessage = error?.message || 'Ошибка при входе. Попробуйте еще раз.';
    throw new Error(errorMessage);
  }
}

/**
 * Зарегистрироваться с email и паролем
 */
export async function createUserWithEmailAndPassword(
  email: string,
  password: string,
): Promise<User> {
  try {
    const userCredential = await getAuthInstance().createUserWithEmailAndPassword(email, password);
    return userCredential.user;
  } catch (error: any) {
    if (error?.code === 'auth/email-already-in-use') {
      throw new Error('Email уже используется');
    } else if (error?.code === 'auth/invalid-email') {
      throw new Error('Неверный формат email');
    } else if (error?.code === 'auth/weak-password') {
      throw new Error('Пароль слишком слабый');
    } else if (error?.code === 'auth/network-request-failed') {
      throw new Error('Проблема с сетью. Проверьте подключение к интернету.');
    }
    throw error;
  }
}

/**
 * Генерировать случайный 4-значный код
 */
function generateVerificationCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Сохранить код подтверждения в локальное хранилище
 */
async function saveVerificationCode(email: string, code: string): Promise<void> {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 минут
  const data = {
    email,
    code,
    expiresAt,
  };
  const key = `@scanimg:verification_code:${email}`;
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

/**
 * Получить код подтверждения из локального хранилища
 */
async function getVerificationCode(email: string): Promise<{ code: string; expiresAt: number } | null> {
  const key = `@scanimg:verification_code:${email}`;
  const data = await AsyncStorage.getItem(key);
  if (!data) {
    return null;
  }
  return JSON.parse(data);
}

/**
 * Удалить код подтверждения из локального хранилища
 */
async function removeVerificationCode(email: string): Promise<void> {
  const key = `@scanimg:verification_code:${email}`;
  await AsyncStorage.removeItem(key);
}

/**
 * Отправить код подтверждения на email
 * Код отправляется через backend API, который отправляет email с кодом
 * Код сохраняется в Firestore на backend с временем жизни 10 минут
 */
export async function sendEmailVerificationCode(email: string): Promise<void> {
  try {
    // Отправляем запрос на backend для отправки кода на email
    await apiSendVerificationCode(email);
    
    // Код отправлен на email через backend
    console.log("Verification code sent to email via backend");
  } catch (error: any) {
    console.error("Failed to send verification code:", error);
    throw new Error(error.message || 'Не удалось отправить код подтверждения');
  }
}

/**
 * Подтвердить email кодом
 * Проверяет код через backend API (НЕ создает пользователя)
 * Пользователь будет создан на следующем шаге с паролем
 */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  try {
    // Проверяем код через backend
    await apiVerifyCode(email, code);
    
    // Код верный - email подтвержден на backend
    // Сохраняем подтвержденный email локально для следующего шага
    const verifiedEmailKey = `@scanimg:verified_email:${email}`;
    await AsyncStorage.setItem(verifiedEmailKey, JSON.stringify({
      email,
      verifiedAt: Date.now(),
    }));
    
    console.log("Email code verified successfully");
  } catch (error: any) {
    console.error("Failed to verify code:", error);
    // Пробрасываем ошибку от backend
    throw new Error(error.message || 'Ошибка при проверке кода');
  }
}

/**
 * Проверить, подтвержден ли email кодом
 * Проверяет через backend API
 */
async function isEmailVerified(email: string): Promise<boolean> {
  try {
    // Проверяем через backend
    const result = await apiCheckEmailVerified(email);
    return result.verified === true;
  } catch (error) {
    console.error("Failed to check email verification:", error);
    // Если ошибка, проверяем локально как fallback
    const verifiedEmailKey = `@scanimg:verified_email:${email}`;
    const data = await AsyncStorage.getItem(verifiedEmailKey);
    if (!data) {
      return false;
    }
    const verified = JSON.parse(data);
    // Проверка действительна 30 минут
    return Date.now() - verified.verifiedAt < 30 * 60 * 1000;
  }
}

/**
 * Создать пользователя с email и паролем и записать его в Firestore
 * 
 * Поток: email → код → пароль → создаём в Firebase Auth → создаём в Firestore (users) → вход.
 * При подтверждении кода в Firestore и Firebase Auth ничего не создаётся.
 */
export async function createUserAfterVerification(
  email: string,
  password: string,
): Promise<User> {
  const removeVerifiedKey = async () => {
    await AsyncStorage.removeItem(`@scanimg:verified_email:${email}`);
  };

  const createInFirestore = async (firebaseUser: User) => {
    const token = await firebaseUser.getIdToken();
    apiClient.setAuthToken(token); // чтобы useUser и прочие запросы уже шли с токеном
    await apiRegisterUser(email, password, token); // токен в запрос, чтобы не было гонки с useUser
  };

  try {
    await removeVerifiedKey();

    // 1) Создаём пользователя в Firebase Auth (и сразу логиним)
    const userCredential = await getAuthInstance().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;

    // 2) Токен + создание документа в Firestore (коллекция users). Без токена бэкенд отдаёт 401.
    await createInFirestore(user);

    return getAuthInstance().currentUser || user;
  } catch (error: any) {
    if (error?.code === "auth/email-already-in-use") {
      // Пользователь уже есть в Firebase Auth (например, незавершённая регистрация).
      // Пробуем войти и, если в Firestore его ещё нет, создаём документ.
      try {
        const signInResult = await getAuthInstance().signInWithEmailAndPassword(email, password);
        const existingUser = signInResult.user;

        await createInFirestore(existingUser);
        return getAuthInstance().currentUser || existingUser;
      } catch (signInErr: any) {
        const c = signInErr?.code;
        if (c === "auth/wrong-password" || c === "auth/user-not-found" || c === "auth/invalid-credential") {
          throw new Error("Этот email уже зарегистрирован с другим паролем. Используйте вход или восстановление пароля.");
        }
        throw new Error("Email уже зарегистрирован. Используйте вход.");
      }
    }

    if (error?.code === "auth/invalid-email") {
      throw new Error("Неверный формат email");
    }
    if (error?.code === "auth/weak-password") {
      throw new Error("Пароль слишком слабый. Используйте минимум 6 символов.");
    }
    if (error?.code === "auth/network-request-failed") {
      throw new Error("Проблема с сетью. Проверьте подключение к интернету.");
    }

    // Ошибка от API (в т.ч. при создании в Firestore) — показываем как есть или общий текст
    const msg = error?.message || "Ошибка при создании аккаунта";
    if (typeof msg === "string" && (msg.includes("401") || msg.includes("404") || msg.includes("профиль") || msg.includes("Firestore") || msg.includes("Эндпоинт"))) {
      throw new Error("Не удалось создать профиль. Проверьте, что бэкенд запущен (npm run dev в backend), и попробуйте снова.");
    }
    throw new Error(msg);
  }
}

/**
 * Выйти из системы
 */
export async function signOut(): Promise<void> {
  try {
    const currentUser = getCurrentUser();
    if (!currentUser) {
      // Пользователь уже не авторизован, просто возвращаемся
      return;
    }
    await getAuthInstance().signOut();
  } catch (error: any) {
    // Если пользователь уже не авторизован, это нормально
    if (error?.code === 'auth/no-current-user' || error?.code === 'auth/null-user') {
      return; // Игнорируем ошибку, если пользователь уже вышел
    }
    throw error;
  }
}

/**
 * Проверить, авторизован ли пользователь
 */
export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
