import React, { useEffect, useState, useCallback, useRef } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput } from "react-native";
import Clipboard from "@react-native-clipboard/clipboard";
import { Copy, Edit2, Save, X, FileText, File, Star } from "lucide-react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { ExportButton } from "../../shared/ui/ExportButton";
import { SelectionModal } from "../../shared/ui/SelectionModal";
import { getScans, updateScanComment, updateScanFavorite } from "../../entities/scan/api/scanApi";
import { ScanCacheService } from "../../shared/lib/cache/scanCache";
import { showToast } from "../../shared/ui/Toast";
import { getCloudStorageSettings } from "../../shared/lib/cloud-storage/settingsStorage";
import { generateDocument } from "../../shared/lib/document-generator";
import { uploadFile } from "../../shared/lib/cloud-storage/cloudStorageClient";
import RNFS from "react-native-fs";
import type { ScanDoc } from "../../entities/scan/model/types";
import type { RootStackParamList } from "../../app/router/types";

/**
 * Экран деталей скана
 */
export function ScanDetailPage() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params as RootStackParamList["ScanDetail"] | undefined;
  const scanId = params?.scanId;
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [scan, setScan] = useState<ScanDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [exportingToCloud, setExportingToCloud] = useState(false);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleCopy = useCallback(() => {
    if (!scan) return;
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(async () => {
      try {
        await Clipboard.setString(scan.extractedText);
        showToast(t("scan_detail.copy_success"), "success");
      } catch (error) {
        showToast(t("scan_detail.copy_error"), "error");
      }
    }, 200);
  }, [scan, t]);

  const handleSaveComment = useCallback(async () => {
    if (!scan) return;
    
    try {
      setSavingComment(true);
      await updateScanComment(scan.scanId, commentText);
      const updatedScan = { ...scan, comment: commentText };
      setScan(updatedScan);
      setIsEditingComment(false);
      
      // Обновляем кэш
      await ScanCacheService.addScan(updatedScan);
      
      showToast(t("scan_detail.comment_saved"), "success");
    } catch (err) {
      showToast(t("scan_detail.comment_save_error"), "error");
    } finally {
      setSavingComment(false);
    }
  }, [scan, commentText, t]);

  const handleToggleFavorite = useCallback(async () => {
    if (!scan) return;
    
    const newStatus = !scan.isFavorite;
    const updatedScan = { ...scan, isFavorite: newStatus };
    // Optimistic update
    setScan(updatedScan);
    
    try {
      await updateScanFavorite(scan.scanId, newStatus);
      // Update cache
      await ScanCacheService.addScan(updatedScan);
      
      showToast(
        newStatus 
          ? t("scan_detail.favorite_added", "Добавлено в избранное") 
          : t("scan_detail.favorite_removed", "Убрано из избранного"), 
        "success"
      );
    } catch (err) {
      // Revert
      setScan(scan);
      showToast(t("errors.favorite_update_failed", "Не удалось обновить статус избранного"), "error");
    }
  }, [scan, t]);

  const handleCancelEdit = useCallback(() => {
    setCommentText(scan?.comment || "");
    setIsEditingComment(false);
  }, [scan]);

  const handleExportToCloud = useCallback(async () => {
    if (!scan) return;

    try {
      setExportingToCloud(true);

      // Проверяем настройки облака
      const settings = await getCloudStorageSettings();

      if (!settings.service) {
        showToast(t("scan_detail.cloud_not_configured"), "error");
        // Можно открыть настройки
        return;
      }

      // Показываем выбор формата
      setSelectionModalVisible(true);
    } catch (error) {
      console.error("[ScanDetailPage] Failed to export to cloud:", error);
      showToast(t("scan_detail.export_error"), "error");
    } finally {
      setExportingToCloud(false);
    }
  }, [scan, t]);

  const handleFormatSelect = async (format: "pdf" | "docx") => {
    setSelectionModalVisible(false);
    if (!scan) return;

    try {
      setExportingToCloud(true);
      const settings = await getCloudStorageSettings();
      
      await exportScan(scan, format, settings);
    } catch (error) {
      console.error("[ScanDetailPage] Export failed:", error);
      showToast(t("scan_detail.export_error"), "error");
    } finally {
      setExportingToCloud(false);
    }
  };

  const exportScan = async (
    scanData: ScanDoc,
    format: "pdf" | "docx",
    settings: any
  ) => {
    try {
      showToast(t("scan_detail.generating"), "info");

      // Генерируем документ
      const filePath = await generateDocument(scanData, format);

      // Формируем имя файла
      const scanDate = new Date(scanData.scanDate);
      const dateStr = scanDate.toISOString().split("T")[0];
      const fileName = `${dateStr}_scan_${scanData.scanId}.${format}`;

      showToast(t("scan_detail.uploading"), "info");

      // Загружаем в облако
      await uploadFile(
        settings.service,
        filePath,
        fileName,
        settings.folderId,
        settings.folderPath
      );

      showToast(t("scan_detail.export_success"), "success");

      // Удаляем временный файл
      try {
        await RNFS.unlink(filePath);
      } catch (e) {
        console.warn("[ScanDetailPage] Failed to delete temp file:", e);
      }
    } catch (error) {
      console.error("[ScanDetailPage] Export failed:", error);
      showToast(
        `${t("scan_detail.export_error")}: ${error instanceof Error ? error.message : String(error)}`,
        "error"
      );
    }
  };

  useEffect(() => {
    if (!scanId) {
      setError(t("scan_detail.scan_not_found"));
      setLoading(false);
      return;
    }

    const loadScan = async () => {
      try {
        setLoading(true);
        const response = await getScans(100); // Загружаем больше для поиска
        const scans = response.scans || [];
        const foundScan = scans.find((s) => s.scanId === scanId);
        if (foundScan) {
          setScan(foundScan);
          setCommentText(foundScan.comment || "");
        } else {
          setError(t("scan_detail.scan_not_found"));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("scan_detail.loading_error"));
      } finally {
        setLoading(false);
      }
    };

    loadScan();
  }, [scanId]);

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (error || !scan) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.error }]}>{error || t("scan_detail.scan_not_found")}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {scan.scanDate && !isNaN(new Date(scan.scanDate).getTime()) 
            ? new Date(scan.scanDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })
            : t("common.unknown_date")}
        </Text>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.copyButton, { backgroundColor: theme.primary }]}
            onPress={handleCopy}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={t("scan_detail.copy_label")}
            accessibilityHint={t("scan_detail.copy_hint")}
            accessibilityRole="button"
          >
            <Copy size={20} color={theme.buttonText} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.exportButtonWrapper}>
            <ExportButton text={scan.extractedText} scanDate={scan.scanDate} size={20} />
          </View>
        </View>
      </View>
      
      {/* Комментарий */}
      <View style={[styles.commentSection, { backgroundColor: theme.surface }]}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentTitle, { color: theme.text }]}>{t("scan_detail.comment_title")}</Text>
          {!isEditingComment ? (
            <TouchableOpacity
              onPress={() => setIsEditingComment(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel={t("scan_detail.edit_comment_label")}
              accessibilityRole="button"
            >
              <Edit2 size={18} color={theme.primary} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.commentActions}>
              <TouchableOpacity
                onPress={handleSaveComment}
                disabled={savingComment}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel={t("scan_detail.save_comment_label")}
                accessibilityRole="button"
                accessibilityState={{ disabled: savingComment }}
              >
                <Save size={18} color={theme.primary} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleCancelEdit}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={{ marginLeft: 12 }}
                accessibilityLabel={t("scan_detail.cancel_edit_label")}
                accessibilityRole="button"
              >
                <X size={18} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {isEditingComment ? (
          <TextInput
            style={[styles.commentInput, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
            placeholder={t("scan_detail.comment_placeholder")}
            placeholderTextColor={theme.textSecondary}
            value={commentText}
            onChangeText={setCommentText}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            textBreakStrategy="simple"
          />
        ) : (
          <Text style={[styles.commentText, { color: scan.comment ? theme.text : theme.textSecondary }]}>
            {scan.comment || t("scan_detail.no_comment")}
          </Text>
        )}
      </View>

      <View style={[styles.textContainer, { backgroundColor: theme.surface }]}>
        <Text style={[styles.text, { color: theme.text }]}>
          {scan.extractedText}
        </Text>
      </View>

      <SelectionModal
        visible={selectionModalVisible}
        onCancel={() => setSelectionModalVisible(false)}
        title={t("scan_detail.export_cloud_title")}
        message={t("scan_detail.export_format_message")}
        options={[
          {
            id: "pdf",
            label: "PDF",
            icon: <File size={24} color={theme.text} />,
            onPress: () => handleFormatSelect("pdf"),
          },
          {
            id: "docx",
            label: "DOCX",
            icon: <FileText size={24} color={theme.text} />,
            onPress: () => handleFormatSelect("docx"),
          },
        ]}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingTop: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  date: {
    fontSize: 14,
    flex: 1,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  exportButtonWrapper: {
    marginLeft: 4,
  },
  cloudButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  textContainer: {
    borderRadius: 8,
    padding: 15,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  commentSection: {
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
  },
  commentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  commentTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    maxHeight: 120,
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
    fontStyle: "italic",
  },
});

