/**
 * Sync Queue Modal
 * Модалка для уведомления о задачах в очереди синхронизации
 */

import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";
import { Cloud } from "lucide-react-native";

interface SyncQueueModalProps {
  visible: boolean;
  pendingCount: number;
  failedCount: number;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export function SyncQueueModal({
  visible,
  pendingCount,
  failedCount,
  onClose,
  onOpenSettings,
}: SyncQueueModalProps) {
  const { theme } = useTheme();

  const totalCount = pendingCount + failedCount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.surface }]}>
          <View style={styles.iconContainer}>
            <Cloud size={48} color={theme.primary} />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            Синхронизация с облаком
          </Text>

          <Text style={[styles.message, { color: theme.textSecondary }]}>
            {totalCount > 0
              ? `У вас есть ${totalCount} файл${totalCount > 1 ? "ов" : ""} в очереди синхронизации.`
              : "Синхронизация завершена."}
          </Text>

          {pendingCount > 0 && (
            <Text style={[styles.detail, { color: theme.textSecondary }]}>
              Ожидают синхронизации: {pendingCount}
            </Text>
          )}

          {failedCount > 0 && (
            <Text style={[styles.detail, { color: "#F44336" }]}>
              Ошибок: {failedCount}
            </Text>
          )}

          <Text style={[styles.info, { color: theme.textSecondary }]}>
            Синхронизация будет продолжена автоматически при подключении к интернету.
          </Text>

          <View style={styles.buttons}>
            {onOpenSettings && (
              <TouchableOpacity
                style={[styles.settingsButton, { borderColor: theme.borderColor }]}
                onPress={onOpenSettings}
              >
                <Text style={[styles.settingsButtonText, { color: theme.primary }]}>
                  Открыть настройки
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.closeButton, { backgroundColor: theme.primary }]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Понятно</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 20,
  },
  detail: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 4,
  },
  info: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 18,
  },
  buttons: {
    width: "100%",
    gap: 12,
  },
  settingsButton: {
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
