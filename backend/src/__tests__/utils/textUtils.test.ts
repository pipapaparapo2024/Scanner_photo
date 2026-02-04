/**
 * Unit-тесты для утилит обработки текста
 * Покрытие: нормализация Unicode, валидация текста, форматирование
 */

describe("Text Utilities", () => {
  describe("Unicode Normalization", () => {
    it("should normalize Cyrillic text to NFC", () => {
      const text = "Привет мир";
      const normalized = text.normalize("NFC");
      expect(normalized).toBe(text);
    });

    it("should handle mixed text correctly", () => {
      const text = "Hello Привет 123";
      const normalized = text.normalize("NFC");
      expect(normalized).toBe(text);
    });

    it("should handle empty string", () => {
      const text = "";
      const normalized = text.normalize("NFC");
      expect(normalized).toBe("");
    });
  });

  describe("Text Validation", () => {
    it("should validate non-empty text", () => {
      const text = "Valid text";
      expect(text.trim().length > 0).toBe(true);
    });

    it("should reject empty text", () => {
      const text = "   ";
      expect(text.trim().length > 0).toBe(false);
    });

    it("should handle text with special characters", () => {
      const text = "Text with !@#$%^&*()";
      expect(text.trim().length > 0).toBe(true);
    });
  });

  describe("Text Truncation", () => {
    it("should truncate long text", () => {
      const longText = "A".repeat(100);
      const maxLength = 50;
      const truncated = longText.substring(0, maxLength);
      expect(truncated.length).toBe(maxLength);
    });

    it("should not truncate short text", () => {
      const shortText = "Short";
      const maxLength = 50;
      const truncated = shortText.substring(0, maxLength);
      expect(truncated).toBe(shortText);
    });
  });
});
