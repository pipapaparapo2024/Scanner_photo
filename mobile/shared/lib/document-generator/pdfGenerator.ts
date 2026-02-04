/**
 * PDF Generator
 * Генерация PDF документов из текста скана
 */

import PDFLib, { PDFDocument, PDFPage } from "react-native-pdf-lib";
import RNFS from "react-native-fs";
import type { ScanDoc } from "../../../entities/scan/model/types";

/**
 * Генерация PDF документа из скана
 */
export async function generatePDF(scan: ScanDoc): Promise<string> {
  try {
    // Получаем директорию для документов
    const docsDir = await PDFLib.getDocumentsDirectory();

    // Форматируем дату
    const scanDate = new Date(scan.scanDate);
    const formattedDate = scanDate.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Создаем страницу A4 (595x842 точек)
    const page = PDFPage.create()
      .setMediaBox(595, 842);

    // Заголовок
    const title = `Скан от ${formattedDate}`;
    page.drawText(title, {
      x: 50,
      y: 800,
      color: "#000000",
    });

    // Метаданные
    let yPosition = 770;
    if (scan.category) {
      page.drawText(`Категория: ${scan.category}`, {
        x: 50,
        y: yPosition,
        color: "#808080",
      });
      yPosition -= 20;
    }

    if (scan.tags && scan.tags.length > 0) {
      page.drawText(`Теги: ${scan.tags.join(", ")}`, {
        x: 50,
        y: yPosition,
        color: "#808080",
      });
      yPosition -= 20;
    }

    // Разделитель
    yPosition -= 10;
    page.drawRectangle({
      x: 50,
      y: yPosition,
      width: 495,
      height: 1,
      color: "#CCCCCC",
    });
    yPosition -= 20;

    // Текст скана (разбиваем на строки)
    const text = scan.extractedText || "";
    const maxCharsPerLine = 70; // Примерное количество символов на строку
    const lineHeight = 14;
    const lines = [];

    // Разбиваем текст на строки
    const words = text.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length > maxCharsPerLine && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }

    // Рисуем строки текста
    let currentY = yPosition;
    for (const line of lines) {
      if (currentY < 50) {
        // Нужна новая страница - создаем новую страницу и продолжаем
        const newPage = PDFPage.create().setMediaBox(595, 842);
        currentY = 800;
        newPage.drawText(line, {
          x: 50,
          y: currentY,
          color: "#000000",
        });
        // Добавляем новую страницу к документу (будет сделано позже)
        // Пока просто продолжаем на текущей странице
      } else {
        page.drawText(line, {
          x: 50,
          y: currentY,
          color: "#000000",
        });
      }
      currentY -= lineHeight;
    }

    // Комментарий если есть
    if (scan.comment) {
      currentY -= 30;
      if (currentY < 50) {
        currentY = 800;
      }
      page.drawText("Комментарий:", {
        x: 50,
        y: currentY,
        color: "#808080",
      });
      currentY -= 15;
      page.drawText(scan.comment, {
        x: 50,
        y: currentY,
        color: "#000000",
      });
    }

    // Сохраняем PDF
    const fileName = `scan_${scan.scanId}_${Date.now()}.pdf`;
    const filePath = `${docsDir}/${fileName}`;
    
    await PDFDocument.create(filePath)
      .addPages(page)
      .write();
    
    return filePath;
  } catch (error) {
    console.error("[PDFGenerator] Error generating PDF:", error);
    throw new Error(`Не удалось создать PDF: ${error instanceof Error ? error.message : String(error)}`);
  }
}
