/**
 * Unit-тесты для сервиса встроенных покупок
 * Покрытие критичных функций: валидация покупок, начисление токенов
 */

import { verifyAndApplyIap } from "../../services/iapService";
import * as userRepository from "../../repositories/userRepository";
import { ValidationError } from "../../utils/errors";
import axios from "axios";
import type { UserDoc } from "../../types/firestore";

// Моки
jest.mock("../../repositories/userRepository");
jest.mock("axios");

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockAxiosPost = (axios as jest.Mocked<typeof axios>).post as jest.Mock;

describe("IapService", () => {
  const mockUserId = "test-user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockAxiosPost.mockClear();
    // Сброс переменных окружения
    delete process.env.RUSTORE_VERIFY_URL;
    delete process.env.RUSTORE_API_TOKEN;
  });

  describe("verifyAndApplyIap", () => {
    it("should add 50 credits for pack_50_scans", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: "test@example.com",
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 60,
      };

      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await verifyAndApplyIap({
        userId: mockUserId,
        productId: "pack_50_scans",
        purchaseToken: "token-123",
        orderId: "order-123",
      });

      expect(result.addedCredits).toBe(50);
      expect(result.totalCredits).toBe(60);
      expect(mockUserRepository.updateUserScanCredits).toHaveBeenCalledWith(mockUserId, 50);
    });

    it("should add 100 credits for pack_100_scans", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: "test@example.com",
        scanCredits: 5,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 105,
      };

      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await verifyAndApplyIap({
        userId: mockUserId,
        productId: "pack_100_scans",
        purchaseToken: "token-123",
        orderId: "order-123",
      });

      expect(result.addedCredits).toBe(100);
      expect(result.totalCredits).toBe(105);
      expect(mockUserRepository.updateUserScanCredits).toHaveBeenCalledWith(mockUserId, 100);
    });

    it("should throw ValidationError for unknown product", async () => {
      await expect(
        verifyAndApplyIap({
          userId: mockUserId,
          productId: "unknown_product",
          purchaseToken: "token-123",
          orderId: "order-123",
        })
      ).rejects.toThrow(ValidationError);

      expect(mockUserRepository.updateUserScanCredits).not.toHaveBeenCalled();
    });

    it("should skip RuStore verification if not configured", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: "test@example.com",
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 60,
      };

      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await verifyAndApplyIap({
        userId: mockUserId,
        productId: "pack_50_scans",
        purchaseToken: "token-123",
        orderId: "order-123",
      });

      expect(result.addedCredits).toBe(50);
      expect(mockAxiosPost).not.toHaveBeenCalled();
    });

    it("should verify with RuStore if configured", async () => {
      process.env.RUSTORE_VERIFY_URL = "https://api.rustore.ru/verify";
      process.env.RUSTORE_API_TOKEN = "test-token";

      const mockUser: UserDoc = {
        userId: mockUserId,
        email: "test@example.com",
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 60,
      };

      mockAxiosPost.mockResolvedValue({ data: { valid: true } });
      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await verifyAndApplyIap({
        userId: mockUserId,
        productId: "pack_50_scans",
        purchaseToken: "token-123",
        orderId: "order-123",
      });

      expect(result.addedCredits).toBe(50);
      expect(mockAxiosPost).toHaveBeenCalledWith(
        "https://api.rustore.ru/verify",
        {
          purchaseToken: "token-123",
          productId: "pack_50_scans",
          orderId: "order-123",
          userId: mockUserId,
        },
        {
          headers: {
            Authorization: "Bearer test-token",
          },
        }
      );
    });
  });
});
