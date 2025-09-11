import express, { Application } from "express";
import helmet from "helmet";
import cors from "cors";
import expressWinston from "express-winston";
import cookieParser from "cookie-parser";

import logger from "@config/logger";
import session from "express-session";
import { RedisStore } from "connect-redis";
import redisClient from "@config/redis";
import env from "@config/env";
import mainRoutes from "@routes/index";
import { errorHandler } from "@middlewares/errorHandler";

import path from "path";

const app: Application = express();

// 1. Security Middleware
app.use(helmet());
app.use(
  cors({
    // Allow all origins
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

// 2. Logging Middleware
app.use(
  expressWinston.logger({
    winstonInstance: logger,
    meta: true, // Incluye meta información sobre la solicitud
    msg: "HTTP {{req.method}} {{req.url}}",
    expressFormat: true, // Usa el formato de Express para los logs
    colorize: false,
  })
);

// 3. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 4. Session Middleware
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: env.NODE_ENV === "production", // Solo en producción
      sameSite: env.NODE_ENV === "production" ? "none" : "lax", // Configuración para cookies en producción
      maxAge: 1000 * 60 * 60 * 24, // 1 día
    },
  })
);

// Servir archivos estáticos de /uploads
const uploadsPath = path.join(process.cwd(), "uploads");
app.use(
  "/uploads",
  express.static(uploadsPath, {
    maxAge: "1d", // Cache por 1 día
    setHeaders: (res) => {
      // Agregar headers CORS para las imágenes
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET");
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  })
);

// 5. Routes Middleware
app.use("/", mainRoutes);

// 6. Error Handling Middleware
app.use(errorHandler);

export default app;
