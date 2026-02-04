import { createOrUpdateUser, getUserById } from "../repositories/userRepository";
import { firestore } from "../config/firebase";
import type { UserDoc } from "../types/firestore";
import bcrypt from "bcrypt";

// Количество бесплатных сканов для новых пользователей
// Можно переопределить через переменную окружения INITIAL_FREE_SCANS
const INITIAL_FREE_SCANS = parseInt(process.env.INITIAL_FREE_SCANS || "5", 10);

/**
 * Получить пользователя по ID
 * НЕ создает пользователя автоматически - только возвращает существующего
 * Это важно, чтобы пользователь создавался только через /register после ввода пароля
 */
export async function getOrCreateUser(
  userId: string,
  email?: string,
): Promise<UserDoc | null> {
  const existing = await getUserById(userId);
  
  if (!existing) {
    // НЕ создаем пользователя автоматически!
    // Пользователь должен быть создан через /register после ввода пароля
    return null;
  }
  
  return existing;
}

/**
 * Создать пользователя при регистрации
 * Сохраняет захешированный пароль
 * Пользователь считается зарегистрированным, если есть документ в Firestore
 */
export async function createUserOnRegistration(
  userId: string,
  email: string,
  password: string,
): Promise<UserDoc> {
  // Хешируем пароль перед сохранением
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  const existing = await getUserById(userId);

  if (existing) {
    const updated: UserDoc = {
      ...existing,
      email,
      password: hashedPassword,
      scanCredits: existing.scanCredits || INITIAL_FREE_SCANS,
    };
    await createOrUpdateUser(updated);
    return updated;
  }

  // Один email = один документ. Если есть запись с тем же email и другим userId
  // (например, старый аккаунт в Auth удалён, в Firestore остался «осиротевший» документ) —
  // удаляем старый документ, чтобы не плодить дубликаты.
  const byEmail = await firestore.collection("users").where("email", "==", email).limit(1).get();
  if (!byEmail.empty) {
    const other = byEmail.docs[0];
    if (other.id !== userId) {
      await other.ref.delete();
    }
  }

  const user: UserDoc = {
    userId,
    email,
    password: hashedPassword, // Сохраняем захешированный пароль
    scanCredits: INITIAL_FREE_SCANS,
    language: "ru", // По умолчанию русский язык
  };

  await createOrUpdateUser(user);
  return user;
}

/**
 * Обновить данные пользователя
 */
export async function updateUser(userId: string, data: Partial<UserDoc>): Promise<UserDoc> {
  const existing = await getUserById(userId);
  if (!existing) {
    throw new Error("User not found");
  }

  // Разрешаем обновлять только определенные поля
  // В данном случае пока только language, но можно расширить
  const allowedUpdates: Partial<UserDoc> = {};
  
  if (data.language) {
    allowedUpdates.language = data.language;
  }

  if (Object.keys(allowedUpdates).length === 0) {
    return existing;
  }

  const updated: UserDoc = {
    ...existing,
    ...allowedUpdates,
  };

  await createOrUpdateUser(updated);
  return updated;
}


