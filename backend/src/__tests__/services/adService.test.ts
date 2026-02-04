/**
 * Тесты для сервиса рекламы
 */

import { createAdRewardNonce, applyAdReward } from "../../services/adService";
import * as rewardTokenRepository from "../../repositories/rewardTokenRepository";
import * as userRepository from "../../repositories/userRepository";
import * as userService from "../../services/userService";
import { UserNotFoundError, ValidationError } from "../../utils/errors";
import type { RewardTokenDoc, UserDoc } from "../../types/firestore";

// Моки
jest.mock("../../repositories/rewardTokenRepository");
jest.mock("../../repositories/userRepository");
jest.mock("../../services/userService");

const mockRewardTokenRepository = rewardTokenRepository as jest.Mocked<
  typeof rewardTokenRepository
>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe("AdService", () => {
  const mockUserId = "test-user-123";
  const mockEmail = "test@example.com";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createAdRewardNonce", () => {
    it("should create reward token when user has zero credits", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 0,
      };

      const mockToken = "reward-token-123";
      const mockTokenDoc: RewardTokenDoc = {
        token: mockToken,
        userId: mockUserId,
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockRewardTokenRepository.createRewardToken.mockResolvedValue(undefined);
      jest.spyOn(require("crypto"), "randomUUID").mockReturnValue(mockToken);

      const result = await createAdRewardNonce(mockUserId, mockEmail);

      expect(result.token).toBe(mockToken);
      expect(mockRewardTokenRepository.createRewardToken).toHaveBeenCalledWith(
        expect.objectContaining({
          token: mockToken,
          userId: mockUserId,
          isUsed: false,
        })
      );
    });

    it("should throw ValidationError when user has credits", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 10,
      };

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);

      await expect(createAdRewardNonce(mockUserId, mockEmail)).rejects.toThrow(
        ValidationError
      );

      expect(mockRewardTokenRepository.createRewardToken).not.toHaveBeenCalled();
    });

    it("should throw UserNotFoundError when user not found", async () => {
      mockUserService.getOrCreateUser.mockResolvedValue(null);

      await expect(createAdRewardNonce(mockUserId, mockEmail)).rejects.toThrow(
        UserNotFoundError
      );

      expect(mockRewardTokenRepository.createRewardToken).not.toHaveBeenCalled();
    });
  });

  describe("applyAdReward", () => {
    it("should apply reward and add 3 credits", async () => {
      const mockToken = "reward-token-123";
      const mockTokenDoc: RewardTokenDoc = {
        token: mockToken,
        userId: mockUserId,
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 0,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 3,
      };

      mockRewardTokenRepository.useRewardToken.mockResolvedValue(mockTokenDoc);
      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await applyAdReward(mockUserId, mockToken);

      expect(result.addedCredits).toBe(3);
      expect(result.totalCredits).toBe(3);
      expect(mockUserRepository.updateUserScanCredits).toHaveBeenCalledWith(mockUserId, 3);
    });

    it("should throw ValidationError for invalid token", async () => {
      const mockToken = "invalid-token";

      mockRewardTokenRepository.useRewardToken.mockResolvedValue(null);

      await expect(applyAdReward(mockUserId, mockToken)).rejects.toThrow(ValidationError);

      expect(mockUserRepository.updateUserScanCredits).not.toHaveBeenCalled();
    });

    it("should throw ValidationError for token with different userId", async () => {
      const mockToken = "reward-token-123";
      const mockTokenDoc: RewardTokenDoc = {
        token: mockToken,
        userId: "other-user-id",
        isUsed: false,
        createdAt: new Date().toISOString(),
      };

      mockRewardTokenRepository.useRewardToken.mockResolvedValue(mockTokenDoc);

      await expect(applyAdReward(mockUserId, mockToken)).rejects.toThrow(ValidationError);

      expect(mockUserRepository.updateUserScanCredits).not.toHaveBeenCalled();
    });
  });
});
