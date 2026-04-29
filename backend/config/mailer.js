const nodemailer = require("nodemailer");

// Creates a transporter using Gmail (or any SMTP).
// For Gmail you need an App Password — see README for setup.
function createTransporter() {
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
}

// Sends a 6-digit OTP to the given email address.
async function sendOTPEmail(toEmail, otpCode, userName) {
  const transporter = createTransporter();

  const html = `
    <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; background: #0a0a0a; color: #f0f0f0; border-radius: 16px; overflow: hidden;">
      <div style="padding: 32px 36px; border-bottom: 1px solid #222;">
        <p style="font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #e8e000; margin: 0 0 6px;">AuthApp</p>
        <h1 style="font-size: 22px; font-weight: 700; margin: 0; color: #f0f0f0;">Verify your email</h1>
      </div>
      <div style="padding: 32px 36px;">
        <p style="color: #888; font-size: 15px; margin: 0 0 28px;">
          Hi ${userName}, use the code below to verify your account. It expires in <strong style="color: #bbb;">10 minutes</strong>.
        </p>
        <div style="background: #111; border: 1px solid #2e2e2e; border-radius: 12px; padding: 28px; text-align: center; margin-bottom: 28px;">
          <p style="font-family: 'Courier New', monospace; font-size: 42px; font-weight: 700; letter-spacing: 14px; color: #e8e000; margin: 0;">${otpCode}</p>
        </div>
        <p style="color: #555; font-size: 13px; margin: 0;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
      <div style="padding: 20px 36px; border-top: 1px solid #222;">
        <p style="color: #333; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} AuthApp. All rights reserved.</p>
      </div>
    </div>
  `;

  
  try {
    await transporter.sendMail({
      from: `"AuthApp" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `${otpCode} is your AuthApp verification code`,
      html,
    });

    console.log("✅ OTP email sent to:", toEmail);
  } catch (err) {
    console.error("❌ Email failed:", err);
  }
}

module.exports = { sendOTPEmail };
