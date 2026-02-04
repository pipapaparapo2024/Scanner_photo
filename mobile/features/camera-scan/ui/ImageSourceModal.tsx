import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity } from "react-native";
import { Camera, Image as ImageIcon, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../../app/providers/ThemeProvider";

interface ImageSourceModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCamera: () => void;
  onSelectGallery: () => void;
}

/**
 * Модальное окно выбора источника изображения
 * Позволяет выбрать: сделать фото или выбрать из галереи
 */
export function ImageSourceModal({
  visible,
  onClose,
  onSelectCamera,
  onSelectGallery,
}: ImageSourceModalProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{t("camera.select_source")}</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={24} color={theme.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                onSelectCamera();
                onClose();
              }}
              testID="e2e-source-camera"
              accessibilityLabel={t("camera.take_photo")}
              accessibilityHint="Открывает камеру для съемки"
              accessibilityRole="button"
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIconWrapper, { backgroundColor: theme.primary }]}>
                  <Camera size={24} color={theme.buttonText} strokeWidth={2} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionText, { color: theme.text }]}>{t("camera.take_photo")}</Text>
                  <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    {t("camera.open_camera")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.option, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => {
                onSelectGallery();
                onClose();
              }}
              testID="e2e-source-gallery"
              accessibilityLabel={t("camera.choose_from_gallery")}
              accessibilityHint="Открывает галерею для выбора фото"
              accessibilityRole="button"
            >
              <View style={styles.optionContent}>
                <View style={[styles.optionIconWrapper, { backgroundColor: theme.primary }]}>
                  <ImageIcon size={24} color={theme.buttonText} strokeWidth={2} />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[styles.optionText, { color: theme.text }]}>{t("camera.choose_from_gallery")}</Text>
                  <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                    {t("camera.choose_photo")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    maxWidth: 400,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  optionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  optionTextContainer: {
    alignItems: "flex-start",
    justifyContent: "center",
    flex: 1,
  },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 12,
  },
});
