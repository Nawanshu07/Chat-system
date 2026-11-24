import nodemailer from 'nodemailer';

export async function sendOtpEmail(toEmail, code, type) {
  const verify = type === 'VERIFY_EMAIL';
  const subject = verify ? 'Verify your Xwhispers email' : 'Reset your Xwhispers password';
  const text = subject + '\n\nYour code is ' + code + '. It expires in 10 minutes.';
  const env = process.env;
  let response;

  if (env.BREVO_API_KEY) {
    response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': env.BREVO_API_KEY },
      body: JSON.stringify({
        sender: { email: env.BREVO_SENDER_EMAIL || 'nawanshusharma05@gmail.com', name: env.BREVO_SENDER_NAME || 'Xwhispers' },
        to: [{ email: toEmail }], subject, textContent: text,
      }),
    });
  } else if (env.RESEND_API_KEY) {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + env.RESEND_API_KEY },
      body: JSON.stringify({ from: env.RESEND_FROM || 'Xwhispers <onboarding@resend.dev>', to: [toEmail], subject, text }),
    });
  } else if (env.SMTP_USER && env.SMTP_PASS) {
    const transport = nodemailer.createTransport({
      service: 'gmail', auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
      connectionTimeout: 4000, greetingTimeout: 4000, socketTimeout: 4000,
    });
    await transport.sendMail({ from: env.SMTP_FROM || 'Xwhispers <' + env.SMTP_USER + '>', to: toEmail, subject, text });
    return;
  } else {
    throw new Error('Email delivery is not configured.');
  }
  if (!response.ok) throw new Error('Could not send the email. Please try again.');
}
