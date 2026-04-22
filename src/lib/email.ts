import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

const env = getServerEnv();
const EMAIL_HOST = env.EMAIL_HOST;
const EMAIL_PORT = parseInt(env.EMAIL_PORT || "587");
const EMAIL_USER = env.EMAIL_USER;
const EMAIL_PASS = env.EMAIL_PASS;
const EMAIL_FROM = env.EMAIL_FROM || "Topchart  <noreply@topchart.store>";

function createTransporter() {
  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    return null;
  }
  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[EMAIL] No SMTP config — would send to ${to}: ${subject}`);
    return false;
  }
  try {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html });
    return true;
  } catch (error) {
    console.error("[EMAIL] Send failed:", error);
    return false;
  }
}

export async function sendResellerApprovalEmail(
  to: string,
  businessName: string,
  resellerCode: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: "🎉 Your Topchart Reseller Application is Approved!",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#0052CC;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Topchart </h1>
        </div>
        <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
          <h2 style="color:#111827;margin-top:0">Congratulations, ${businessName}!</h2>
          <p style="color:#374151;line-height:1.6">
            Your reseller application has been <strong style="color:#16a34a">approved</strong>. 
            You now have access to wholesale pricing and the full reseller dashboard.
          </p>
          <div style="background:#fff;border:1px solid #d1fae5;border-radius:8px;padding:16px;margin:24px 0;text-align:center">
            <p style="color:#6b7280;margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.05em">Your Reseller Code</p>
            <p style="color:#0052CC;font-size:28px;font-weight:700;font-family:monospace;margin:0">${resellerCode}</p>
          </div>
          <p style="color:#374151;line-height:1.6">
            Share your reseller code with customers to earn commissions on every purchase they make.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://topchart.store"}/dashboard/reseller"
             style="display:inline-block;background:#0052CC;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
            Go to Reseller Dashboard
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">
            Topchart  · Your trusted mobile top-up platform
          </p>
        </div>
      </div>
    `,
  });
}

export async function sendResellerRejectionEmail(
  to: string,
  businessName: string,
  reason: string
): Promise<boolean> {
  return sendEmail({
    to,
    subject: "Your Topchart Reseller Application Status",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px">
        <div style="background:#0052CC;padding:24px;border-radius:8px 8px 0 0;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Topchart </h1>
        </div>
        <div style="background:#f9f9f9;padding:32px;border-radius:0 0 8px 8px;border:1px solid #e5e7eb">
          <h2 style="color:#111827;margin-top:0">Application Update for ${businessName}</h2>
          <p style="color:#374151;line-height:1.6">
            After reviewing your reseller application, we were unable to approve it at this time.
          </p>
          <div style="background:#fff;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:24px 0">
            <p style="color:#6b7280;margin:0 0 8px;font-size:13px;font-weight:600">Reason:</p>
            <p style="color:#374151;margin:0;line-height:1.6">${reason}</p>
          </div>
          <p style="color:#374151;line-height:1.6">
            You are welcome to address the above and reapply at any time from your dashboard.
          </p>
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://topchart.store"}/dashboard/reseller/apply"
             style="display:inline-block;background:#0052CC;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:8px">
            Apply Again
          </a>
          <p style="color:#9ca3af;font-size:12px;margin-top:32px">
            Topchart  · Your trusted mobile top-up platform
          </p>
        </div>
      </div>
    `,
  });
}
