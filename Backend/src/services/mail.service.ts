import config from "../config";

/**
 * Brevo (https://www.brevo.com) transactional email via HTTP API.
 * Uses native fetch so no extra SDK dependency is required.
 * Docs: POST https://api.brevo.com/v3/smtp/email with `api-key` header.
 */

interface SendEmailInput {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function sendEmailViaBrevo(input: SendEmailInput): Promise<void> {
  const { to, toName, subject, htmlContent, textContent } = input;

  if (!config.brevoApiKey) {
    // Dev fallback: don't break registration when Brevo isn't configured.
    // eslint-disable-next-line no-console
    console.log(`[mail] BREVO_API_KEY missing — skipping send to ${to}. Subject: ${subject}`);
    return;
  }

  const res = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": config.brevoApiKey,
    },
    body: JSON.stringify({
      sender: { name: config.brevoSenderName, email: config.brevoSenderEmail },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent,
      textContent: textContent || subject,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brevo send failed (${res.status}): ${body}`);
  }
}

export function buildVerificationUrl(rawToken: string): string {
  const base = config.frontendUrl.replace(/\/$/, "");
  return `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
}

export function buildPasswordResetUrl(rawToken: string): string {
  const base = config.frontendUrl.replace(/\/$/, "");
  return `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
}

export async function sendVerificationEmail(to: string, name: string, verifyUrl: string): Promise<void> {
  const subject = "Confirm your ESIA email address";
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#382530">
      <h2 style="margin:0 0 12px">Welcome to ESIA, ${escapeHtml(name)}!</h2>
      <p style="margin:0 0 16px">Please confirm your email address to activate your account.</p>
      <a href="${verifyUrl}" style="display:inline-block;background:#382530;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Confirm my email</a>
      <p style="margin:16px 0 0;font-size:13px;color:#6b5460">Or copy this link into your browser:<br/><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p style="margin:16px 0 0;font-size:12px;color:#999">This link expires in ${config.emailVerificationExpiresHours} hours. If you did not create this account, ignore this email.</p>
    </div>`;
  const textContent = `Welcome to ESIA! Confirm your email: ${verifyUrl} (expires in ${config.emailVerificationExpiresHours} hours)`;

  await sendEmailViaBrevo({ to, toName: name, subject, htmlContent, textContent });
}

export async function sendPasswordResetEmail(to: string, name: string, resetUrl: string): Promise<void> {
  const subject = "Reset your ESIA password";
  const htmlContent = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#382530">
      <h2 style="margin:0 0 12px">Hi ${escapeHtml(name)},</h2>
      <p style="margin:0 0 16px">We received a request to reset your ESIA password. Click the button below to choose a new one.</p>
      <a href="${resetUrl}" style="display:inline-block;background:#382530;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold">Reset my password</a>
      <p style="margin:16px 0 0;font-size:13px;color:#6b5460">Or copy this link into your browser:<br/><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="margin:16px 0 0;font-size:12px;color:#999">This link expires in ${config.passwordResetExpiresMinutes} minutes and can only be used once. If you did not request this, ignore this email — your password stays unchanged.</p>
    </div>`;
  const textContent = `Reset your ESIA password: ${resetUrl} (expires in ${config.passwordResetExpiresMinutes} minutes, single-use)`;

  await sendEmailViaBrevo({ to, toName: name, subject, htmlContent, textContent });
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}
