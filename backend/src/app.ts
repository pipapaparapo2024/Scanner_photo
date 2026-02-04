import express, { type Request, type Response } from "express";
import cors from "cors";
import helmet from "helmet";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const dotenv = require("dotenv");
import { firestore } from "./config/firebase";
import userRoutes from "./routes/users";
import scanRoutes from "./routes/scans";
import iapRoutes from "./routes/iap";
import adsRoutes from "./routes/ads";
import authRoutes from "./routes/auth";
import feedbackRoutes from "./routes/feedback";
import { globalErrorHandler } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimiter";

dotenv.config();

const app = express();

// Security headers (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// Настройка CORS
// В production ограничиваем источники, в development разрешаем все
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (мобильные приложения, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // В development режиме разрешаем все
    if (process.env.NODE_ENV !== "production") {
      return callback(null, true);
    }
    
    // В production проверяем whitelist
    if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    callback(new Error("CORS not allowed"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Общий rate limiter для API
app.use("/api", apiRateLimiter);
// Настройка для правильной обработки UTF-8 и кириллицы
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// Устанавливаем заголовок Content-Type для UTF-8
app.use((req, res, next) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  next();
});

// Health check: базовый статус + доступность Firestore (503 при недоступности БД)
app.get("/health", async (_req: Request, res: Response) => {
  try {
    await firestore.listCollections();
    res.json({ status: "ok", db: "ok" });
  } catch {
    res.status(503).json({ status: "unhealthy", db: "down" });
  }
});

app.use("/api/users", userRoutes);
app.use("/api/scans", scanRoutes);
app.use("/api/iap", iapRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/feedback", feedbackRoutes);

// Обработчик 404 — возвращаем JSON, чтобы клиент не получал HTML
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "NOT_FOUND",
    message: "Маршрут не найден. Проверьте URL и что бэкенд запущен (npm run dev в папке backend).",
  });
});

// Глобальный обработчик ошибок (должен быть последним)
app.use(globalErrorHandler);

export default app;


