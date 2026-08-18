import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config({ override: true });

export async function sendOtpEmail(toEmail, otpName, otpCode) {
  const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const smtpPort = Number(process.env.SMTP_PORT) || 465;
  const smtpSecure = process.env.SMTP_SECURE !== "false"; // true for 465, false for 587
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER || "";
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || "";
  const fromAddress = process.env.SMTP_FROM_EMAIL || smtpUser || "no-reply@greensparrows.com";

  console.log(`[OTP Request] Generated OTP for ${toEmail}: ${otpCode}`);

  if (!smtpUser || !smtpPass) {
    console.warn("[Mailer] SMTP_USER or SMTP_PASS not set in environment. Email simulated in console.");
    return { success: true, simulated: true };
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const mailOptions = {
    from: `"Sparrows Real Estate" <${fromAddress}>`,
    to: toEmail,
    subject: "Sparrows - Password Reset OTP Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #FAF8F3;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #0F3D3E; margin: 0;">Sparrows Real Estate</h2>
          <p style="color: #6B7A78; font-size: 14px;">Password Reset Request</p>
        </div>
        <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #E8F0EA;">
          <p style="color: #22302E; font-size: 15px; margin-top: 0;">Hello <strong>${otpName || "User"}</strong>,</p>
          <p style="color: #22302E; font-size: 14px;">Use the following 6-digit OTP code to reset your account password:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1B5E4F; background: #E8F0EA; padding: 12px 24px; border-radius: 8px; display: inline-block; margin: 16px 0;">
            ${otpCode}
          </div>
          <p style="color: #6B7A78; font-size: 13px; margin-bottom: 0;">This OTP code will expire in <strong>15 minutes</strong>. Do not share this code with anyone.</p>
        </div>
        <p style="text-align: center; color: #6B7A78; font-size: 12px; margin-top: 20px;">If you did not request a password reset, please ignore this email.</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Mailer] OTP email successfully sent to ${toEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Mailer] Failed to send email via SMTP:", err);
    throw err;
  }
}
