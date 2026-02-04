import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp, NativeStackScreenProps } from "@react-navigation/native-stack";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useCameraScan } from "../../features/camera-scan/model/useCameraScan";
import type { RootStackParamList } from "../../app/router/types";

type Props = NativeStackScreenProps<RootStackParamList, "ScanLoading">;
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ScanLoading">;

/**
 * Экран загрузки при обработке изображения
 */
export function ScanLoadingPage() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Props["route"]>();
  const { theme } = useTheme();
  const { processImage } = useCameraScan();
  const { photoUri } = route.params;
  const processedRef = useRef<string | null>(null);

  useEffect(() => {
    if (processedRef.current === photoUri) return;
    processedRef.current = photoUri;

    const handleProcess = async () => {
      try {
        console.log("ScanLoadingPage: Starting to process image:", photoUri);
        console.log("ScanLoadingPage: photoUri type:", typeof photoUri);
        console.log("ScanLoadingPage: photoUri length:", photoUri?.length);
        
        const result = await processImage(photoUri);
        console.log("ScanLoadingPage: Process completed");
        console.log("ScanLoadingPage: result:", result);
        console.log("ScanLoadingPage: result.scan:", result?.scan);
        console.log("ScanLoadingPage: result.scan?.extractedText length:", result?.scan?.extractedText?.length);
        
        if (result && result.scan && result.scan.extractedText && result.scan.extractedText.trim().length > 0) {
          // Текст успешно отсканирован - переходим на экран результата
          console.log("ScanLoadingPage: Success - navigating to ScanResult");
          navigation.replace("ScanResult", {
            scanId: result.scan.scanId,
            extractedText: result.scan.extractedText,
          });
        } else {
          // Текст не найден или пустой - показываем экран ошибки
          console.log("ScanLoadingPage: Failed - no text found, navigating to ScanError");
          navigation.replace("ScanError");
        }
      } catch (error: any) {
        console.error("ScanLoadingPage: Error caught:", error);
        console.error("ScanLoadingPage: Error message:", error?.message);
        console.error("ScanLoadingPage: Error stack:", error?.stack);
        console.error("ScanLoadingPage: Error string:", String(error));
        
        // Проверяем, это ошибка "текст не найден" или другая ошибка
        const errorMessage = error?.message || String(error);
        console.log("ScanLoadingPage: Error message for check:", errorMessage);
        if (errorMessage.includes("не найден") || errorMessage.includes("не найден") || 
            errorMessage.includes("empty") || errorMessage.includes("No text")) {
          // Текст не найден - показываем экран ошибки
          console.log("ScanLoadingPage: No text found error - navigating to ScanError");
          navigation.replace("ScanError");
        } else {
          // Другая ошибка - показываем экран ошибки с возможностью повторить
          console.log("ScanLoadingPage: Other error - navigating to ScanError");
          navigation.replace("ScanError");
        }
      }
    };

    handleProcess();
  }, [photoUri, processImage, navigation]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

