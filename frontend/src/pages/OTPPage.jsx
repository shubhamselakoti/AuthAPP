import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { verifyOTP, resendOTP } from "../utils/api";
import "./OTPPage.css";

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function OTPPage() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { saveSession } = useAuth();

  // Email passed via router state from signup/login
  const email = location.state?.email || "";

  // Redirect away if we landed here without an email
  useEffect(() => {
    if (!email) navigate("/signup", { replace: true });
  }, [email, navigate]);

  // ── OTP input — one box per digit ─────────────────────────────────────────
  const [digits, setDigits]   = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs             = useRef([]);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [error, setError]         = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [verifying, setVerifying] = useState(false);

  // ── Resend cooldown timer ─────────────────────────────────────────────────
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    startCountdown();
    return () => clearInterval(timerRef.current);
  }, []); // eslint-disable-line

  function startCountdown(from = RESEND_COOLDOWN) {
    clearInterval(timerRef.current);
    setCountdown(from);
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ── Digit input handlers ──────────────────────────────────────────────────
  function handleDigitChange(index, value) {
    // Accept only a single digit
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError("");

    // Auto-advance focus
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (digit && next.every((d) => d !== "")) {
      submitOTP(next.join(""));
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle paste — spread digits across boxes
  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setDigits(next);
    // Focus the last filled box
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
    if (pasted.length === OTP_LENGTH) submitOTP(pasted);
  }

  // ── Verify ────────────────────────────────────────────────────────────────
  async function submitOTP(code) {
    setError("");
    setVerifying(true);
    try {
      const data = await verifyOTP(email, code);
      saveSession(data.token, data.user);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message);
      // Clear boxes on failure so user can retry easily
      setDigits(Array(OTP_LENGTH).fill(""));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  }

  function handleVerifyClick() {
    const code = digits.join("");
    if (code.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }
    submitOTP(code);
  }

  // ── Resend ────────────────────────────────────────────────────────────────
  async function handleResend() {
    if (countdown > 0 || resending) return;
    setError("");
    setSuccessMsg("");
    setResending(true);
    try {
      await resendOTP(email);
      setSuccessMsg("A new OTP has been sent to your email.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      startCountdown();
    } catch (err) {
      // Backend may tell us the exact wait time
      if (err.waitSeconds) startCountdown(err.waitSeconds);
      setError(err.message);
    } finally {
      setResending(false);
    }
  }

  const allFilled = digits.every((d) => d !== "");

  return (
    <div className="auth-page">
      <div className="auth-card otp-card">
        <span className="auth-logo">AuthApp</span>

        <div className="otp-icon">📬</div>
        <h1 className="auth-heading">Check your email</h1>
        <p className="auth-subheading">
          We sent a 6-digit code to <strong className="otp-email">{email}</strong>
        </p>

        {error      && <div className="alert alert-error">{error}</div>}
        {successMsg && <div className="alert alert-success">{successMsg}</div>}

        {/* Digit boxes */}
        <div className="otp-boxes" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              className={`otp-box ${digit ? "otp-box--filled" : ""} ${verifying ? "otp-box--loading" : ""}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={verifying}
              autoFocus={i === 0}
            />
          ))}
        </div>

        {/* Verify button */}
        <button
          className="btn-primary"
          onClick={handleVerifyClick}
          disabled={!allFilled || verifying}
          style={{ marginTop: "1.4rem" }}
        >
          {verifying ? (
            <><span className="spinner-inline" />Verifying…</>
          ) : (
            "Verify email"
          )}
        </button>

        {/* Resend section */}
        <div className="otp-resend">
          <span className="otp-resend-text">Didn't receive the code?</span>
          {countdown > 0 ? (
            <span className="otp-countdown">Resend in {countdown}s</span>
          ) : (
            <button
              className="otp-resend-btn"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? "Sending…" : "Resend OTP"}
            </button>
          )}
        </div>

        <p className="auth-footer">
          <Link to="/signup">← Use a different email</Link>
        </p>
      </div>
    </div>
  );
}
