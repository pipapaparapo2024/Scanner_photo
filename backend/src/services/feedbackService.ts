import { randomUUID } from "crypto";
import { saveFeedback } from "../repositories/feedbackRepository";
import type { FeedbackDoc } from "../types/firestore";

export interface CreateFeedbackInput {
  subject: string;
  message: string;
  email?: string;
  userId?: string;
}

/**
 * Создать запись обратной связи
 */
export async function createFeedback(input: CreateFeedbackInput): Promise<{ success: boolean; message: string }> {
  // Нормализуем текст для правильного сохранения кириллицы
  const normalizeText = (text: string): string => {
    try {
      return text.normalize("NFC");
    } catch (e) {
      return text;
    }
  };

  const now = new Date().toISOString();
  const feedback: FeedbackDoc = {
    feedbackId: randomUUID(),
    userId: input.userId,
    email: input.email,
    subject: normalizeText(input.subject),
    message: normalizeText(input.message),
    createdAt: now,
    status: "new",
  };

  await saveFeedback(feedback);

  // Отправляем email администратору, если настроен
  await sendFeedbackEmail(
    feedback.subject,
    feedback.message,
    feedback.email,
    feedback.userId
  );

  return {
    success: true,
    message: "Обратная связь успешно отправлена",
  };
}
