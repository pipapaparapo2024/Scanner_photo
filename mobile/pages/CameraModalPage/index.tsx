import React from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft } from "lucide-react-native";
import { CameraScanner } from "../../features/camera-scan/ui/CameraScanner";
import { useTheme } from "../../app/providers/ThemeProvider";
import type { RootStackParamList } from "../../app/router/types";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "CameraModal">;

/**
 * Модальный экран камеры
 * Полноэкранный вид с камерой и кнопкой назад
 */
export function CameraModalPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <CameraScanner />
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.surface }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    paddingTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
  },
});

