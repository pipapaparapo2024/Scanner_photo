import TextRecognition, { TextRecognitionScript } from "@react-native-ml-kit/text-recognition";

/**
 * Интеграция с Google ML Kit для распознавания текста
 */

/**
 * Распознать текст с изображения
 * @param imagePath - URI изображения: file:///path или content://...
 */
/**
 * Распознать текст с изображения
 * Поддерживает русский (кириллица) и латинский текст
 * @param imagePath - URI изображения: file:///path или content://...
 */
export async function recognizeText(imagePath: string): Promise<string> {
  if (!imagePath || typeof imagePath !== "string") {
    throw new Error("Неверный путь к изображению");
  }

  try {
    console.log("ML Kit: recognize, URI length:", imagePath.length);
    
    // ML Kit с LATIN скриптом поддерживает кириллицу (русский текст)
    // LATIN скрипт в ML Kit автоматически распознает как латиницу, так и кириллицу
    const result = await TextRecognition.recognize(
      imagePath,
      TextRecognitionScript.LATIN,
    );

    // Сначала пытаемся получить текст из result.text
    let raw = result?.text;
    let extracted =
      raw && raw !== "null" && typeof raw === "string" && raw.trim().length > 0
        ? raw.trim()
        : "";

    // Для кириллицы всегда собираем текст из блоков, даже если result.text не пустой
    // Это улучшает качество распознавания русского текста
    const blockTexts: string[] = [];
    
    if (result?.blocks && Array.isArray(result.blocks) && result.blocks.length > 0) {
      // Собираем текст из всех блоков, строк и элементов
      for (const block of result.blocks) {
        if (block && typeof block === "object") {
          // Пытаемся получить текст из блока
          if (block.text && typeof block.text === "string" && block.text.trim()) {
            blockTexts.push(block.text.trim());
          }
          
          // Также проверяем lines внутри блока
          if (block.lines && Array.isArray(block.lines)) {
            for (const line of block.lines) {
              if (line && typeof line === "object") {
                if (line.text && typeof line.text === "string" && line.text.trim()) {
                  blockTexts.push(line.text.trim());
                }
                
                // И elements внутри строки (самый детальный уровень)
                if (line.elements && Array.isArray(line.elements)) {
                  for (const element of line.elements) {
                    if (element && typeof element === "object") {
                      if (element.text && typeof element.text === "string" && element.text.trim()) {
                        blockTexts.push(element.text.trim());
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    
    // Объединяем все найденные тексты, убирая дубликаты
    const uniqueTexts = Array.from(new Set(blockTexts));
    const blockExtracted = uniqueTexts.join("\n").trim();
    
    // Для кириллицы приоритет отдаем блокам, так как они содержат более точную информацию
    // Если блоки содержат больше текста или result.text слишком короткий, используем блоки
    if (blockExtracted.length > 0) {
      // Если блоки дали результат, объединяем с result.text для максимальной полноты
      if (extracted.length > 0) {
        // Объединяем оба результата, убирая дубликаты
        const combined = [extracted, blockExtracted].filter(Boolean);
        const allUnique = Array.from(new Set(combined.join("\n").split("\n").map(t => t.trim()).filter(Boolean)));
        extracted = allUnique.join("\n").trim();
      } else {
        extracted = blockExtracted;
      }
    }
    
    // Если результат все еще пустой, пробуем собрать из всех доступных источников
    if (!extracted || extracted.length < 3) {
      // Дополнительная проверка: собираем все текстовые фрагменты из всех уровней
      const allTexts: string[] = [];
      if (result?.text && result.text.trim()) {
        allTexts.push(result.text.trim());
      }
      if (result?.blocks) {
        for (const block of result.blocks) {
          if (block?.text) allTexts.push(block.text.trim());
          if (block?.lines) {
            for (const line of block.lines) {
              if (line?.text) allTexts.push(line.text.trim());
              if (line?.elements) {
                for (const element of line.elements) {
                  if (element?.text) allTexts.push(element.text.trim());
                }
              }
            }
          }
        }
      }
      const finalUnique = Array.from(new Set(allTexts.filter(Boolean)));
      if (finalUnique.length > 0) {
        extracted = finalUnique.join("\n").trim();
      }
    }

    // Нормализуем текст для правильного отображения кириллицы
    // Убираем возможные проблемы с кодировкой
    let normalizedText = extracted || "";
    if (normalizedText) {
      // Нормализуем Unicode (NFD -> NFC) для правильного отображения
      try {
        normalizedText = normalizedText.normalize("NFC");
      } catch (e) {
        console.warn("ML Kit: Failed to normalize text, using as-is");
      }
    }

    console.log("ML Kit: extracted length:", normalizedText.length);
    console.log("ML Kit: extracted preview:", normalizedText.substring(0, 100));
    
    return normalizedText;
  } catch (e) {
    console.error("ML Kit recognition error:", e);
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      msg.includes("Text recognition") || msg.includes("recognition")
        ? "Не удалось распознать текст. Проверьте освещение и чёткость. Попробуйте ещё раз."
        : "Не удалось распознать текст. Попробуйте ещё раз.",
    );
  }
}

