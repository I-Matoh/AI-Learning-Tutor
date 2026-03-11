const path = require("path");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const protectedRoutes = require("./routes/protectedRoutes");
require("./config/supabaseAdmin");

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api", protectedRoutes);

// Serve built client assets
const clientBuildPath = path.join(__dirname, "..", "dist");
app.use(express.static(clientBuildPath));

// SPA fallback to index.html for any non-API route (regex avoids path-to-regexp parsing issues)
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(clientBuildPath, "index.html"));
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
