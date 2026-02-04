/**
 * Unit-тесты для сервиса пользователей
 * Покрытие критичных функций: создание пользователя, получение пользователя, валидация
 */

import { getOrCreateUser, createUserOnRegistration } from "../../services/userService";
import * as userRepository from "../../repositories/userRepository";
import * as bcrypt from "bcrypt";
import type { UserDoc } from "../../types/firestore";

// Моки
jest.mock("../../repositories/userRepository");
jest.mock("bcrypt");

const mockUserRepository = userRepository as jest.Mocked<typeof userRepository>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe("UserService", () => {
  const mockUserId = "test-user-123";
  const mockEmail = "test@example.com";
  const mockPassword = "password123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getOrCreateUser", () => {
    it("should return existing user when credits >= 500", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 500,
      };

      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const result = await getOrCreateUser(mockUserId, mockEmail);

      expect(result).toEqual(mockUser);
      expect(mockUserRepository.getUserById).toHaveBeenCalledWith(mockUserId);
      expect(mockUserRepository.createOrUpdateUser).not.toHaveBeenCalled();
    });

    it("should return null if user does not exist", async () => {
      mockUserRepository.getUserById.mockResolvedValue(null);

      const result = await getOrCreateUser(mockUserId, mockEmail);

      expect(result).toBeNull();
    });

    it("should return existing user as-is without updating credits", async () => {
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 5,
      };

      mockUserRepository.getUserById.mockResolvedValue(mockUser);

      const result = await getOrCreateUser(mockUserId, mockEmail);

      expect(result).toEqual(mockUser);
      expect(result?.scanCredits).toBe(5);
      expect(mockUserRepository.createOrUpdateUser).not.toHaveBeenCalled();
    });
  });

  describe("createUserOnRegistration", () => {
    it("should create new user with hashed password", async () => {
      const hashedPassword = "hashed_password_123";
      const initialFreeScans = 5; // INITIAL_FREE_SCANS default
      const mockUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        password: hashedPassword,
        scanCredits: initialFreeScans,
      };

      mockUserRepository.getUserById.mockResolvedValue(null);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.createOrUpdateUser.mockResolvedValue(undefined);

      // Мокируем firestore для проверки дубликатов по email
      const mockFirestore = {
        collection: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              get: jest.fn().mockResolvedValue({ empty: true }),
            }),
          }),
        }),
      };
      jest.doMock("../../config/firebase", () => ({
        firestore: mockFirestore,
      }));

      const result = await createUserOnRegistration(mockUserId, mockEmail, mockPassword);

      expect(result).toEqual(mockUser);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(mockPassword, 10);
      expect(mockUserRepository.createOrUpdateUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: mockUserId,
          email: mockEmail,
          password: hashedPassword,
          scanCredits: initialFreeScans,
        })
      );
    });

    it("should update existing user with new password", async () => {
      const hashedPassword = "hashed_password_123";
      const existingUser: UserDoc = {
        userId: mockUserId,
        email: mockEmail,
        scanCredits: 10,
      };

      const updatedUser: UserDoc = {
        ...existingUser,
        email: mockEmail,
        password: hashedPassword,
        scanCredits: 10, // existing.scanCredits || INITIAL = 10
      };

      mockUserRepository.getUserById.mockResolvedValue(existingUser);
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockUserRepository.createOrUpdateUser.mockResolvedValue(undefined);

      const result = await createUserOnRegistration(mockUserId, mockEmail, mockPassword);

      expect(result).toEqual(updatedUser);
      expect(mockBcrypt.hash).toHaveBeenCalledWith(mockPassword, 10);
    });
  });
});
