import { Router } from "express";
import { authMiddleware, type AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/errorHandler";
import { validate } from "../middleware/validate";
import {
  createScanBodySchema,
  listScansQuerySchema,
  updateScanCommentBodySchema,
} from "../validation/schemas";
import { listScans, performScan, removeScan, updateComment, updateFavorite } from "../services/scanService";
import { ValidationError } from "../utils/errors";

const router = Router();

router.get(
  "/",
  authMiddleware,
  validate(listScansQuerySchema, "query"),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const query = req.query as unknown as Record<string, string | undefined>;
    const limit = query.limit ? parseInt(query.limit, 10) || 10 : 10;
    const cursor = query.cursor || null;

    const result = await listScans(authUser.uid, limit, cursor);
    res.json(result);
  }),
);

router.post(
  "/",
  authMiddleware,
  validate(createScanBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { extractedText } = req.body as { extractedText: string };
    const result = await performScan(
      authUser.uid,
      authUser.email,
      extractedText,
    );
    res.json(result);
  }),
);

router.patch(
  "/:scanId/comment",
  authMiddleware,
  validate(updateScanCommentBodySchema),
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { scanId } = req.params;
    if (!scanId || typeof scanId !== "string") {
      throw new ValidationError("scanId is required", "scanId");
    }

    const { comment } = req.body as { comment: string };
    await updateComment(authUser.uid, scanId, comment);
    res.json({ message: "Comment updated successfully" });
  }),
);

router.patch(
  "/:scanId/favorite",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { scanId } = req.params;
    if (!scanId || typeof scanId !== "string") {
      throw new ValidationError("scanId is required", "scanId");
    }

    const { isFavorite } = req.body as { isFavorite: boolean };
    if (typeof isFavorite !== "boolean") {
       throw new ValidationError("isFavorite (boolean) is required", "isFavorite");
    }
    
    await updateFavorite(authUser.uid, scanId, isFavorite);
    res.json({ message: "Favorite status updated successfully" });
  }),
);

router.delete(
  "/:scanId",
  authMiddleware,
  asyncHandler(async (req: AuthRequest, res) => {
    const authUser = req.user;
    if (!authUser) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }

    const { scanId } = req.params;
    if (!scanId || typeof scanId !== "string") {
      throw new ValidationError("scanId is required", "scanId");
    }

    await removeScan(authUser.uid, scanId);
    res.json({ message: "Scan deleted successfully" });
  }),
);

export default router;


