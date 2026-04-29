const express = require("express");
const router = express.Router();
const protect = require("../middleware/protect");
const User = require("../models/User");

// ── GET /api/user/me ─────────────────────────────────────────────────────────
// Returns the logged-in user's profile (used on page refresh to rehydrate).
router.get("/me", protect, (req, res) => {
  res.json({ user: req.user });
});

// ── PATCH /api/user/me ───────────────────────────────────────────────────────
// Update display name.
router.patch("/me", protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ message: "Name cannot be empty." });
    }

    req.user.name = name.trim();
    await req.user.save();

    res.json({ user: req.user });
  } catch (err) {
    console.error("Update user error:", err);
    res.status(500).json({ message: "Failed to update profile." });
  }
});

module.exports = router;
