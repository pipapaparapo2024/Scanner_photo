/**
 * DOCX Generator
 * Генерация DOCX документов из текста скана
 */

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import RNFS from "react-native-fs";
import type { ScanDoc } from "../../../entities/scan/model/types";

/**
 * Генерация DOCX документа из скана
 */
export async function generateDOCX(scan: ScanDoc): Promise<string> {
  try {
    // Форматируем дату
    const scanDate = new Date(scan.scanDate);
    const formattedDate = scanDate.toLocaleDateString("ru-RU", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const children: Paragraph[] = [];

    // Заголовок
    children.push(
      new Paragraph({
        text: `Скан от ${formattedDate}`,
        heading: HeadingLevel.HEADING_1,
        spacing: { after: 200 },
      })
    );

    // Метаданные
    if (scan.category) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Категория: ${scan.category}`,
              size: 20,
              color: "808080",
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    if (scan.tags && scan.tags.length > 0) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Теги: ${scan.tags.join(", ")}`,
              size: 20,
              color: "808080",
            }),
          ],
          spacing: { after: 200 },
        })
      );
    }

    // Разделитель
    children.push(
      new Paragraph({
        text: "─────────────────────────────────────",
        spacing: { after: 200 },
      })
    );

    // Текст скана
    const text = scan.extractedText || "";
    // Разбиваем текст на параграфы по переносам строк
    const paragraphs = text.split(/\n+/).filter((p) => p.trim().length > 0);
    
    for (const para of paragraphs) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: para.trim(),
              size: 24, // 12pt
            }),
          ],
          spacing: { after: 120 },
        })
      );
    }

    // Комментарий если есть
    if (scan.comment) {
      children.push(
        new Paragraph({
          text: "Комментарий:",
          spacing: { before: 400, after: 100 },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: scan.comment,
              size: 22, // 11pt
            }),
          ],
        })
      );
    }

    // Создаем документ
    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
      // Минимум метаданных для оптимизации размера
      creator: "",
      title: "",
    });

    // Конвертируем в буфер
    const buffer = await Packer.toBuffer(doc);

    // Сохраняем во временную папку
    const fileName = `scan_${scan.scanId}_${Date.now()}.docx`;
    const filePath = `${RNFS.CachesDirectoryPath}/${fileName}`;
    
    // Конвертируем буфер в base64 для сохранения
    // Buffer в React Native работает через polyfill
    const base64 = buffer.toString("base64");
    await RNFS.writeFile(filePath, base64, "base64");
    
    return filePath;
  } catch (error) {
    console.error("[DOCXGenerator] Error generating DOCX:", error);
    throw new Error(`Не удалось создать DOCX: ${error instanceof Error ? error.message : String(error)}`);
  }
}
