import { z } from "zod";

/** Max length for extractedText (500 KB chars) to avoid abuse and Firestore overload */
export const EXTRACTED_TEXT_MAX_LENGTH = 500 * 1024;

const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Invalid email format");

const codeSchema = z
  .string()
  .min(1, "Code is required")
  .regex(/^\d{4}$/, "Code must be 4 digits");

/** POST /api/scans body */
export const createScanBodySchema = z.object({
  extractedText: z
    .string()
    .min(1, "extractedText is required")
    .max(EXTRACTED_TEXT_MAX_LENGTH, `extractedText must be at most ${EXTRACTED_TEXT_MAX_LENGTH} characters`),
});

/** PATCH /api/scans/:scanId/comment body */
export const updateScanCommentBodySchema = z.object({
  comment: z.string().min(1, "comment is required"),
});

/** GET /api/scans query (cursor-based pagination) */
export const listScansQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional().default(20),
  cursor: z.string().optional(),
});

/** POST /api/auth/send-verification-code body */
export const sendVerificationCodeBodySchema = z.object({
  email: emailSchema,
});

/** POST /api/auth/verify-code body */
export const verifyCodeBodySchema = z.object({
  email: emailSchema,
  code: codeSchema,
});

/** GET /api/auth/check-email-verified query */
export const checkEmailVerifiedQuerySchema = z.object({
  email: emailSchema,
});

/** GET /api/auth/check-email-exists query */
export const checkEmailExistsQuerySchema = z.object({
  email: emailSchema,
});

/** POST /api/users/register body */
export const registerUserBodySchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

/** PATCH /api/users/me body */
export const updateUserBodySchema = z.object({
  language: z.enum(["ru", "en"]).optional(),
});

/** POST /api/iap/verify body */
export const iapVerifyBodySchema = z.object({
  productId: z.string().min(1, "productId is required"),
  purchaseToken: z.string().min(1, "purchaseToken is required"),
  orderId: z.string().optional(),
});

/** POST /api/ads/reward body */
export const adRewardBodySchema = z.object({
  token: z.string().min(1, "token is required"),
});

/** POST /api/feedback body */
export const feedbackBodySchema = z.object({
  subject: z.string().min(1, "subject is required").transform((s) => s.trim()),
  message: z.string().min(1, "message is required").transform((s) => s.trim()),
  email: z.string().email().optional().or(z.literal("")).transform((e) => (e === "" ? undefined : e)),
});

export type CreateScanBody = z.infer<typeof createScanBodySchema>;
export type UpdateScanCommentBody = z.infer<typeof updateScanCommentBodySchema>;
export type ListScansQuery = z.infer<typeof listScansQuerySchema>;
export type SendVerificationCodeBody = z.infer<typeof sendVerificationCodeBodySchema>;
export type VerifyCodeBody = z.infer<typeof verifyCodeBodySchema>;
export type RegisterUserBody = z.infer<typeof registerUserBodySchema>;
export type IapVerifyBody = z.infer<typeof iapVerifyBodySchema>;
export type AdRewardBody = z.infer<typeof adRewardBodySchema>;
export type FeedbackBody = z.infer<typeof feedbackBodySchema>;
