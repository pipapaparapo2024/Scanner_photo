import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { adRewardBodySchema } from "../validation/schemas";
import { applyAdReward, createAdRewardNonce } from "../services/adService";

const router = Router();

// Получить одноразовый nonce-токен для рекламы
router.post(
  "/reward/nonce",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const result = await createAdRewardNonce(
      authUser.uid,
      authUser.email,
    );
    res.json(result);
  }),
);

// Подтвердить получение вознаграждения за рекламу
router.post(
  "/reward",
  authMiddleware,
  validate(adRewardBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { token } = req.body as { token: string };
    const result = await applyAdReward(authUser.uid, token);
    res.json(result);
  }),
);

export default router;


