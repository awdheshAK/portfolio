/**
 * Email abstraction. When SMTP_HOST is unset (the local dev default) emails
 * are logged to the server console instead of sent, so password reset and
 * notification flows are fully testable on localhost without a mail server.
 */
import nodemailer from 'nodemailer';
import { env } from './env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!env.smtp.host) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.port === 465,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.password } : undefined,
  });
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string, text?: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    // Dev fallback: log rather than fail so the flow can be exercised locally.
    // eslint-disable-next-line no-console
    console.log(`\n----- [DEV EMAIL] -----\nTo: ${to}\nSubject: ${subject}\n${text ?? html}\n------------------------\n`);
    return;
  }
  await t.sendMail({ from: env.smtp.from, to, subject, html, text });
}

export function passwordResetEmail(resetUrl: string): { subject: string; html: string; text: string } {
  return {
    subject: 'Reset your StreamVault password',
    html: `<p>Someone requested a password reset for your StreamVault account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a>. This link expires in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>`,
    text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
  };
}
