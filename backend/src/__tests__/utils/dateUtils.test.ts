/**
 * Тесты для утилит работы с датами
 */

describe("Date Utilities", () => {
  describe("Date Formatting", () => {
    it("should format date correctly", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = date.toLocaleDateString("ru-RU");
      expect(formatted).toMatch(/\d{2}\.\d{2}\.\d{4}/);
    });

    it("should format date with time", () => {
      const date = new Date("2024-01-15T10:30:00Z");
      const formatted = date.toLocaleString("ru-RU");
      expect(formatted).toBeTruthy();
    });
  });

  describe("Date Comparison", () => {
    it("should compare dates correctly", () => {
      const date1 = new Date("2024-01-15");
      const date2 = new Date("2024-01-16");
      expect(date1 < date2).toBe(true);
    });

    it("should handle date range filtering", () => {
      const scanDate = new Date("2024-01-15T12:00:00Z");
      const startDate = new Date("2024-01-15");
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date("2024-01-15");
      endDate.setHours(23, 59, 59, 999);

      expect(scanDate >= startDate && scanDate <= endDate).toBe(true);
    });
  });

  describe("Date Grouping", () => {
    it("should identify today correctly", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const scanDate = new Date();
      scanDate.setHours(0, 0, 0, 0);

      expect(scanDate.getTime()).toBe(today.getTime());
    });

    it("should identify yesterday correctly", () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(yesterday.getDate()).toBe(today.getDate() - 1);
    });
  });
});
