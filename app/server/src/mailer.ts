import nodemailer, { type Transporter } from 'nodemailer';
import { config } from './config.js';

export interface OutgoingMail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

let transport: Transporter | null = null;

function getTransport(): Transporter | null {
  if (!config.smtp) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: config.smtp.user ? { user: config.smtp.user, pass: config.smtp.pass } : undefined,
    });
  }
  return transport;
}

export const mailerConfigured = () => config.smtp !== undefined;

/**
 * Returns true when the message was handed to an SMTP server. A false return
 * means no transport is configured (dev), so the caller must surface the
 * content another way rather than assuming the user received it.
 *
 * Send failures throw — a reset the user never gets should not look like success.
 */
export async function sendMail(mail: OutgoingMail): Promise<boolean> {
  const tx = getTransport();
  if (!tx) {
    console.log(
      `[mailer] No SMTP configured — not sending "${mail.subject}" to ${mail.to}.\n${mail.text}`
    );
    return false;
  }
  await tx.sendMail({
    from: config.mailFrom,
    to: mail.to,
    subject: mail.subject,
    text: mail.text,
    html: mail.html,
  });
  return true;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Shared shell so every email reads as the same product. */
function layout(heading: string, bodyHtml: string, footer?: string): string {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#0d0d0d;color:#fafafa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <div style="max-width:520px;margin:0 auto">
    <p style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#84868c;margin:0 0 24px">Winterwork</p>
    <h1 style="font-size:22px;font-weight:800;letter-spacing:-.02em;margin:0 0 16px">${escapeHtml(heading)}</h1>
    ${bodyHtml}
    ${footer ? `<p style="font-size:12px;color:#5b5d63;margin:32px 0 0;border-top:1px solid rgba(255,255,255,.08);padding-top:16px">${footer}</p>` : ''}
  </div>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<p style="margin:24px 0"><a href="${escapeHtml(href)}" style="display:inline-block;background:#fafafa;color:#0d0d0d;text-decoration:none;font-weight:700;font-size:15px;padding:14px 24px;border-radius:999px">${escapeHtml(label)}</a></p>`;
}

export function passwordResetMail(to: string, resetUrl: string): OutgoingMail {
  return {
    to,
    subject: 'Reset your Winterwork password',
    text: `Someone asked to reset the password for this Winterwork account.\n\nOpen this link to choose a new one:\n${resetUrl}\n\nThe link works once and expires in 30 minutes. If this wasn't you, ignore this email — nothing has changed.`,
    html: layout(
      'Reset your password',
      `<p style="font-size:15px;line-height:1.6;color:#c9cace;margin:0">Someone asked to reset the password for this Winterwork account.</p>
       ${button(resetUrl, 'Choose a new password')}
       <p style="font-size:13px;line-height:1.6;color:#84868c;margin:0">The link works once and expires in 30 minutes.</p>`,
      "If this wasn't you, ignore this email — nothing has changed."
    ),
  };
}

export function dailyReminderMail(
  to: string,
  opts: { remaining: number; total: number; unsubscribeUrl: string; appUrl: string }
): OutgoingMail {
  const { remaining, total, unsubscribeUrl, appUrl } = opts;
  // Pluralise on the total, not the remainder: "1 of 2 habits", "1 of 1 habit".
  const line = `${remaining} of ${total} ${total === 1 ? 'habit' : 'habits'} still open today.`;
  return {
    to,
    subject: `${remaining} ${remaining === 1 ? 'habit' : 'habits'} left today`,
    text: `${line}\n\nOpen Winterwork: ${appUrl}/today\n\nStop these reminders: ${unsubscribeUrl}`,
    html: layout(
      line,
      `<p style="font-size:15px;line-height:1.6;color:#c9cace;margin:0">Close them out, or decide not to — either way the record is yours.</p>
       ${button(`${appUrl}/today`, 'Open today')}`,
      `<a href="${escapeHtml(unsubscribeUrl)}" style="color:#84868c">Stop these reminders</a>`
    ),
  };
}
