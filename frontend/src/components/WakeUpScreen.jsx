import React from "react";
import "./WakeUpScreen.css";

// Shown while we wait for the Render backend to wake up from sleep.
export default function WakeUpScreen({ attempt }) {
  const dots = attempt % 4; // cycles 0→1→2→3→0 for animated ellipsis feel

  return (
    <div className="wakeup-overlay">
      <div className="wakeup-card">
        <div className="wakeup-spinner">
          <span></span>
          <span></span>
          <span></span>
        </div>

        <h2 className="wakeup-title">Waking up the server</h2>

        <p className="wakeup-desc">
          The backend runs on Render's free tier, which sleeps after inactivity.
          <br />
          This usually takes <strong>10–30 seconds</strong> — hang tight!
        </p>

        <div className="wakeup-bar-track">
          <div
            className="wakeup-bar-fill"
            style={{ width: `${Math.min((attempt / 20) * 100, 95)}%` }}
          />
        </div>

        <p className="wakeup-attempt">
          Attempt {attempt} of ~20{"...".slice(0, dots + 1)}
        </p>
      </div>
    </div>
  );
}
