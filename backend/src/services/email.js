import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter = null;

function getTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
      connectionTimeout: 4000,
      greetingTimeout: 4000,
      socketTimeout: 4000,
    });
  }
  return transporter;
}

export async function sendOtpEmail(toEmail, otpCode, type = 'VERIFY_EMAIL') {
  const isVerify = type === 'VERIFY_EMAIL';
  const subject = isVerify
    ? '🔐 Verify Your Email — Chat System'
    : '🔑 Reset Your Password — Chat System';
  const heading = isVerify ? 'Verify Your Email Address' : 'Reset Your Password';
  const subtext = isVerify
    ? 'Welcome to Chat System! Please use the 6-digit code below to verify your email and activate your account:'
    : 'We received a request to reset your password. Enter the 6-digit code below to choose a new password:';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { margin: 0; padding: 0; background-color: #121212; font-family: "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #ededed; }
        .container { max-width: 520px; margin: 40px auto; background-color: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 16px; overflow: hidden; }
        .header { background-color: #1e4d3b; padding: 28px; text-align: center; }
        .header h1 { margin: 0; color: #e8f6ee; font-size: 24px; font-weight: bold; }
        .body { padding: 32px; text-align: center; }
        .body p { font-size: 15px; line-height: 1.6; color: #cccccc; margin: 0 0 24px; }
        .otp-box { background-color: #0d261b; border: 2px dashed #2e7d5b; border-radius: 12px; padding: 18px; margin: 24px 0; display: inline-block; }
        .otp-code { font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #4ade80; font-family: monospace; }
        .expiry { font-size: 13px; color: #8f8f8f; margin-top: 16px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666666; border-top: 1px solid #262626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💬 Chat System</h1>
        </div>
        <div class="body">
          <h2 style="color: #ededed; margin-top: 0;">${heading}</h2>
          <p>${subtext}</p>
          <div class="otp-box">
            <span class="otp-code">${otpCode}</span>
          </div>
          <p class="expiry">⏳ This verification code is valid for <strong>10 minutes</strong>.</p>
          <p style="font-size: 12px; color: #888888; margin-top: 24px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} Chat System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  // 1. Brevo API (HTTPS Port 443 — Sends to ANY recipient without requiring custom domain)
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'nawanshusharma05@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'Chat System';

    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': brevoKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: toEmail }],
        subject,
        htmlContent: html,
      }),
    });

    const data = await res.json();
    if (res.status === 201 || (data && data.messageId)) {
      console.log(`📧 [Brevo] Real email delivered to ${toEmail} (ID: ${data.messageId})`);
      return { success: true, delivered: true, provider: 'brevo', id: data.messageId };
    } else {
      console.error('❌ [Brevo] Error:', data);
      throw new Error(data.message || 'Failed to send verification email via Brevo');
    }
  }

  // 2. Resend API (HTTPS Port 443)
  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.RESEND_FROM || 'Chat System <onboarding@resend.dev>';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [toEmail],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (res.ok && data.id) {
      console.log(`📧 [Resend] Real email delivered to ${toEmail} (ID: ${data.id})`);
      return { success: true, delivered: true, provider: 'resend', id: data.id };
    } else {
      console.error('❌ [Resend] Error:', data);
      throw new Error(data.message || 'Failed to send verification email via Resend');
    }
  }

  // 2. Gmail SMTP (if configured)
  const transport = getTransporter();
  if (transport) {
    const from = process.env.SMTP_FROM || `"Chat System" <${process.env.SMTP_USER}>`;
    const info = await Promise.race([
      transport.sendMail({ from, to: toEmail, subject, html }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SMTP timeout: port blocked by cloud host')), 4000)
      ),
    ]);
    console.log(`📧 [Gmail SMTP] Email sent to ${toEmail}: ${info.messageId}`);
    return { success: true, delivered: true, provider: 'smtp', id: info.messageId };
  }

  throw new Error('No email provider configured. Please set RESEND_API_KEY in environment variables.');
}
