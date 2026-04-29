// Central place for all API calls.
// The wakeUp() function pings Render before real requests so we can show
// a "warming up" screen to the user instead of a silent hang.

const BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// ── Low-level fetch wrapper ──────────────────────────────────────────────────
async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

// ── Wake up Render (cold-start) ──────────────────────────────────────────────
// Returns true once the server responds. Poll until it does.
export async function wakeUp(onRetry) {
  const MAX_ATTEMPTS = 20;   // up to ~40 seconds
  const DELAY = 2000;        // 2 s between tries

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(`${BASE}/ping`, { method: "GET" });
      if (res.ok) return true;
    } catch (_) {
      // Server not yet up — keep trying
    }
    if (onRetry) onRetry(i + 1);
    await new Promise((r) => setTimeout(r, DELAY));
  }

  return false; // Could not wake up after MAX_ATTEMPTS
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const signup = (name, email, password) =>
  request("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const login = (email, password) =>
  request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

export const googleAuth = (credential) =>
  request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
  });

// ── User ─────────────────────────────────────────────────────────────────────
export const getMe = () => request("/api/user/me");

export const updateMe = (name) =>
  request("/api/user/me", {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

// ── OTP ──────────────────────────────────────────────────────────────────────
export const verifyOTP = (email, otp) =>
  request("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });

export const resendOTP = (email) =>
  request("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
