import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../utils/errors";

type SchemaTarget = "body" | "query" | "params";

/**
 * Middleware that validates req[target] with the given Zod schema.
 * On success, assigns the parsed value to req[target] and calls next().
 * On failure, throws ValidationError so globalErrorHandler returns 400.
 */
export function validate<T extends z.ZodType>(
  schema: T,
  target: SchemaTarget = "body"
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const raw = req[target];
    const result = schema.safeParse(raw);

    if (result.success) {
      (req as Record<string, unknown>)[target] = result.data;
      next();
      return;
    }

    const err = result.error as ZodError;
    const first = err.errors[0];
    const message = first
      ? `${first.path.join(".")}: ${first.message}`
      : "Validation failed";
    const field = first?.path?.[0] as string | undefined;
    throw new ValidationError(message, field);
  };
}
