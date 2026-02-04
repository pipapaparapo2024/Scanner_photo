import React, { useRef, useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { Camera, useCameraDevice, useCameraPermission } from "react-native-vision-camera";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCameraScan } from "../model/useCameraScan";
import { useTheme } from "../../../app/providers/ThemeProvider";
import type { RootStackParamList } from "../../../app/router/types";
import { useTranslation } from "react-i18next";
import { showToast } from "../../../shared/ui/Toast";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

/**
 * Компонент камеры для сканирования
 * Минимальный UI, фокус на функциональности
 */
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CameraScanner() {
  const camera = useRef<Camera>(null);
  const navigation = useNavigation<NavigationProp>();
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice("back");
  const { processImage, loading, error } = useCameraScan();
  const { theme } = useTheme();
  const { t } = useTranslation();

  // Запрашиваем разрешение на камеру при монтировании
  useEffect(() => {
    if (!hasPermission) {
      requestPermission().catch((err) => {
        console.error("Failed to request camera permission:", err);
        showToast(t("camera.permission_message"), "info");
      });
    }
  }, [hasPermission, requestPermission, t]);

  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const takingRef = useRef(false);

  const takePhoto = React.useCallback(async () => {
    if (!camera.current || !device || isTakingPhoto || loading) return;
    // Синхронная блокировка от двойного нажатия (в т.ч. на эмуляторе)
    if (takingRef.current) return;
    takingRef.current = true;
    setIsTakingPhoto(true);

    const run = async () => {
      try {
        const photo = await camera.current?.takePhoto({ flash: "off" });
        if (photo) {
          const p = photo.path || "";
          const photoUri = (p.startsWith("file://") || p.startsWith("content://")) ? p : `file://${p}`;
          navigation.navigate("PhotoConfirm", { photoUri });
        }
      } catch (err) {
        console.error("Failed to take photo:", err);
        showToast(t("camera.photo_error"), "error");
      } finally {
        takingRef.current = false;
        setIsTakingPhoto(false);
      }
    };

    // Короткая задержка, чтобы отсечь второй тап (особенно на эмуляторе)
    setTimeout(run, 280);
  }, [camera, device, isTakingPhoto, loading, navigation, t]);


  // Показываем экран запроса разрешения
  if (!hasPermission) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>{t("camera.permission_required_title")}</Text>
          <Text style={styles.permissionText}>
            {t("camera.permission_required_text")}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            onPress={() => {
              requestPermission().catch((err) => {
                console.error("Failed to request camera permission:", err);
                showToast(t("camera.permission_denied_message"), "error");
              });
            }}
            accessibilityLabel={t("camera.allow_access")}
            accessibilityRole="button"
          >
            <Text style={[styles.permissionButtonText, { color: theme.buttonText }]}>{t("camera.allow_access")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionTitle}>{t("camera.camera_unavailable_title")}</Text>
          <Text style={styles.permissionText}>
            {t("camera.camera_unavailable_text")}
          </Text>
        </View>
      </View>
    );
  }


  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        <Camera
          ref={camera}
          device={device}
          isActive={true}
          photo={true}
          style={styles.camera}
        />
      </View>
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.captureButton}
          onPress={takePhoto}
          disabled={loading || isTakingPhoto}
          activeOpacity={0.8}
        >
          <View style={styles.captureButtonCircle}>
            <View style={styles.captureButtonInner} />
          </View>
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
  cameraWrapper: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  camera: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 40,
    paddingBottom: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  captureButton: {
    alignItems: "center",
    justifyContent: "center",
  },
  captureButtonCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF",
    borderWidth: 3,
    borderColor: "#000",
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  error: {
    marginTop: 20,
    textAlign: "center",
    color: "#ff6b6b",
    fontSize: 14,
    paddingHorizontal: 20,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  permissionText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  permissionButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 8,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

