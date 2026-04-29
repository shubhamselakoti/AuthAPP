# AuthApp — Full-Stack Authentication Starter

React + Node + Express + MongoDB with Google OAuth.  
Deploy frontend → **Netlify**, backend → **Render**.

---

## Project Structure

```
project/
├── frontend/   ← React app (deploy to Netlify)
└── backend/    ← Express API (deploy to Render)
```

---

## Step 1 — Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Add **Authorised JavaScript origins**:
   - `http://localhost:3000` (local dev)
   - `https://your-app.netlify.app` (production)
7. Add **Authorised redirect URIs**:
   - `http://localhost:3000`
   - `https://your-app.netlify.app`
8. Click **Create** — copy your **Client ID**

---

## Step 2 — MongoDB Atlas Setup

1. Go to [cloud.mongodb.com](https://cloud.mongodb.com) and create a free cluster
2. Create a database user (Settings → Database Access)
3. Allow network access from anywhere: `0.0.0.0/0` (Network Access)
4. Click **Connect → Drivers** and copy the connection string
5. Replace `<password>` with your database user's password

---

## Step 3 — Run Locally

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Fill in .env (see variables below)
npm run dev
```

**backend/.env variables:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
FRONTEND_URL=http://localhost:3000
PORT=5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Fill in .env
npm start
```

**frontend/.env variables:**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
```

Open [http://localhost:3000](http://localhost:3000)

---

## Step 4 — Deploy Backend to Render

1. Push the `backend/` folder to a GitHub repository
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your GitHub repo
4. Settings:
   - **Root Directory**: `backend` (if monorepo) or leave blank
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. Add **Environment Variables** (same as your `.env` but without quotes):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN` → `7d`
   - `GOOGLE_CLIENT_ID`
   - `FRONTEND_URL` → your Netlify URL (add after step 5)
6. Deploy — copy your Render URL (e.g. `https://authapp-api.onrender.com`)

> ⚠️ Free Render instances sleep after 15 min of inactivity. The app shows a
> "Waking up the server" screen automatically while it cold-starts (~15-30s).

---

## Step 5 — Deploy Frontend to Netlify

1. Push the `frontend/` folder to a GitHub repository
2. Go to [netlify.com](https://netlify.com) → **Add new site → Import from Git**
3. Connect your GitHub repo
4. Settings:
   - **Base directory**: `frontend` (if monorepo) or leave blank
   - **Build command**: `npm run build`
   - **Publish directory**: `build`
5. Add **Environment Variables** in Netlify dashboard:
   - `REACT_APP_API_URL` → your Render URL (from Step 4)
   - `REACT_APP_GOOGLE_CLIENT_ID` → your Google Client ID
6. Deploy

> The `public/_redirects` file is already included so React Router works on Netlify.

---

## Step 6 — Update CORS on Render

Go back to your Render service → **Environment** and update:
```
FRONTEND_URL=https://your-app.netlify.app
```
Then redeploy the backend.

---

## Step 7 — Update Google OAuth Origins

Go back to Google Cloud Console → your OAuth Client ID and add:
- Authorised JavaScript origins: `https://your-app.netlify.app`
- Authorised redirect URIs: `https://your-app.netlify.app`

---

## Features

- Email/password signup & login
- Google Sign-In (via Google Identity Services)
- JWT authentication (stored in localStorage)
- Protected routes (redirect to login if not authenticated)
- Profile page with editable display name
- Render cold-start loading screen with progress bar
- Session persistence on page refresh

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, React Router v6         |
| Styling   | Plain CSS (no Tailwind/UI libs)   |
| Backend   | Node.js, Express                  |
| Database  | MongoDB Atlas via Mongoose        |
| Auth      | JWT + bcryptjs + Google OAuth 2.0 |
| Hosting   | Netlify (frontend) + Render (API) |

---

## OTP Email Verification Setup

### How it works
1. User signs up → backend creates an unverified account and emails a 6-digit OTP
2. User enters the OTP on the `/verify-otp` screen → account is verified and they're logged in
3. If a user tries to log in without verifying, a fresh OTP is sent automatically
4. Resend button has a 60-second cooldown (enforced on both frontend and backend)
5. OTPs expire after 10 minutes
6. Google Sign-In accounts are auto-verified (no OTP needed)

### Gmail App Password setup (required for sending emails)

1. Go to your Google Account → **Security**
2. Enable **2-Step Verification** if not already on
3. Go to **Security → App Passwords**
4. Select app: **Mail**, device: **Other** → type "AuthApp" → click **Generate**
5. Copy the 16-character password shown

Add to your backend `.env`:
```
EMAIL_USER=your.gmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx   ← the App Password (spaces are fine)
```

Add to your Render environment variables:
- `EMAIL_USER` → your Gmail address  
- `EMAIL_PASS` → your Gmail App Password
