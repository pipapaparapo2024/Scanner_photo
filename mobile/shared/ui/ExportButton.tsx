import React, { useState, useCallback, useRef } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Modal, Animated } from "react-native";
import { Share2, FileText, File, Mail } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { exportToTxt, exportToPdf, shareText } from "../lib/export/exportUtils";
import { showToast } from "./Toast";

interface ExportButtonProps {
  text: string;
  scanDate?: Date | string;
  size?: number;
}

/**
 * Кнопка экспорта с выпадающим меню форматов
 */
export function ExportButton({ text, scanDate, size = 22 }: ExportButtonProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handleExportTxt = useCallback(async () => {
    setShowMenu(false);
    setExporting(true);
    try {
      const dateStr = scanDate 
        ? new Date(scanDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const filename = `scan_${dateStr}_${Date.now()}.txt`;
      await exportToTxt(text, filename);
    } catch (error: any) {
      showToast(error.message || t("export.error_txt"), "error");
    } finally {
      setExporting(false);
    }
  }, [text, scanDate, t]);

  const handleExportPdf = useCallback(async () => {
    setShowMenu(false);
    setExporting(true);
    try {
      const dateStr = scanDate 
        ? new Date(scanDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0];
      const filename = `scan_${dateStr}_${Date.now()}.pdf`;
      await exportToPdf(text, filename);
    } catch (error: any) {
      showToast(error.message || t("export.error_pdf"), "error");
    } finally {
      setExporting(false);
    }
  }, [text, scanDate, t]);

  const handleShare = useCallback(async () => {
    setShowMenu(false);
    setExporting(true);
    try {
      await shareText(text, "Результат сканирования");
    } catch (error: any) {
      showToast(error.message || t("export.error_share"), "error");
    } finally {
      setExporting(false);
    }
  }, [text, t]);

  return (
    <>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={() => setShowMenu(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={exporting}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel={t("scan.export")}
          accessibilityHint="Открывает меню вариантов экспорта"
          accessibilityRole="button"
          accessibilityState={{ disabled: exporting }}
        >
          <Share2 size={size} color={theme.buttonText} strokeWidth={2} />
        </TouchableOpacity>
      </Animated.View>

      <Modal
        visible={showMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
        accessibilityViewIsModal={true}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
          accessibilityLabel="Закрыть меню"
          accessibilityRole="button"
        >
          <View 
            style={[styles.menu, { backgroundColor: theme.surface, borderColor: theme.border }]}
            accessibilityRole="menu"
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleExportTxt}
              accessibilityLabel={t("export.txt_menu")}
              accessibilityHint="Сохраняет текст в текстовый файл"
              accessibilityRole="menuitem"
            >
              <FileText size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>{t("export.txt_menu")}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleExportPdf}
              accessibilityLabel={t("export.pdf_menu")}
              accessibilityHint="Сохраняет текст в PDF документ"
              accessibilityRole="menuitem"
            >
              <File size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>{t("export.pdf_menu")}</Text>
            </TouchableOpacity>

            <View style={[styles.separator, { backgroundColor: theme.border }]} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleShare}
              accessibilityLabel={t("export.share_menu")}
              accessibilityHint="Открывает системное меню отправки"
              accessibilityRole="menuitem"
            >
              <Mail size={20} color={theme.text} strokeWidth={2} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                {t("export.share_menu")}
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  menu: {
    minWidth: 250,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
});
