import React from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from "react-native";
import { X } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

interface Option {
  id: string;
  label: string;
  onPress: () => void;
  icon?: React.ReactNode;
}

interface SelectionModalProps {
  visible: boolean;
  onCancel: () => void;
  title: string;
  message?: string;
  options: Option[];
}

/**
 * Generic selection modal (replaces ActionSheet)
 */
export function SelectionModal({
  visible,
  onCancel,
  title,
  message,
  options,
}: SelectionModalProps) {
  const { theme } = useTheme();
  const slideAnim = React.useRef(new Animated.Value(300)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
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
        Animated.timing(slideAnim, {
          toValue: 300,
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
  }, [visible, slideAnim, opacityAnim]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onCancel}
      >
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: opacityAnim,
              transform: [{ translateY: slideAnim }],
              backgroundColor: theme.surface,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              {message && (
                <Text style={[styles.message, { color: theme.textSecondary }]}>
                  {message}
                </Text>
              )}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onCancel}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={20} color={theme.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsContainer}>
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.option,
                    { 
                      borderBottomColor: theme.border,
                      borderBottomWidth: index === options.length - 1 ? 0 : 1 
                    }
                  ]}
                  onPress={() => {
                    option.onPress();
                  }}
                >
                  {option.icon && <View style={styles.optionIcon}>{option.icon}</View>}
                  <Text style={[styles.optionText, { color: theme.text }]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={{ height: 20 }} /> 
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
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
    alignItems: "center",
    position: "relative",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    textAlign: "center",
  },
  closeButton: {
    position: "absolute",
    right: 0,
    top: 0,
  },
  optionsContainer: {
    marginTop: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  optionIcon: {
    marginRight: 12,
  },
  optionText: {
    fontSize: 16,
  },
});
