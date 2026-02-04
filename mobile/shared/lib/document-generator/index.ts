/**
 * Document Generator
 * Единый интерфейс для генерации документов
 */

import { generatePDF } from "./pdfGenerator";
import { generateDOCX } from "./docxGenerator";
import type { ScanDoc } from "../../../entities/scan/model/types";

export type DocumentFormat = "pdf" | "docx";

/**
 * Генерация документа в указанном формате
 */
export async function generateDocument(
  scan: ScanDoc,
  format: DocumentFormat
): Promise<string> {
  switch (format) {
    case "pdf":
      return generatePDF(scan);
    case "docx":
      return generateDOCX(scan);
    default:
      throw new Error(`Неподдерживаемый формат: ${format}`);
  }
}

export { generatePDF, generateDOCX };
