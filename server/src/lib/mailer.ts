import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export async function sendOTPEmail(email: string, otp: string) {
  const mailOptions = {
    from: `"BHVR Platform" <${process.env.SMTP_USER}>`,
    to: email,
    subject: "Your Password Reset OTP",
    html: `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 24px;">
        <h1 style="color: #ef4444; font-weight: 900; letter-spacing: -2px; font-style: italic;">BHVR</h1>
        <h2 style="color: #0f172a; margin-top: 40px;">Password Reset Request</h2>
        <p style="color: #64748b; line-height: 1.6;">You requested a password reset for your account. Use the code below to proceed. This code expires in 10 minutes.</p>
        <div style="background: #fef2f2; border: 2px dashed #fecaca; padding: 20px; text-align: center; border-radius: 16px; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: 900; letter-spacing: 10px; color: #ef4444;">${otp}</span>
        </div>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 40px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] OTP sent to ${email}`);
  } catch (error: any) {
    console.error("[ERROR] Failed to send email:", error);
    throw new Error(`Email Error: ${error.message}`);
  }
}
