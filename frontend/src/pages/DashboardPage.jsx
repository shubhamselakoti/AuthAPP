import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { updateMe } from "../utils/api";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuth();

  const [editName, setEditName]     = useState(user?.name || "");
  const [saving, setSaving]         = useState(false);
  const [saveMsg, setSaveMsg]       = useState("");
  const [saveError, setSaveError]   = useState("");

  function handleLogout() {
    logout();
    navigate("/login");
  }

  async function handleSaveName(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    setSaving(true);
    setSaveMsg("");
    setSaveError("");

    try {
      const data = await updateMe(editName.trim());
      setUser(data.user);
      setSaveMsg("Name updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // First letter of name for avatar placeholder
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "?";

  // Format join date
  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="dashboard-page">
      {/* ── Navbar ── */}
      <nav className="navbar">
        <span className="navbar-logo">AuthApp</span>
        <button className="btn-logout" onClick={handleLogout}>
          Sign out
        </button>
      </nav>

      {/* ── Body ── */}
      <main className="dashboard-body">
        <h1 className="dashboard-greeting">
          Hey, <span>{user?.name?.split(" ")[0] || "there"}</span> 👋
        </h1>
        <p className="dashboard-subtitle">
          You're logged in. Here's your profile.
        </p>

        <div className="profile-card">
          <h3>Profile</h3>

          {/* Avatar */}
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="profile-avatar"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="profile-avatar-placeholder">{initials}</div>
          )}

          {/* Name (editable) */}
          <div className="profile-row">
            <label>Display name</label>
            <form className="edit-name-form" onSubmit={handleSaveName}>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your name"
                required
              />
              <button className="btn-save" type="submit" disabled={saving}>
                {saving ? <span className="spinner-inline" /> : "Save"}
              </button>
            </form>
            {saveMsg   && <p style={{ color: "var(--success)", fontSize: "0.82rem", marginTop: "0.4rem" }}>{saveMsg}</p>}
            {saveError && <p style={{ color: "var(--danger)",  fontSize: "0.82rem", marginTop: "0.4rem" }}>{saveError}</p>}
          </div>

          {/* Email */}
          <div className="profile-row">
            <label>Email address</label>
            <p>{user?.email}</p>
          </div>

          {/* Auth provider */}
          <div className="profile-row">
            <label>Signed in via</label>
            <span className="tag-badge">
              {user?.provider === "google" ? "Google" : "Email & Password"}
            </span>
          </div>

          {/* Join date */}
          <div className="profile-row">
            <label>Member since</label>
            <p>{joinDate}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
