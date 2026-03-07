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

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${port}`);
});
