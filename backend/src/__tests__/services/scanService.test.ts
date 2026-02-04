/**
 * Unit-тесты для сервиса сканирования
 * Покрытие критичных функций: создание сканов, валидация, нормализация текста
 */

import { performScan, listScans, updateComment, removeScan } from "../../services/scanService";
import * as scanRepository from "../../repositories/scanRepository";
import * as userRepository from "../../repositories/userRepository";
import * as userService from "../../services/userService";
import { NoCreditsError, UserNotFoundError } from "../../utils/errors";
import type { ScanDoc, UserDoc } from "../../types/firestore";

// Моки
jest.mock("../../repositories/scanRepository");
jest.mock("../../repositories/userRepository");
jest.mock("../../services/userService");

const mockScanRepository = scanRepository as jest.Mocked<typeof scanRepository>;
const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockUserService = userService as jest.Mocked<typeof userService>;

describe("ScanService", () => {
  const mockUserId = "test-user-123";
  const mockEmail = "test@example.com";
  const mockExtractedText = "Пример текста для сканирования";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("performScan", () => {
    it("should create scan successfully when user has credits", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 9,
      };

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockScanRepository.addScan.mockResolvedValue(undefined);
      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await performScan(mockUserId, mockEmail, mockExtractedText);

      expect(result.scan).toBeDefined();
      expect(result.scan.extractedText).toBe(mockExtractedText);
      expect(result.remainingCredits).toBe(9);
      expect(mockScanRepository.addScan).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          extractedText: mockExtractedText,
        })
      );
      expect(mockUserRepository.updateUserScanCredits).toHaveBeenCalledWith(mockUserId, -1);
    });

    it("should throw NoCreditsError when user has no credits", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 0,
      };

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);

      await expect(performScan(mockUserId, mockEmail, mockExtractedText)).rejects.toThrow(
        NoCreditsError
      );

      expect(mockScanRepository.addScan).not.toHaveBeenCalled();
    });

    it("should throw UserNotFoundError when user not found", async () => {
      mockUserService.getOrCreateUser.mockResolvedValue(null);

      await expect(performScan(mockUserId, mockEmail, mockExtractedText)).rejects.toThrow(
        UserNotFoundError
      );

      expect(mockScanRepository.addScan).not.toHaveBeenCalled();
    });

    it("should normalize Cyrillic text correctly", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 9,
      };

      const cyrillicText = "Привет мир! Тест кириллицы";

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockScanRepository.addScan.mockResolvedValue(undefined);
      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await performScan(mockUserId, mockEmail, cyrillicText);

      expect(result.scan.extractedText).toBe(cyrillicText.normalize("NFC"));
      expect(mockScanRepository.addScan).toHaveBeenCalledWith(
        mockUserId,
        expect.objectContaining({
          extractedText: cyrillicText.normalize("NFC"),
        })
      );
    });

    it("should handle empty text", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...mockUser,
        scanCredits: 9,
      };

      mockUserService.getOrCreateUser.mockResolvedValue(mockUser);
      mockScanRepository.addScan.mockResolvedValue(undefined);
      mockUserRepository.updateUserScanCredits.mockResolvedValue(updatedUser);

      const result = await performScan(mockUserId, mockEmail, "");

      expect(result.scan.extractedText).toBe("");
    });
  });

  describe("listScans", () => {
    it("should return scans with pagination", async () => {
      const mockScans: ScanDoc[] = [
        {
          scanId: "scan-1",
          scanDate: new Date().toISOString(),
          extractedText: "Text 1",
        },
        {
          scanId: "scan-2",
          scanDate: new Date().toISOString(),
          extractedText: "Text 2",
        },
      ];

      mockScanRepository.getUserScans.mockResolvedValue(mockScans);

      const result = await listScans(mockUserId, 20, 0);

      expect(result).toEqual(mockScans);
      expect(mockScanRepository.getUserScans).toHaveBeenCalledWith(mockUserId, 20, 0);
    });

    it("should use default limit and offset", async () => {
      const mockScans: ScanDoc[] = [];
      mockScanRepository.getUserScans.mockResolvedValue(mockScans);

      await listScans(mockUserId);

      expect(mockScanRepository.getUserScans).toHaveBeenCalledWith(mockUserId, 20, 0);
    });
  });

  describe("updateComment", () => {
    it("should update scan comment", async () => {
      const comment = "Новый комментарий";
      mockScanRepository.updateScanComment.mockResolvedValue(undefined);

      await updateComment(mockUserId, "scan-1", comment);

      expect(mockScanRepository.updateScanComment).toHaveBeenCalledWith(
        mockUserId,
        "scan-1",
        comment
      );
    });
  });

  describe("removeScan", () => {
    it("should delete scan", async () => {
      mockScanRepository.deleteScan.mockResolvedValue(undefined);

      await removeScan(mockUserId, "scan-1");

      expect(mockScanRepository.deleteScan).toHaveBeenCalledWith(mockUserId, "scan-1");
    });
  });
});
