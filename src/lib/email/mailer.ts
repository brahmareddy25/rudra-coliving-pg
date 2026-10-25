import nodemailer from "nodemailer";

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Creates and configures Nodemailer transporter based on environment variables
 */
function getTransporter() {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER?.trim();
  const rawPass = process.env.SMTP_PASS?.trim();
  const pass = rawPass ? rawPass.replace(/\s+/g, "") : "";

  if (user && pass) {
    if (host.includes("gmail")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user, pass },
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  return null;
}

/**
 * Dispatches a 6-digit Password Reset OTP to the resident's email address
 */
export async function sendEmailOTP(
  toEmail: string,
  otp: string,
  residentName: string = "Resident"
): Promise<EmailResult> {
  const cleanEmail = toEmail.trim().toLowerCase();
  const fromAddress = process.env.SMTP_FROM || '"Rudra Co-Living" <no-reply@rudracoliving.com>';

  if (process.env.NODE_ENV === "development") {
    console.log(`[Email OTP Service] Dispatching verification code to ${cleanEmail}`);
  }

  const transporter = getTransporter();

  // HTML email template with Rudra Co-Living branding
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Rudra Co-Living Password Reset</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #020617; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 40px auto; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px; background: linear-gradient(135deg, #1e1b4b, #0f172a); border-bottom: 1px solid #334155; text-align: center;">
              <h1 style="margin: 0; color: #fbbf24; font-size: 24px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">
                RUDRA CO-LIVING
              </h1>
              <p style="margin: 6px 0 0; color: #94a3b8; font-size: 13px; letter-spacing: 0.5px;">
                Secure Resident Portal Access
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 40px;">
              <p style="margin: 0 0 16px; font-size: 16px; color: #f1f5f9;">
                Hello <strong>${residentName}</strong>,
              </p>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #94a3b8;">
                We received a request to reset your password for your Rudra Co-Living resident account. Use the one-time verification code below to complete the reset process:
              </p>

              <!-- OTP Box -->
              <div style="background-color: #020617; border: 1px solid #3b82f6; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <div style="font-size: 12px; color: #38bdf8; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">
                  Your Verification Code
                </div>
                <div style="font-size: 36px; font-weight: 800; color: #fbbf24; letter-spacing: 8px; font-family: monospace;">
                  ${otp}
                </div>
                <div style="font-size: 12px; color: #64748b; margin-top: 8px;">
                  Code expires in <strong>5 minutes</strong>
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background-color: #1e293b; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 6px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #cbd5e1;">
                  <strong>Security Reminder:</strong> Never share this code with anyone. Rudra Co-Living staff will never ask for your verification code. If you did not request this password reset, please contact property administration immediately.
                </p>
              </div>

              <p style="margin: 0; font-size: 13px; color: #64748b; line-height: 1.5;">
                Best regards,<br>
                <strong style="color: #94a3b8;">Rudra Co-Living Management Team</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #020617; border-top: 1px solid #1e293b; text-align: center; font-size: 11px; color: #475569;">
              This is an automated security transmission. Please do not reply directly to this email.
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  if (!transporter) {
    if (process.env.NODE_ENV === "test") {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
      };
    }
    console.warn(`[Email OTP Service] SMTP credentials not configured for ${cleanEmail}`);
    return {
      success: false,
      error: "Email service not configured. Please contact administration.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject: `Your Rudra Co-Living Verification Code: ${otp}`,
      text: `Hello ${residentName},\n\nYour Rudra Co-Living password reset verification code is: ${otp}\n\nThis code is valid for 5 minutes. Do not share this code with anyone.\n\nBest regards,\nRudra Co-Living Management`,
      html: htmlContent,
    });

    console.log(`[Email OTP Service] Dispatched successfully. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email OTP Service] SMTP Send Error:", error);
    return {
      success: false,
      error: error.message || "Failed to dispatch email",
    };
  }
}

/**
 * Generic email dispatcher for alerts, test emails, and administrative notices
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<EmailResult> {
  const cleanEmail = to.trim().toLowerCase();
  const fromAddress = process.env.SMTP_FROM || '"Rudra Co-Living" <no-reply@rudracoliving.com>';
  const transporter = getTransporter();

  if (!transporter) {
    if (process.env.NODE_ENV === "test") {
      return {
        success: true,
        messageId: `msg_${Date.now()}`,
      };
    }
    console.warn(`[Email Service] SMTP credentials not configured for ${cleanEmail}`);
    return {
      success: false,
      error: "Email service not configured. Please contact administration.",
    };
  }

  try {
    const info = await transporter.sendMail({
      from: fromAddress,
      to: cleanEmail,
      subject,
      text: text || "",
      html: html || text || "",
    });

    console.log(`[Email Service] Email dispatched successfully. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error: any) {
    console.error("[Email Service] SMTP Send Error:", error);
    return {
      success: false,
      error: error.message || "Failed to dispatch email",
    };
  }
}
