import { StyleSheet } from "react-native";

/**
 * Общие стили для всех алертов и модальных окон
 * Используется в Toast, DeleteConfirmModal, RatingModal и других компонентах
 */
export const alertStyles = StyleSheet.create({
  // Стили для Toast уведомлений
  toast: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12, // Минимальный отступ слева и справа (одинаковый)
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8, // Отступ справа от крестика (равен отступу слева)
    gap: 10, // Расстояние между иконкой и текстом
    // НЕТ paddingLeft - отступ слева равен paddingHorizontal контейнера
  },
  toastMessage: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },

  // Стили для модальных окон (DeleteConfirmModal, RatingModal)
  modalOverlay: {
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
  modalCloseButton: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
    // НЕТ paddingHorizontal - отступы определяются padding контейнера modalContent
  },
  modalMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
    // НЕТ paddingHorizontal - отступы определяются padding контейнера modalContent
  },
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    // НЕТ paddingHorizontal - отступы определяются padding контейнера modalContent
  },
});
