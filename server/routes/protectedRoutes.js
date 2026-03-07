const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/profile", authMiddleware, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
    },
  });
});

module.exports = router;
