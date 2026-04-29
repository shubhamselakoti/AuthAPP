const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");

const User = require("../models/User");
const { sendOTPEmail } = require("../config/mailer");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── Helpers ──────────────────────────────────────────────────────────────────

function signToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Generates a 6-digit numeric OTP and returns { plain, hashed }
async function generateOTP() {
  const plain = String(Math.floor(100000 + Math.random() * 900000));
  const hashed = await bcrypt.hash(plain, 10);
  return { plain, hashed };
}

// Saves OTP to the user doc and sends the email. Returns lastSentAt.
async function issueOTP(user) {
  const { plain, hashed } = await generateOTP();
  const now = new Date();

  user.otp = {
    code:       hashed,
    expiresAt:  new Date(now.getTime() + 10 * 60 * 1000), // 10 minutes
    lastSentAt: now,
  };
  await user.save();

  await sendOTPEmail(user.email, plain, user.name);
  return now;
}

// ── POST /api/auth/signup ────────────────────────────────────────────────────
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      // If the account exists but is unverified, resend OTP instead of erroring
      if (!existing.isVerified && existing.provider === "local") {
        await issueOTP(existing);
        return res.status(200).json({
          message: "Account exists but is unverified. A new OTP has been sent.",
          requiresVerification: true,
          email: existing.email,
        });
      }
      return res.status(409).json({ message: "Email already in use." });
    }

    // Create unverified user
    const user = await User.create({
      name,
      email,
      password,
      provider: "local",
      isVerified: false,
    });

    await issueOTP(user);

    res.status(201).json({
      message: "Account created. Please check your email for the OTP.",
      requiresVerification: true,
      email: user.email,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Something went wrong during signup." });
  }
});

// ── POST /api/auth/verify-otp ────────────────────────────────────────────────
router.post("/verify-otp", async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }
    if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }
    if (new Date() > user.otp.expiresAt) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    const isMatch = await bcrypt.compare(otp, user.otp.code);
    if (!isMatch) {
      return res.status(400).json({ message: "Incorrect OTP. Please try again." });
    }

    // Mark verified and clear OTP
    user.isVerified = true;
    user.otp = { code: null, expiresAt: null, lastSentAt: null };
    await user.save();

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ message: "Something went wrong during verification." });
  }
});

// ── POST /api/auth/resend-otp ────────────────────────────────────────────────
router.post("/resend-otp", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }

    // Enforce 60-second cooldown between resends
    if (user.otp && user.otp.lastSentAt) {
      const secondsSinceLast = (Date.now() - new Date(user.otp.lastSentAt).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLast);
        return res.status(429).json({
          message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
          waitSeconds,
        });
      }
    }

    await issueOTP(user);
    res.json({ message: "A new OTP has been sent to your email." });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Something went wrong. Please try again." });
  }
});

// ── POST /api/auth/login ─────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    // Block login for unverified local accounts
    if (!user.isVerified && user.provider === "local") {
      // Auto-send a fresh OTP so they can verify right away
      await issueOTP(user);
      return res.status(403).json({
        message: "Please verify your email first. A new OTP has been sent.",
        requiresVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Something went wrong during login." });
  }
});

// ── POST /api/auth/google ────────────────────────────────────────────────────
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({ message: "Google credential is required." });
    }

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Google accounts are auto-verified
      user = await User.create({
        name,
        email,
        googleId,
        avatar: picture,
        provider: "google",
        isVerified: true,
      });
    } else if (!user.googleId) {
      user.googleId = googleId;
      user.avatar = user.avatar || picture;
      user.provider = "google";
      user.isVerified = true;
      await user.save();
    }

    const token = signToken(user._id);
    res.json({ token, user });
  } catch (err) {
    console.error("Google auth error:", err);
    res.status(401).json({ message: "Google authentication failed." });
  }
});

module.exports = router;
