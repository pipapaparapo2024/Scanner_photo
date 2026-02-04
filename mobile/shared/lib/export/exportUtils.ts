import { Share, Platform } from "react-native";

/**
 * Утилиты для экспорта результатов сканирования
 * Использует встроенный Share API React Native для совместимости
 */

/**
 * Экспорт текста в TXT файл через Share меню
 * Создает текстовое содержимое и открывает Share меню
 */
export async function exportToTxt(text: string, filename?: string): Promise<void> {
  try {
    const fileName = filename || `scan_${Date.now()}.txt`;
    const shareMessage = `Результат сканирования\n\n${text}\n\nФайл: ${fileName}`;
    
    const result = await Share.share({
      message: shareMessage,
      title: "Экспорт скана в TXT",
    });

    // На Android result.action может быть 'sharedAction' или 'dismissedAction'
    // На iOS result.action может быть 'sharedAction' или 'dismissedAction'
    if (result.action === Share.dismissedAction) {
      // Пользователь отменил - это нормально
      return;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    // Пользователь отменил - это нормально
    if (
      errorMessage.includes("User did not share") ||
      errorMessage.includes("User cancelled") ||
      errorMessage.includes("cancelled") ||
      errorMessage.includes("dismissed")
    ) {
      return;
    }
    console.error("Export to TXT failed:", error);
    throw new Error("Не удалось экспортировать в TXT файл");
  }
}

/**
 * Экспорт текста в PDF (через HTML)
 * Создает HTML контент и открывает Share меню
 */
export async function exportToPdf(text: string, filename?: string): Promise<void> {
  try {
    const now = new Date();
    // Use simple ISO date string for safety across devices/locales
    const dateStr = now.toISOString().split('T')[0]; 
    const fileName = filename || `scan_${Date.now()}.pdf`;
    
    // Создаем HTML контент для PDF
    const htmlContent = `
Результат сканирования

Дата: ${dateStr}
Файл: ${fileName}

─────────────────────────────

${text}

─────────────────────────────

Для сохранения как PDF:
1. Скопируйте текст выше
2. Вставьте в текстовый редактор
3. Сохраните как PDF
    `.trim();

    const shareMessage = `Результат сканирования (PDF)\n\n${htmlContent}`;

    const result = await Share.share({
      message: shareMessage,
      title: "Экспорт скана в PDF",
    });

    if (result.action === Share.dismissedAction) {
      return;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (
      errorMessage.includes("User did not share") ||
      errorMessage.includes("User cancelled") ||
      errorMessage.includes("cancelled") ||
      errorMessage.includes("dismissed")
    ) {
      return;
    }
    console.error("Export to PDF failed:", error);
    throw new Error("Не удалось экспортировать в PDF");
  }
}

/**
 * Поделиться текстом через Share API (email, Telegram и др.)
 */
export async function shareText(text: string, title?: string): Promise<void> {
  try {
    const result = await Share.share({
      message: text,
      title: title || "Результат сканирования",
    });

    if (result.action === Share.dismissedAction) {
      return;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (
      errorMessage.includes("User did not share") ||
      errorMessage.includes("User cancelled") ||
      errorMessage.includes("cancelled") ||
      errorMessage.includes("dismissed")
    ) {
      return;
    }
    console.error("Share failed:", error);
    throw new Error("Не удалось поделиться текстом");
  }
}

/**
 * Экспорт в TXT с сохранением в файловую систему (без Share меню)
 * Возвращает текст для сохранения
 */
export async function saveToTxt(text: string, filename?: string): Promise<string> {
  try {
    const fileName = filename || `scan_${Date.now()}.txt`;
    // Возвращаем текст, который можно сохранить через Share API
    return `Результат сканирования\nФайл: ${fileName}\n\n${text}`;
  } catch (error) {
    console.error("Save to TXT failed:", error);
    throw new Error("Не удалось сохранить файл");
  }
}
