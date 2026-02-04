import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import { iapVerifyBodySchema } from "../validation/schemas";
import { verifyAndApplyIap } from "../services/iapService";

const router = Router();

router.post(
  "/verify",
  authMiddleware,
  validate(iapVerifyBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { productId, purchaseToken, orderId } = req.body as {
      productId: string;
      purchaseToken: string;
      orderId?: string;
    };

    const result = await verifyAndApplyIap({
      userId: authUser.uid,
      productId,
      purchaseToken,
      orderId,
    });
    res.json(result);
  }),
);

export default router;


