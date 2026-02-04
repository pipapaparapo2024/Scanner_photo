import { Router, type Request, type Response } from "express";
import { sendVerificationCodeEmail } from "../services/emailService";
import { randomUUID } from "crypto";
import { firestore } from "../config/firebase";
import { authRateLimiter, verificationCodeRateLimiter } from "../middleware/rateLimiter";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import {
  sendVerificationCodeBodySchema,
  verifyCodeBodySchema,
  checkEmailVerifiedQuerySchema,
  checkEmailExistsQuerySchema,
} from "../validation/schemas";
import { ValidationError } from "../utils/errors";

const router = Router();

/**
 * POST /api/auth/send-verification-code
 * Отправить код подтверждения на email
 * Rate limited: 3 запроса в час на email
 */
router.post(
  "/send-verification-code",
  verificationCodeRateLimiter,
  validate(sendVerificationCodeBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email: string };

    // Генерируем 4-значный код
  const code = Math.floor(1000 + Math.random() * 9000).toString();

  // Сохраняем код в Firestore с временем жизни 10 минут
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  const codeId = randomUUID();

  await firestore.collection("verification_codes").doc(codeId).set({
    email,
    code,
    expiresAt,
    createdAt: new Date(),
  });

  // Отправляем код на email
  await sendVerificationCodeEmail(email, code);

  res.json({ success: true, message: "Verification code sent" });
}));

/**
 * POST /api/auth/verify-code
 * Проверить код подтверждения
 * Rate limited: 10 запросов за 15 минут
 */
router.post(
  "/verify-code",
  authRateLimiter,
  validate(verifyCodeBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { email, code } = req.body as { email: string; code: string };

    // Ищем код в Firestore
  const codesSnapshot = await firestore
    .collection("verification_codes")
    .where("email", "==", email)
    .where("code", "==", code)
    .get();

  const codes = codesSnapshot.docs
    .map(doc => ({ id: doc.id, ...doc.data() } as { id: string; createdAt?: any; expiresAt?: any; [key: string]: any }))
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime();
    });

  if (codes.length === 0) {
    throw new ValidationError("Invalid or expired code");
  }

  const codeDoc = codes[0];
  const expiresAt = codeDoc.expiresAt?.toDate?.() || new Date(0);

  if (new Date() > expiresAt) {
    await firestore.collection("verification_codes").doc(codeDoc.id).delete();
    throw new ValidationError("Code expired");
  }

  await firestore.collection("verification_codes").doc(codeDoc.id).delete();

  res.json({ success: true, message: "Code verified" });
}));

/**
 * GET /api/auth/check-email-verified
 * Проверить, подтвержден ли email
 * Rate limited: 10 запросов за 15 минут
 */
router.get(
  "/check-email-verified",
  authRateLimiter,
  validate(checkEmailVerifiedQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query as { email: string };

    const verifiedDoc = await firestore.collection("verified_emails").doc(email).get();

    if (!verifiedDoc.exists) {
      res.json({ verified: false });
      return;
    }

    const verifiedData = verifiedDoc.data();
    const verifiedAt = verifiedData?.verifiedAt?.toDate();
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const isVerified = verifiedAt && verifiedAt > thirtyMinutesAgo;

    res.json({ verified: isVerified });
  }),
);

/**
 * GET /api/auth/check-email-exists
 * Проверить, зарегистрирован ли email в Firebase Auth
 * Rate limited: 10 запросов за 15 минут
 */
router.get(
  "/check-email-exists",
  authRateLimiter,
  validate(checkEmailExistsQuerySchema, "query"),
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.query as { email: string };

    const usersSnapshot = await firestore
      .collection("users")
      .where("email", "==", email.toLowerCase().trim())
      .limit(1)
      .get();

    const exists = !usersSnapshot.empty;

    res.json({ exists });
  }),
);

export default router;

