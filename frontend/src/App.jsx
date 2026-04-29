import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import PrivateRoute     from "./components/PrivateRoute";
import WakeUpScreen     from "./components/WakeUpScreen";

import LoginPage     from "./pages/LoginPage";
import SignupPage    from "./pages/SignupPage";
import OTPPage       from "./pages/OTPPage";
import DashboardPage from "./pages/DashboardPage";

import "./index.css";

export default function App() {
  const [serverStatus, setServerStatus] = useState("idle");
  const [wakeAttempt,  setWakeAttempt]  = useState(0);

  useEffect(() => {
    const apiUrl   = process.env.REACT_APP_API_URL || "";
    const isRemote = apiUrl.startsWith("https://");

    if (!isRemote) {
      setServerStatus("ready");
      return;
    }

    setServerStatus("waking");

    import("./utils/api").then(({ wakeUp }) => {
      wakeUp((attempt) => setWakeAttempt(attempt)).then((ok) => {
        setServerStatus(ok ? "ready" : "failed");
      });
    });
  }, []);

  if (serverStatus === "idle" || serverStatus === "waking") {
    return <WakeUpScreen attempt={wakeAttempt} />;
  }

  if (serverStatus === "failed") {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f0f0f0",
          fontFamily: "Sora, sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>⚠️</p>
          <h2 style={{ marginBottom: "0.6rem" }}>Server isn't responding</h2>
          <p style={{ color: "#888", marginBottom: "1.4rem" }}>
            The backend might be down. Please try again in a minute.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: "0.7rem 1.4rem",
              background: "#e8e000",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontFamily: "Sora, sans-serif",
              fontWeight: 600,
              fontSize: "0.95rem",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/signup"     element={<SignupPage />} />
          <Route path="/verify-otp" element={<OTPPage />} />

          {/* Protected route */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardPage />
              </PrivateRoute>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
