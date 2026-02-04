import React, { useCallback, useRef, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from "react-native-reanimated";
import Clipboard from "@react-native-clipboard/clipboard";
import { Copy, Trash2, CheckCircle, Circle, Star } from "lucide-react-native";
import { useTheme } from "../../../app/providers/ThemeProvider";
import { showToast } from "../../../shared/ui/Toast";
import { DeleteConfirmModal } from "../../../shared/ui/DeleteConfirmModal";
import type { ScanDoc } from "../../../entities/scan/model/types";

interface ScanHistoryItemProps {
  scan: ScanDoc;
  onPress?: (scan: ScanDoc) => void;
  onDelete?: (scanId: string) => void;
  index?: number; // Индекс для stagger анимации
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onLongPress?: (scan: ScanDoc) => void;
  onToggleSelection?: (scan: ScanDoc) => void;
  onToggleFavorite?: (scan: ScanDoc) => void;
}

/**
 * Элемент списка истории сканов
 */
export function ScanHistoryItem({ 
  scan, 
  onPress, 
  onDelete, 
  index = 0,
  isSelectionMode = false,
  isSelected = false,
  onLongPress,
  onToggleSelection,
  onToggleFavorite
}: ScanHistoryItemProps) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const deleteTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.95);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    // Stagger анимация появления
    fadeAnim.value = withTiming(1, { duration: 300 }, () => {
      runOnJS(() => {})(); // callback if needed
    });
    scaleAnim.value = withSpring(1, { damping: 7, stiffness: 50 });
  }, [index]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const handleCopy = useCallback((e: any) => {
    e.stopPropagation();
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
  }, [scan.extractedText, t]);

  const handleDelete = useCallback((e: any) => {
    e.stopPropagation();
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }
    deleteTimeoutRef.current = setTimeout(() => {
      setShowDeleteModal(true);
    }, 200);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    setShowDeleteModal(false);
    onDelete?.(scan.scanId);
  }, [scan.scanId, onDelete]);

  const handleToggleFavorite = useCallback((e: any) => {
    e.stopPropagation();
    onToggleFavorite?.(scan);
  }, [scan, onToggleFavorite]);

  const handlePress = () => {
    if (isSelectionMode) {
      onToggleSelection?.(scan);
    } else {
      onPress?.(scan);
    }
  };

  const handleLongPress = () => {
    if (!isSelectionMode) {
      onLongPress?.(scan);
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.container, 
          { 
            backgroundColor: isSelected ? `${theme.primary}15` : theme.surface, 
            borderColor: isSelected ? theme.primary : theme.border 
          }
        ]}
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        activeOpacity={0.7}
        accessibilityLabel={`Скан от ${new Date(scan.scanDate).toLocaleDateString("ru-RU")}${scan.comment ? `, комментарий: ${scan.comment}` : ""}`}
        accessibilityHint={isSelectionMode ? "Нажмите для выбора" : "Нажмите для просмотра деталей"}
        accessibilityRole="button"
      >
      {isSelectionMode && (
        <View style={{ marginRight: 12 }}>
          {isSelected ? (
            <CheckCircle size={24} color={theme.primary} fill={theme.surface} />
          ) : (
            <Circle size={24} color={theme.textSecondary} />
          )}
        </View>
      )}
      
      <View style={styles.content}>
        {scan.comment && (
          <Text style={[styles.comment, { color: theme.primary }]} numberOfLines={1}>
            💬 {scan.comment}
          </Text>
        )}
        <Text style={[styles.text, { color: theme.text }]} numberOfLines={3}>
          {scan.extractedText}
        </Text>
        <Text style={[styles.date, { color: theme.textSecondary }]}>
          {new Date(scan.scanDate).toLocaleDateString("ru-RU")}
        </Text>
      </View>
      
      {!isSelectionMode && (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton, 
              { 
                backgroundColor: scan.isFavorite ? theme.primary : "transparent",
                borderColor: theme.primary,
                borderWidth: 1
              }
            ]}
            onPress={handleToggleFavorite}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel={scan.isFavorite ? "Убрать из избранного" : "Добавить в избранное"}
            accessibilityRole="button"
          >
            <Star 
              size={18} 
              color={scan.isFavorite ? theme.buttonText : theme.primary} 
              fill={scan.isFavorite ? theme.buttonText : "transparent"}
              strokeWidth={2} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.primary }]}
            onPress={handleCopy}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Копировать текст"
            accessibilityHint="Копирует распознанный текст в буфер обмена"
            accessibilityRole="button"
          >
            <Copy size={18} color={theme.buttonText} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: theme.error }]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Удалить скан"
            accessibilityHint="Удаляет этот скан из истории"
            accessibilityRole="button"
          >
            <Trash2 size={18} color={theme.buttonText} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      )}
      </TouchableOpacity>
      <DeleteConfirmModal
        visible={showDeleteModal}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: 12,
  },
  comment: {
    fontSize: 12,
    marginBottom: 6,
    fontWeight: "500",
    fontStyle: "italic",
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  // Deprecated but kept for compatibility if used elsewhere (though they seem local)
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
});

