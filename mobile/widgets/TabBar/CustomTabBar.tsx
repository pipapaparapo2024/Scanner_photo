import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { View, TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTheme } from "../../app/providers/ThemeProvider";
import { useTranslation } from "react-i18next";
import { Camera } from "lucide-react-native";
import { ImageSourceModal } from "../../features/camera-scan/ui/ImageSourceModal";

// Экспортируем ref для онбординга
export const scanButtonRef = React.createRef<TouchableOpacity>();
export const historyTabRef = React.createRef<TouchableOpacity>();
export const accountTabRef = React.createRef<TouchableOpacity>();

// Простые иконки через View для Истории и Аккаунта
const HistoryIcon = ({ color }: { color: string }) => (
  <View style={styles.iconContainer}>
    <View style={[styles.iconLine, { backgroundColor: color }]} />
    <View style={[styles.iconLine, { backgroundColor: color }]} />
    <View style={[styles.iconLine, { backgroundColor: color }]} />
  </View>
);

// Иконка пользователя для Аккаунта (увеличенная)
const AccountIcon = ({ color }: { color: string }) => (
  <View style={styles.userIcon}>
    <View style={[styles.userHead, { backgroundColor: color }]} />
    <View style={[styles.userBody, { backgroundColor: color }]} />
  </View>
);

interface TabButtonProps {
  route: any;
  index: number;
  descriptors: any;
  state: any;
  navigation: any;
  theme: any;
  onScanPress: () => void;
  isScanProcessing: boolean;
}

const TabButton = ({ 
  route, 
  index, 
  descriptors, 
  state, 
  navigation, 
  theme,
  onScanPress,
  isScanProcessing 
}: TabButtonProps) => {
  const { t } = useTranslation();
  const { options } = descriptors[route.key];
  const isFocused = state.index === index;

  const onPress = useCallback(() => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  }, [navigation, route.key, route.name, isFocused]);

  // Центральная кнопка Scan - открывает модальное окно камеры
  if (index === 1) {
    return (
      <TouchableOpacity
        key={route.key}
        ref={scanButtonRef}
        style={styles.scanButton}
        onPress={onScanPress}
        accessibilityRole="button"
        activeOpacity={0.7}
        disabled={isScanProcessing}
        testID="e2e-tab-scan"
      >
        <View style={styles.scanButtonInner}>
          <Camera size={26} color={isFocused ? theme.tabBarActive : theme.tabBarInactive} strokeWidth={2} />
          <Text
            style={[
              styles.scanButtonLabel,
              { color: isFocused ? theme.tabBarActive : theme.tabBarInactive },
              isFocused && styles.tabLabelActive,
            ]}
          >
            {options.tabBarLabel as string || t("navigation.scan")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Обычные кнопки (History и Account)
  let IconComponent;
  let label = options.tabBarLabel as string || route.name;
  
  if (index === 0) {
    IconComponent = HistoryIcon;
  } else {
    IconComponent = AccountIcon;
  }

  return (
    <TouchableOpacity
      key={route.key}
      ref={index === 0 ? historyTabRef : accountTabRef}
      style={styles.tabButton}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={isFocused ? { selected: true } : {}}
      testID={index === 0 ? "e2e-tab-history" : "e2e-tab-account"}
    >
      <IconComponent color={isFocused ? theme.tabBarActive : theme.tabBarInactive} />
      <Text
        style={[
          styles.tabLabel,
          { color: isFocused ? theme.tabBarActive : theme.tabBarInactive },
          isFocused && styles.tabLabelActive
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Кастомный Tab Bar с круглой кнопкой Scan по центру
 */
export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { theme } = useTheme();
  const scanLockRef = useRef(false);
  const [isScanProcessing, setIsScanProcessing] = useState(false);
  const [showImageSourceModal, setShowImageSourceModal] = useState(false);

  const handleScanPress = useCallback(() => {
    // Синхронная блокировка: на эмуляторах и при быстрых тапах state не успевает обновиться
    if (scanLockRef.current) return;
    scanLockRef.current = true;
    setIsScanProcessing(true);

    setTimeout(() => {
      scanLockRef.current = false;
      setIsScanProcessing(false);
    }, 800);

    // Показываем модальное окно выбора источника
    setShowImageSourceModal(true);
  }, [navigation]);

  const handleSelectCamera = useCallback(() => {
    const stackNavigation = navigation.getParent();
    if (stackNavigation) stackNavigation.navigate("CameraModal");
  }, [navigation]);

  const handleSelectGallery = useCallback(() => {
    const stackNavigation = navigation.getParent();
    if (stackNavigation) stackNavigation.navigate("ImagePicker");
  }, [navigation]);

  return (
    <>
      <ImageSourceModal
        visible={showImageSourceModal}
        onClose={() => setShowImageSourceModal(false)}
        onSelectCamera={handleSelectCamera}
        onSelectGallery={handleSelectGallery}
      />
      <View style={styles.container}>
        <View style={[styles.tabBar, { backgroundColor: theme.tabBarBackground }]}>
        {state.routes.map((route: typeof state.routes[number], index: number) => (
          <TabButton
            key={route.key}
            route={route}
            index={index}
            descriptors={descriptors}
            state={state}
            navigation={navigation}
            theme={theme}
            onScanPress={handleScanPress}
            isScanProcessing={isScanProcessing}
          />
        ))}
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "transparent",
    paddingBottom: 0,
    zIndex: 1000, // Убеждаемся, что TabBar всегда поверх всего
  },
  tabBar: {
    flexDirection: "row",
    height: 75,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 25 : 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    alignItems: "center",
    justifyContent: "space-around",
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  tabLabelActive: {
    fontWeight: "600",
  },
  iconText: {
    fontSize: 24,
  },
  scanButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 5,
    marginTop: 0, // На одном уровне с другими кнопками
  },
  scanButtonInner: {
    justifyContent: "center",
    alignItems: "center",
  },
  scanIconText: {
    fontSize: 28,
  },
  scanButtonLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  // Стили для простых иконок
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  iconLine: {
    width: 18,
    height: 2,
    borderRadius: 1,
  },
  userIcon: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  userHead: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 2,
  },
  userBody: {
    width: 18,
    height: 12,
    borderRadius: 9,
    marginTop: -2,
  },
});

