import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import type { MainTabParamList } from "./types";
import { HomePage } from "../../pages/HomePage";
import { ScanHistoryPage } from "../../pages/ScanHistoryPage";
import { AccountPage } from "../../pages/AccountPage";
import { CustomTabBar } from "../../widgets/TabBar/CustomTabBar";

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Tab Navigator с кастомным Tab Bar
 */
export function TabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
       initialRouteName="Account"
      tabBar={(props: BottomTabBarProps) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="History"
        component={ScanHistoryPage}
        options={{
          tabBarLabel: t("navigation.history"),
        }}
      />
      <Tab.Screen
        name="Scan"
        component={HomePage}
        options={{
          tabBarLabel: t("navigation.scan"),
        }}
        listeners={{
          tabPress: (e: { preventDefault: () => void }) => {
            // Перехватываем нажатие на вкладку Scan и открываем модальное окно камеры
            e.preventDefault();
            // Navigation будет работать через navigation.navigate в CustomTabBar
          },
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountPage}
        options={{
          tabBarLabel: t("navigation.profile"),
        }}
      />
    </Tab.Navigator>
  );
}

