import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = Number(process.env.PORT ?? 5000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.use(helmet());
app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "backend", time: new Date().toISOString() });
});

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "api", time: new Date().toISOString() });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend listening on http://localhost:${PORT}`);
});
