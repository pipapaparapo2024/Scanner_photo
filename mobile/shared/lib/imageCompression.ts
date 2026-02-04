import ImageResizer from "react-native-image-resizer";
import { Platform } from "react-native";

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: "JPEG" | "PNG" | "WEBP";
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 85,
  format: "JPEG",
};

/**
 * Сжать изображение для оптимизации перед обработкой
 * @param imageUri - URI исходного изображения
 * @param options - Опции сжатия
 * @returns URI сжатого изображения
 */
export async function compressImage(
  imageUri: string,
  options: CompressionOptions = {},
): Promise<string> {
  try {
    console.log("ImageCompression: Начало сжатия изображения:", imageUri);
    
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    // Нормализуем URI
    let normalizedUri = imageUri;
    if (!normalizedUri.startsWith("file://") && !normalizedUri.startsWith("content://")) {
      normalizedUri = `file://${normalizedUri}`;
    }

    console.log("ImageCompression: Параметры сжатия:", {
      maxWidth: opts.maxWidth,
      maxHeight: opts.maxHeight,
      quality: opts.quality,
      format: opts.format,
    });

    // Сжимаем изображение
    const resizedImage = await ImageResizer.createResizedImage(
      normalizedUri,
      opts.maxWidth!,
      opts.maxHeight!,
      opts.format!,
      opts.quality!,
      0, // rotation
      undefined, // outputPath (автоматически)
      false, // keepMeta
      {
        mode: "contain" as const, // Сохраняем пропорции
        onlyScaleDown: true, // Уменьшаем только если изображение больше
      },
    );

    console.log("ImageCompression: Изображение сжато:", resizedImage.uri);
    console.log("ImageCompression: Размер:", resizedImage.width, "x", resizedImage.height);

    // Форматируем URI для ML Kit
    let compressedUri = resizedImage.uri;
    if (Platform.OS === "android" && !compressedUri.startsWith("file://")) {
      compressedUri = `file://${compressedUri}`;
    }

    return compressedUri;
  } catch (error) {
    console.error("ImageCompression: Ошибка при сжатии:", error);
    // В случае ошибки возвращаем исходный URI
    console.warn("ImageCompression: Используется исходное изображение без сжатия");
    return imageUri;
  }
}

/**
 * Получить информацию об изображении (размер, формат)
 */
export async function getImageInfo(imageUri: string): Promise<{
  width: number;
  height: number;
  size?: number;
}> {
  try {
    const resizedImage = await ImageResizer.createResizedImage(
      imageUri,
      1, // минимальный размер для получения информации
      1,
      "JPEG",
      100,
      0,
      undefined,
      false,
      {
        mode: "contain",
        onlyScaleDown: false,
      },
    );

    // Для получения реального размера нужно загрузить изображение
    // Пока возвращаем базовую информацию
    return {
      width: resizedImage.width,
      height: resizedImage.height,
    };
  } catch (error) {
    console.error("ImageCompression: Ошибка при получении информации:", error);
    throw error;
  }
}
