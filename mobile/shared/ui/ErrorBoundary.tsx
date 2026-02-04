import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../../app/providers/ThemeProvider";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary для обработки критических ошибок React
 * Предотвращает белый экран при ошибках в компонентах
 */
class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Отправляем в Sentry
    try {
      const { captureException } = require("../lib/monitoring");
      captureException(error, {
        tags: { source: "ErrorBoundary" },
        extra: { componentStack: errorInfo.componentStack },
      });
    } catch (e) {
      // Игнорируем, если мониторинг не инициализирован
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

/**
 * Компонент для отображения ошибки
 */
function ErrorFallback({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <Text style={[styles.title, { color: theme.text }]}>Произошла ошибка</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          Приложение столкнулось с неожиданной ошибкой. Попробуйте перезапустить приложение.
        </Text>
        {__DEV__ && error && (
          <Text style={[styles.errorText, { color: theme.error }]}>
            {error.message}
          </Text>
        )}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.primary }]}
          onPress={onReset}
        >
          <Text style={styles.buttonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ErrorBoundary({ children, fallback }: Props) {
  return <ErrorBoundaryClass fallback={fallback}>{children}</ErrorBoundaryClass>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 12,
    padding: 30,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
