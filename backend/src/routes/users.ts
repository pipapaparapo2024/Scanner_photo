import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { registerUserBodySchema, updateUserBodySchema } from "../validation/schemas";
import { getOrCreateUser, createUserOnRegistration, updateUser } from "../services/userService";
import { UserNotFoundError } from "../utils/errors";

const router = Router();

router.get(
  "/me",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const user = await getOrCreateUser(authUser.uid, authUser.email);

    if (!user) {
      throw new UserNotFoundError(authUser.uid);
    }

    res.json(user);
  }),
);

router.patch(
  "/me",
  authMiddleware,
  validate(updateUserBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const updated = await updateUser(authUser.uid, req.body);
    res.json(updated);
  }),
);

/**
 * Создать пользователя при регистрации
 * Вызывается после создания пользователя в Firebase Auth
 */
router.post(
  "/register",
  authMiddleware,
  validate(registerUserBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { email, password } = req.body as { email: string; password: string };
    const user = await createUserOnRegistration(authUser.uid, email, password);
    res.json(user);
  }),
);

export default router;


