/**
 * Cloud Storage Settings Page
 * Страница настроек облачного хранилища
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Cloud, CheckCircle, XCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import { showToast } from "../../shared/ui/Toast";
import { ConfirmModal } from "../../shared/ui/ConfirmModal";
import type { RootStackParamList } from "../../app/router/types";
import {
  getCloudStorageSettings,
  saveCloudStorageSettings,
  type CloudStorageSettings,
} from "../../shared/lib/cloud-storage/settingsStorage";
import {
  authenticateGoogleDrive,
  disconnectGoogleDrive,
  initGoogleSignIn,
  getGoogleDriveAccessToken,
} from "../../shared/lib/cloud-storage/googleDriveAuth";
import {
  authenticateYandexDisk,
  disconnectYandexDisk,
  initYandexOAuth,
  getYandexDiskAccessToken,
} from "../../shared/lib/cloud-storage/yandexDiskAuth";
import {
  getFolders,
  checkAvailability,
  type CloudService,
} from "../../shared/lib/cloud-storage/cloudStorageClient";
import { getSyncWorker } from "../../shared/lib/sync-queue/syncWorker";
import { getTaskCounts } from "../../shared/lib/sync-queue/syncQueue";
import { syncExistingScans } from "../../shared/lib/cloud-storage/syncExistingScans";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CloudStorageSettings">;

export function CloudStorageSettingsPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [settings, setSettings] = useState<CloudStorageSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [folders, setFolders] = useState<Array<{ id?: string; path?: string; name: string }>>([]);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [taskCounts, setTaskCounts] = useState({ pending: 0, failed: 0, total: 0 });
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmAction, setConfirmAction] = useState<"disconnect" | "sync" | null>(null);

  useEffect(() => {
    loadSettings();
    loadTaskCounts();
  }, []);

  const loadSettings = async () => {
    try {
      const currentSettings = await getCloudStorageSettings();
      setSettings(currentSettings);
      
      // Если есть подключенный сервис, загружаем папки
      if (currentSettings.service) {
        await loadFolders(currentSettings.service);
      }
    } catch (error) {
      console.error("[CloudStorageSettings] Failed to load settings:", error);
      showToast(t("cloud_storage.load_settings_error"), "error");
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async (service: CloudService) => {
    try {
      setLoadingFolders(true);
      const available = await checkAvailability(service);
      if (!available) {
        showToast(t("cloud_storage.availability_error"), "error");
        return;
      }
      
      const foldersList = await getFolders(service);
      setFolders(foldersList);
    } catch (error) {
      console.error("[CloudStorageSettings] Failed to load folders:", error);
      showToast(t("cloud_storage.load_folders_error"), "error");
    } finally {
      setLoadingFolders(false);
    }
  };

  const loadTaskCounts = async () => {
    try {
      const counts = await getTaskCounts();
      setTaskCounts(counts);
    } catch (error) {
      console.error("[CloudStorageSettings] Failed to load task counts:", error);
    }
  };

  const handleConnectGoogleDrive = async () => {
    try {
      setConnecting("google-drive");
      
      // Инициализируем Google Sign-In (нужно получить webClientId из конфига)
      // TODO: Добавить webClientId в конфигурацию приложения
      const webClientId = ""; // Должен быть получен из конфига
      if (!webClientId) {
        showToast(t("cloud_storage.google_drive_setup_error"), "error");
        return;
      }
      
      await initGoogleSignIn(webClientId);
      await authenticateGoogleDrive();
      
      // Обновляем настройки
      await saveCloudStorageSettings({ service: "google-drive" });
      await loadSettings();
      
      showToast(t("cloud_storage.connect_success", { service: "Google Drive" }), "success");
    } catch (error: any) {
      console.error("[CloudStorageSettings] Failed to connect Google Drive:", error);
      showToast(error.message || t("cloud_storage.connect_error"), "error");
    } finally {
      setConnecting(null);
    }
  };

  const handleConnectYandexDisk = async () => {
    try {
      setConnecting("yandex-disk");
      
      // Инициализируем Яндекс OAuth (нужно получить clientId из конфига)
      // TODO: Добавить clientId в конфигурацию приложения
      const clientId = ""; // Должен быть получен из конфига
      if (!clientId) {
        showToast(t("cloud_storage.yandex_disk_setup_error"), "error");
        return;
      }
      
      initYandexOAuth(clientId);
      await authenticateYandexDisk();
      
      // Обновляем настройки
      await saveCloudStorageSettings({ service: "yandex-disk" });
      await loadSettings();
      
      showToast(t("cloud_storage.connect_success", { service: "Яндекс.Диск" }), "success");
    } catch (error: any) {
      console.error("[CloudStorageSettings] Failed to connect Yandex Disk:", error);
      showToast(error.message || t("cloud_storage.connect_error"), "error");
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = async () => {
    setConfirmAction("disconnect");
    setConfirmModalVisible(true);
  };

  const executeDisconnect = async () => {
    try {
      if (settings?.service === "google-drive") {
        await disconnectGoogleDrive();
      } else if (settings?.service === "yandex-disk") {
        await disconnectYandexDisk();
      }
      
      await saveCloudStorageSettings({
        service: null,
        autoSyncEnabled: false,
      });
      
      await loadSettings();
      showToast(t("cloud_storage.disconnect_success"), "success");
    } catch (error: any) {
      showToast(error.message || t("common.error"), "error");
    } finally {
      setConfirmModalVisible(false);
      setConfirmAction(null);
    }
  };
  
  const handleSyncExisting = () => {
    setConfirmAction("sync");
    setConfirmModalVisible(true);
  };

  const executeSyncExisting = async () => {
    try {
      setConfirmModalVisible(false);
      setConfirmAction(null);
      await syncExistingScans();
      await loadTaskCounts();
    } catch (error) {
      // Ошибка уже показана в syncExistingScans
    }
  };

  const handleToggleAutoSync = async (enabled: boolean) => {
    try {
      await saveCloudStorageSettings({ autoSyncEnabled: enabled });
      setSettings((prev) => (prev ? { ...prev, autoSyncEnabled: enabled } : null));
      
      // Запускаем воркер если включили автосинхронизацию
      if (enabled) {
        const worker = getSyncWorker();
        await worker.start();
      }
    } catch (error) {
      showToast(t("common.error"), "error");
    }
  };

  const handleSelectFormat = async (format: "pdf" | "docx") => {
    try {
      await saveCloudStorageSettings({ defaultFormat: format });
      setSettings((prev) => (prev ? { ...prev, defaultFormat: format } : null));
    } catch (error) {
      showToast(t("common.error"), "error");
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!settings) {
    return null;
  }

  const isConnected = settings.service !== null;
  const isGoogleDrive = settings.service === "google-drive";
  const isYandexDisk = settings.service === "yandex-disk";

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.borderColor }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>{t("cloud_storage.title")}</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* Статус подключения */}
        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("cloud_storage.status")}</Text>
          <View style={styles.statusRow}>
            {isConnected ? (
              <>
                <CheckCircle size={20} color="#4CAF50" />
                <Text style={[styles.statusText, { color: theme.text }]}>
                  {t("cloud_storage.connected", { service: isGoogleDrive ? "Google Drive" : "Яндекс.Диск" })}
                </Text>
              </>
            ) : (
              <>
                <XCircle size={20} color="#F44336" />
                <Text style={[styles.statusText, { color: theme.text }]}>{t("cloud_storage.not_connected")}</Text>
              </>
            )}
          </View>

          {/* Статистика синхронизации */}
          {taskCounts.total > 0 && (
            <View style={styles.statsRow}>
              <Text style={[styles.statsText, { color: theme.textSecondary }]}>
                {t("cloud_storage.queue", { pending: taskCounts.pending, failed: taskCounts.failed })}
              </Text>
            </View>
          )}
        </View>

        {/* Подключение сервисов */}
        {!isConnected && (
          <View style={[styles.section, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("cloud_storage.connect")}</Text>
            
            <TouchableOpacity
              style={[styles.serviceButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
              onPress={handleConnectGoogleDrive}
              disabled={connecting !== null}
            >
              {connecting === "google-drive" ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Cloud size={20} color={theme.text} />
                  <Text style={[styles.serviceButtonText, { color: theme.text }]}>Google Drive</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.serviceButton, { backgroundColor: theme.background, borderColor: theme.borderColor }]}
              onPress={handleConnectYandexDisk}
              disabled={connecting !== null}
            >
              {connecting === "yandex-disk" ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <>
                  <Cloud size={20} color={theme.text} />
                  <Text style={[styles.serviceButtonText, { color: theme.text }]}>Яндекс.Диск</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Настройки синхронизации */}
        {isConnected && (
          <>
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("cloud_storage.auto_sync")}</Text>
              <View style={styles.settingRow}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>
                  {t("cloud_storage.autosync_description")}
                </Text>
                <Switch
                  value={settings.autoSyncEnabled}
                  onValueChange={handleToggleAutoSync}
                  trackColor={{ false: theme.borderColor, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Формат по умолчанию */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>{t("cloud_storage.file_format_title")}</Text>
              <View style={styles.formatButtons}>
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    {
                      backgroundColor: settings.defaultFormat === "pdf" ? theme.primary : theme.background,
                      borderColor: theme.borderColor,
                    },
                  ]}
                  onPress={() => handleSelectFormat("pdf")}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      { color: settings.defaultFormat === "pdf" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    PDF
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.formatButton,
                    {
                      backgroundColor: settings.defaultFormat === "docx" ? theme.primary : theme.background,
                      borderColor: theme.borderColor,
                    },
                  ]}
                  onPress={() => handleSelectFormat("docx")}
                >
                  <Text
                    style={[
                      styles.formatButtonText,
                      { color: settings.defaultFormat === "docx" ? "#FFFFFF" : theme.text },
                    ]}
                  >
                    DOCX
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Синхронизировать существующие сканы */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.syncButton, { backgroundColor: theme.primary }]}
                onPress={handleSyncExisting}
              >
                <Text style={styles.syncButtonText}>{t("cloud_storage.sync_existing_scans_title")}</Text>
              </TouchableOpacity>
            </View>

            {/* Отключить */}
            <View style={[styles.section, { backgroundColor: theme.surface }]}>
              <TouchableOpacity
                style={[styles.disconnectButton, { borderColor: "#F44336", borderWidth: 1, backgroundColor: "transparent" }]}
                onPress={handleDisconnect}
              >
                <Text style={[styles.disconnectButtonText, { color: "#F44336" }]}>
                  {t("cloud_storage.disconnect_button")}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>

      <ConfirmModal
        visible={confirmModalVisible}
        onCancel={() => {
          setConfirmModalVisible(false);
          setConfirmAction(null);
        }}
        onConfirm={confirmAction === "disconnect" ? executeDisconnect : executeSyncExisting}
        title={
          confirmAction === "disconnect"
            ? t("cloud_storage.disconnect_confirm_title")
            : t("cloud_storage.sync_existing_scans_title")
        }
        message={
          confirmAction === "disconnect"
            ? t("cloud_storage.disconnect_confirm_message")
            : t("cloud_storage.sync_existing_scans_message")
        }
        confirmText={
          confirmAction === "disconnect"
            ? t("cloud_storage.disconnect_button")
            : t("cloud_storage.sync_button")
        }
        cancelText={t("common.cancel")}
        type={confirmAction === "disconnect" ? "danger" : "info"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    flex: 1,
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusText: {
    fontSize: 14,
  },
  statsRow: {
    marginTop: 8,
  },
  statsText: {
    fontSize: 12,
  },
  serviceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  serviceButtonText: {
    fontSize: 16,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingLabel: {
    fontSize: 14,
    flex: 1,
    marginRight: 12,
  },
  formatButtons: {
    flexDirection: "row",
    gap: 12,
  },
  formatButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  formatButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  disconnectButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  disconnectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  syncButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  syncButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
