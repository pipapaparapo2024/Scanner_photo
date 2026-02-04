import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from "react-native";
import { Trash2, X } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

interface DeleteConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  message?: string;
}

/**
 * Красивое модальное окно для подтверждения удаления
 */
export function DeleteConfirmModal({
  visible,
  onConfirm,
  onCancel,
  title = "Удалить скан?",
  message = "Вы уверены, что хотите удалить этот скан? Это действие нельзя отменить.",
}: DeleteConfirmModalProps) {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, scaleAnim, opacityAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
      accessibilityViewIsModal={true}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
        accessibilityLabel="Закрыть диалог"
        accessibilityRole="button"
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View 
              style={[styles.modalContent, { backgroundColor: theme.surface }]}
              accessibilityRole="alert"
            >
              {/* Кнопка закрытия */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Закрыть"
                accessibilityRole="button"
              >
                <X size={20} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>

              {/* Иконка */}
              <View 
                style={[styles.iconContainer, { backgroundColor: `${theme.error}15` }]}
                accessibilityLabel="Иконка удаления"
              >
                <Trash2 size={32} color={theme.error} strokeWidth={2} />
              </View>

              {/* Заголовок */}
              <Text 
                style={[styles.title, { color: theme.text }]}
                accessibilityRole="header"
              >
                {title}
              </Text>

              {/* Сообщение */}
              <Text style={[styles.message, { color: theme.textSecondary }]}>{message}</Text>

              {/* Кнопки */}
              <View style={styles.buttonsContainer}>
                <TouchableOpacity
                  style={[styles.cancelButton, { borderColor: theme.border }]}
                  onPress={onCancel}
                  accessibilityLabel="Отмена"
                  accessibilityHint="Закрывает диалог без удаления"
                  accessibilityRole="button"
                >
                  <Text style={[styles.cancelButtonText, { color: theme.text }]}>Отмена</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteButton, { backgroundColor: theme.error }]}
                  onPress={onConfirm}
                  accessibilityLabel="Удалить"
                  accessibilityHint="Подтверждает удаление"
                  accessibilityRole="button"
                >
                  <Text style={[styles.deleteButtonText, { color: theme.buttonText }]}>Удалить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
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
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    paddingTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
