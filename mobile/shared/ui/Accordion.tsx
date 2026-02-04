import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Animated } from "react-native";
import { ChevronDown } from "lucide-react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

/**
 * Компонент Accordion для раскрывающихся секций
 */
export function Accordion({ title, children, defaultExpanded = false }: AccordionProps) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);
  const rotateAnim = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const heightAnim = React.useRef(new Animated.Value(expanded ? 1 : 0)).current;

  const toggleExpanded = () => {
    const toValue = expanded ? 0 : 1;
    Animated.parallel([
      Animated.timing(rotateAnim, {
        toValue,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(heightAnim, {
        toValue,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
    setExpanded(!expanded);
  };

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const opacity = heightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <TouchableOpacity
        style={[styles.header, { borderBottomColor: theme.borderColor }]}
        onPress={toggleExpanded}
        activeOpacity={0.7}
        accessibilityLabel={title}
        accessibilityHint={expanded ? "Нажмите, чтобы свернуть" : "Нажмите, чтобы развернуть"}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
      >
        <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <ChevronDown size={20} color={theme.textSecondary} />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View
        style={{
          maxHeight: heightAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 1000],
          }),
          opacity,
          overflow: "hidden",
        }}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? "yes" : "no-hide-descendants"}
      >
        <View style={styles.content}>
          <Text style={[styles.contentText, { color: theme.textSecondary }]}>{children}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  content: {
    padding: 16,
    paddingTop: 12,
  },
  contentText: {
    fontSize: 15,
    lineHeight: 22,
  },
});
