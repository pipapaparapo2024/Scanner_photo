import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { launchImageLibrary, type ImagePickerResponse, type MediaType } from "react-native-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "../../app/providers/ThemeProvider";
import type { RootStackParamList } from "../../app/router/types";
import { showToast } from "../../shared/ui/Toast";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ImagePicker">;

/**
 * Страница выбора изображения из галереи
 */
export function ImagePickerPage() {
  const navigation = useNavigation<NavigationProp>();
  const { theme } = useTheme();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Автоматически открываем галерею при монтировании
    const openGallery = async () => {
      try {
        const options = {
          mediaType: "photo" as MediaType,
          quality: 0.8 as any,
          includeBase64: false,
        };

        launchImageLibrary(options, (response: ImagePickerResponse) => {
          setLoading(false);

          if (response.didCancel) {
            // Пользователь отменил выбор
            navigation.goBack();
            return;
          }

          if (response.errorMessage) {
            showToast(response.errorMessage, "error");
            navigation.goBack();
            return;
          }

          const asset = response.assets?.[0];
          if (asset?.uri) {
            // Форматируем URI для ML Kit
            let photoUri = asset.uri;
            if (!photoUri.startsWith("file://") && !photoUri.startsWith("content://")) {
              photoUri = `file://${photoUri}`;
            }

            // Переходим сразу на обработку, минуя подтверждение
            navigation.navigate("ScanLoading", { photoUri });
          } else {
            showToast(t("image_picker.error_select"), "error");
            navigation.goBack();
          }
        });
      } catch (error) {
        console.error("Failed to open image picker:", error);
        showToast(t("image_picker.error_open"), "error");
        setLoading(false);
        navigation.goBack();
      }
    };

    openGallery();
  }, [navigation, t]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
