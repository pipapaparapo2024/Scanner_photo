import { randomUUID } from "crypto";
import { createRewardToken, useRewardToken } from "../repositories/rewardTokenRepository";
import { getOrCreateUser } from "./userService";
import { updateUserScanCredits } from "../repositories/userRepository";
import { UserNotFoundError, ValidationError } from "../utils/errors";
import type { RewardTokenDoc } from "../types/firestore";

export async function createAdRewardNonce(
  userId: string,
  email: string | undefined,
): Promise<{ token: string }> {
  const user = await getOrCreateUser(userId, email);

  if (!user) {
    throw new UserNotFoundError(userId);
  }

  if (user.scanCredits > 0) {
    throw new ValidationError("Reward ads available only when scanCredits == 0");
  }

  const token = randomUUID();
  const doc: RewardTokenDoc = {
    token,
    userId,
    isUsed: false,
    createdAt: new Date().toISOString(),
  };

  await createRewardToken(doc);
  return { token };
}

export async function applyAdReward(
  userId: string,
  token: string,
): Promise<{ addedCredits: number; totalCredits: number }> {
  const tokenDoc = await useRewardToken(token);
  if (!tokenDoc || tokenDoc.userId !== userId) {
    throw new ValidationError("Invalid or used token", "token");
  }

  const addedCredits = 3; // За просмотр рекламы даём 3 токена
  const updatedUser = await updateUserScanCredits(userId, addedCredits);

  return { addedCredits, totalCredits: updatedUser.scanCredits };
}


