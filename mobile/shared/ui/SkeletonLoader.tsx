import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Компонент skeleton loader с анимацией пульсации
 */
export function SkeletonLoader({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const { theme } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.border,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/**
 * Skeleton для баланса
 */
export function BalanceSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.balanceCard, { backgroundColor: theme.surface }]}>
      <SkeletonLoader width="40%" height={18} borderRadius={4} />
      <SkeletonLoader width="60%" height={42} borderRadius={4} style={{ marginTop: 16 }} />
    </View>
  );
}

/**
 * Skeleton для секции
 */
export function SectionSkeleton() {
  const { theme } = useTheme();
  return (
    <View style={[styles.section, { backgroundColor: theme.surface }]}>
      <SkeletonLoader width="50%" height={22} borderRadius={4} />
      <SkeletonLoader width="100%" height={20} borderRadius={4} style={{ marginTop: 20 }} />
      <SkeletonLoader width="80%" height={20} borderRadius={4} style={{ marginTop: 16 }} />
      <SkeletonLoader width="90%" height={20} borderRadius={4} style={{ marginTop: 16 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E0E0E0",
  },
  balanceCard: {
    padding: 28,
    borderRadius: 12,
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  section: {
    borderRadius: 12,
    padding: 28,
    marginBottom: 24,
  },
});
