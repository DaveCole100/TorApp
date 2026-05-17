import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "3000");

app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

const vite = await createViteServer({
  root: path.resolve(__dirname, "../client"),
  server: { middlewareMode: true },
  appType: "spa",
  configFile: path.resolve(__dirname, "../vite.config.ts"),
});

app.use(vite.middlewares);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[TorApp] Running on http://0.0.0.0:${PORT}`);
});
