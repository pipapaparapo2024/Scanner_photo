import { Router, type Request, type Response } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { feedbackBodySchema } from "../validation/schemas";
import { createFeedback } from "../services/feedbackService";

const router = Router();

/**
 * POST /api/feedback
 * Отправить обратную связь
 * Авторизация опциональна (можно отправлять без авторизации)
 */
router.post(
  "/",
  validate(feedbackBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { subject, message, email } = req.body as {
      subject: string;
      message: string;
      email?: string;
    };

    let userId: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const { auth } = await import("../config/firebase");
        const idToken = authHeader.substring("Bearer ".length);
        const decoded = await auth.verifyIdToken(idToken);
        userId = decoded.uid;
      } catch {
        // Игнорируем ошибку авторизации - обратная связь может быть анонимной
      }
    }

    const result = await createFeedback({
      subject,
      message,
      email: email?.trim() || undefined,
      userId,
    });

    res.json(result);
  }),
);

export default router;
