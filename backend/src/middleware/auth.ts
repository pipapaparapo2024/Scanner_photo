import type { Request, Response, NextFunction } from "express";
import { auth } from "../config/firebase";

export interface AuthUser {
  uid: string;
  email?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const idToken = authHeader.substring("Bearer ".length);
    const decoded = await auth.verifyIdToken(idToken);

    req.user = { uid: decoded.uid, email: decoded.email };
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid auth token" });
  }
}


