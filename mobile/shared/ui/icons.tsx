import React from "react";
import { View, StyleSheet } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

/**
 * Иконки для приложения (без цветные SVG-подобные компоненты)
 */

interface IconProps {
  size?: number;
  color?: string;
}

/**
 * Иконка камеры (lucide-react style) - прямоугольник с кругом в правом верхнем углу
 */
export function CameraIcon({ size = 80, color }: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;
  const scale = size / 80;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* Прямоугольник камеры */}
      <View style={[styles.cameraRect, { 
        borderColor: iconColor, 
        width: 50 * scale, 
        height: 40 * scale,
        borderWidth: 2.5 * scale,
        borderRadius: 3 * scale,
      }]}>
        {/* Круг объектива в правом верхнем углу */}
        <View style={[styles.cameraLens, { 
          borderColor: iconColor, 
          width: 14 * scale, 
          height: 14 * scale,
          borderRadius: 7 * scale,
          borderWidth: 2.5 * scale,
          top: -7 * scale,
          right: -7 * scale,
        }]} />
        {/* Внутренний круг объектива */}
        <View style={[styles.cameraLensInner, { 
          backgroundColor: iconColor,
          width: 6 * scale,
          height: 6 * scale,
          borderRadius: 3 * scale,
          top: -3 * scale,
          right: -3 * scale,
        }]} />
      </View>
    </View>
  );
}

/**
 * Иконка документа/файла (FileType из lucide-react style)
 */
export function DocumentIcon({ size = 80, color }: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;
  const scale = size / 80;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* Документ */}
      <View style={[styles.document, { 
        borderColor: iconColor, 
        width: 45 * scale, 
        height: 60 * scale,
        borderWidth: 2.5 * scale,
        borderRadius: 3 * scale,
        padding: 8 * scale,
        paddingTop: 12 * scale,
      }]}>
        {/* Загнутый угол */}
        <View style={[styles.documentCorner, { 
          borderTopColor: iconColor, 
          borderRightColor: iconColor,
          width: 12 * scale,
          height: 12 * scale,
          borderTopWidth: 2.5 * scale,
          borderRightWidth: 2.5 * scale,
          top: -2.5 * scale,
          right: -2.5 * scale,
        }]} />
        {/* Буква "A" или линии текста */}
        <View style={[styles.fileTypeA, { borderColor: iconColor, borderWidth: 2 * scale }]}>
          <View style={[styles.fileTypeALine, { backgroundColor: iconColor, width: 2 * scale }]} />
        </View>
      </View>
    </View>
  );
}

/**
 * Иконка сканирования (рука с пальцем)
 */
export function ScanHandIcon({ size = 80, color }: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* Упрощенная иконка - прямоугольник с указательным пальцем */}
      <View style={[styles.scanIcon, { borderColor: iconColor, backgroundColor: "transparent" }]}>
        {/* Прямоугольник (экран/документ) */}
        <View style={[styles.scanRect, { borderColor: iconColor }]} />
        {/* Указательный палец (круг с линией) */}
        <View style={[styles.fingerPoint, { borderColor: iconColor }]} />
      </View>
    </View>
  );
}

/**
 * Иконка документа с пользователем (для "Получи результат")
 */
export function StarIcon({ size = 80, color }: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* Документ с загнутым углом */}
      <View style={[styles.resultDocument, { borderColor: iconColor, backgroundColor: "transparent" }]}>
        {/* Загнутый угол */}
        <View style={[styles.resultDocumentCorner, { borderTopColor: iconColor, borderRightColor: iconColor }]} />
        {/* Иконка пользователя внутри */}
        <View style={[styles.documentUser, { borderColor: iconColor, backgroundColor: "transparent" }]}>
          {/* Голова */}
          <View style={[styles.userHead, { borderColor: iconColor, backgroundColor: "transparent" }]} />
          {/* Тело */}
          <View style={[styles.userBody, { borderColor: iconColor, backgroundColor: "transparent" }]} />
        </View>
      </View>
    </View>
  );
}

/**
 * Иконка экспорта/загрузки (Download из lucide-react style) - стрелка вниз с линией сверху
 */
export function ExportIcon({ size = 80, color }: IconProps) {
  const { theme } = useTheme();
  const iconColor = color || theme.text;
  const scale = size / 80;

  return (
    <View style={[styles.icon, { width: size, height: size }]}>
      {/* Горизонтальная линия сверху */}
      <View style={[styles.downloadLine, { 
        backgroundColor: iconColor,
        width: 24 * scale,
        height: 2.5 * scale,
        top: 20 * scale,
        left: (size - 24 * scale) / 2,
      }]} />
      {/* Стрелка вниз (треугольник) */}
      <View style={[styles.downloadArrow, { 
        borderTopColor: iconColor,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopWidth: 10 * scale,
        borderLeftWidth: 6 * scale,
        borderRightWidth: 6 * scale,
        top: 25 * scale,
        left: (size - 12 * scale) / 2,
      }]} />
      {/* Вертикальная линия */}
      <View style={[styles.downloadVerticalLine, { 
        backgroundColor: iconColor,
        width: 2.5 * scale,
        height: 12 * scale,
        top: 35 * scale,
        left: (size - 2.5 * scale) / 2,
      }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  icon: {
    justifyContent: "center",
    alignItems: "center",
  },
  // Camera Icon (lucide-react style)
  cameraRect: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraLens: {
    position: "absolute",
    backgroundColor: "transparent",
  },
  cameraLensInner: {
    position: "absolute",
  },
  // Document Icon (FileType style)
  document: {
    position: "relative",
    backgroundColor: "transparent",
  },
  documentCorner: {
    position: "absolute",
    borderTopRightRadius: 3,
  },
  fileTypeA: {
    borderRadius: 2,
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  fileTypeALine: {
    position: "absolute",
  },
  // Scan Hand Icon (упрощенная версия)
  scanIcon: {
    width: 50,
    height: 50,
    position: "relative",
  },
  scanRect: {
    width: 40,
    height: 50,
    borderWidth: 2,
    borderRadius: 4,
    position: "absolute",
    bottom: 0,
    left: 5,
  },
  fingerPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    position: "absolute",
    top: 5,
    right: 10,
  },
  // Star Icon (документ с пользователем)
  resultDocument: {
    width: 50,
    height: 65,
    borderWidth: 3,
    borderRadius: 4,
    position: "relative",
  },
  resultDocumentCorner: {
    width: 15,
    height: 15,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 4,
    position: "absolute",
    top: -3,
    right: -3,
  },
  documentUser: {
    width: 30,
    height: 35,
    position: "absolute",
    left: 10,
    top: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  userHead: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    marginBottom: 2,
  },
  userBody: {
    width: 20,
    height: 12,
    borderWidth: 2,
    borderRadius: 10,
    borderTopWidth: 0,
  },
  // Export Icon (Download style)
  downloadLine: {
    position: "absolute",
    borderRadius: 1,
  },
  downloadArrow: {
    position: "absolute",
    width: 0,
    height: 0,
  },
  downloadVerticalLine: {
    position: "absolute",
    borderRadius: 1,
  },
});

