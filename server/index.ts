import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = parseInt(process.env.PORT || "5001");

app.use(express.json());

// ─── API routes ───────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ─── Dev: proxy to Vite ───────────────────────────────────────────────────────
if (process.env.NODE_ENV === "development") {
  const { createServer } = await import("vite");
  const vite = await createServer({
    root: path.resolve(__dirname, "../client"),
    server: { middlewareMode: true },
    appType: "spa",
    configFile: path.resolve(__dirname, "../vite.config.ts"),
  });
  app.use(vite.middlewares);
} else {
  // Production: serve built files
  const dist = path.resolve(__dirname, "../dist/public");
  app.use(express.static(dist));
  app.get("*", (_req, res) => res.sendFile(path.join(dist, "index.html")));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`[TorApp] Server running on http://0.0.0.0:${PORT}`);
});
