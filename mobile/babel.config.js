module.exports = {
  presets: ["module:@react-native/babel-preset"],
  plugins: [
    [
      "@babel/plugin-transform-runtime",
      {
        helpers: true,
        regenerator: true,
      },
    ],
    [
      "babel-plugin-module-resolver",
      {
        root: ["./"],
        extensions: [".ios.js", ".android.js", ".js", ".ts", ".tsx", ".json"],
        alias: {
          shared: "./shared",
          entities: "./entities",
          features: "./features",
          widgets: "./widgets",
          pages: "./pages",
          app: "./app",
        },
        // Исключаем node_modules из обработки алиасов
        // Это предотвращает конфликты с npm пакетами, которые могут иметь похожие имена
        resolvePath(sourcePath, currentFile, opts) {
          // КРИТИЧНО: Если файл находится в node_modules, НИКОГДА не применяем алиасы
          // Это самая важная проверка - она должна быть первой
          if (currentFile && currentFile.includes("node_modules")) {
            // Возвращаем null, чтобы плагин полностью пропустил обработку этого пути
            return null;
          }
          
          // Если sourcePath не указан, используем стандартную логику
          if (!sourcePath) {
            return undefined;
          }
          
          // Если путь указывает на node_modules, не применяем алиасы
          if (sourcePath.includes("node_modules")) {
            return null;
          }
          
          const aliasKeys = Object.keys(opts.alias || {});
          const firstPart = sourcePath.split("/")[0];
          
          // Если это не относительный путь и не наш алиас - это npm пакет
          if (!sourcePath.startsWith(".") && !sourcePath.startsWith("..") && !aliasKeys.includes(firstPart)) {
            return null;
          }
          
          // Если это относительный путь из node_modules - не применяем алиасы
          // (проверка уже сделана выше, но для надежности оставляем)
          if ((sourcePath.startsWith(".") || sourcePath.startsWith("..")) && currentFile && currentFile.includes("node_modules")) {
            return null;
          }
          
          // Для остальных случаев используем стандартное разрешение плагина
          return undefined;
        },
      },
    ],
    "react-native-reanimated/plugin",
  ],
};

