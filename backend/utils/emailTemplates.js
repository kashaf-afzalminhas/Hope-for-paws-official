// emailTemplates.js
// Responsive HTML email templates for Hope for Paws

// ============================================================
// Shared design constants (derived from buildVerificationEmail)
// ============================================================
const FONT = "'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Courier New', Courier, monospace";
const C = {
  primary: "#6b493d",
  bodyBg: "#f4f1eb",
  white: "#ffffff",
  codeBg: "#f9f6f2",
  infoBg: "#f2f2f2",
  footerBg: "#f2f2f2",
  divider: "#eee8da",
  text: "#333333",
  textMuted: "#666666",
  textLight: "#999999",
  textFaint: "#bbbbbb",
  textGhost: "#cccccc",
  green: "#2e7d32",
  orange: "#e65100",
  blue: "#1565c0",
};

// ============================================================
// Shared layout helpers
// ============================================================
function preheader(text) {
  return `<div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">${text}${"&zwnj;&nbsp;".repeat(30)}</div>`;
}

function emailHead(title) {
  return `
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .pad-mobile { padding-left: 24px !important; padding-right: 24px !important; }
    }
  </style>`;
}

function headerHtml() {
  return `
          <!-- ====== HEADER ====== -->
          <tr>
            <td style="background-color: ${C.primary}; padding: 28px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: ${C.white}; letter-spacing: 0.5px; font-family: ${FONT};">
                Hope for Paws
              </h1>
            </td>
          </tr>`;
}

function footerHtml() {
  return `
          <!-- ====== DIVIDER ====== -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid ${C.divider}; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ====== FOOTER ====== -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; background-color: ${C.footerBg};">
              <p style="margin: 0 0 6px; font-size: 13px; color: ${C.textLight}; font-family: ${FONT};">
                Need help? Contact us at
                <a href="mailto:hopeforpaws24@gmail.com" style="color: ${C.primary}; text-decoration: none; font-weight: 600;">hopeforpaws24@gmail.com</a>
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: ${C.textFaint}; font-family: ${FONT};">
                &copy; 2024 Hope for Paws. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: ${C.textGhost}; font-family: ${FONT};">
                This is an automated message &mdash; please do not reply directly.
              </p>
            </td>
          </tr>`;
}

function infoBoxHtml(content, borderColor) {
  borderColor = borderColor || C.primary;
  return `
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color: ${C.infoBg}; border-left: 4px solid ${borderColor}; border-radius: 6px; padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${C.textMuted}; font-family: ${FONT};">
                      ${content}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

function ctaButtonHtml(url, text) {
  return `
          <tr>
            <td style="padding: 8px 40px 24px; text-align: center;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="background-color: ${C.primary}; border-radius: 6px;">
                    <a href="${url}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 700; color: ${C.white}; text-decoration: none; font-family: ${FONT};">
                      ${text}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`;
}

/**
 * Wraps bodyHtml rows in the full email shell (DOCTYPE, head, outer table, container, header, footer).
 * @param {string} title   - <title> and preheader fallback
 * @param {string} preheaderText - hidden preview text
 * @param {string} bodyRows - raw <tr> rows for the BODY section (inside the container table)
 * @returns {string} complete HTML email string
 */
function emailShell(title, preheaderText, bodyRows) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
${emailHead(title)}
</head>
<body style="margin:0; padding:0; background-color:${C.bodyBg}; font-family: ${FONT};">
  ${preheader(preheaderText)}

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${C.bodyBg};">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td>
        <![endif]-->

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px; width:100%; margin:0 auto; background-color:${C.white}; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
${headerHtml()}
${bodyRows}
${footerHtml()}
        </table>

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ============================================================
// Template: Notification Email (likes, comments, adoption, etc.)
// ============================================================
function buildNotificationEmail({ title, message }) {
  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                ${title}
              </h2>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                ${message}
              </p>
            </td>
          </tr>
${infoBoxHtml("This is an automated notification from Hope for Paws. You can manage your notification preferences in your account settings.")}`;

  return {
    subject: title,
    html: emailShell(title, title, body),
  };
}

// ============================================================
// Template: Chat Digest Email
// ============================================================
function buildChatDigestEmail({ recipient, totalMessages, uniqueSenderNames, conversationCount, previewMessages }) {
  const senderSummary =
    uniqueSenderNames.length === 1
      ? uniqueSenderNames[0]
      : `${uniqueSenderNames.length} contacts`;

  const subject =
    totalMessages === 1
      ? `New message from ${senderSummary} - Hope for Paws`
      : `You have ${totalMessages} new messages - Hope for Paws`;

  const preheaderText =
    totalMessages === 1
      ? `New message from ${senderSummary}`
      : `${totalMessages} new messages from ${uniqueSenderNames.length} contact${uniqueSenderNames.length === 1 ? "" : "s"}`;

  const previewHtml = previewMessages
    .map(
      (msg) => `
              <tr>
                <td style="padding: 0 40px 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                    <tr>
                      <td style="background-color: ${C.codeBg}; border-left: 3px solid ${C.primary}; border-radius: 6px; padding: 14px 18px;">
                        <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; color: ${C.primary}; font-family: ${FONT};">
                          ${msg.senderName}
                        </p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.5; color: ${C.text}; font-family: ${FONT};">
                          ${msg.text}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    )
    .join("");

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                You have <strong>${totalMessages} unread message${totalMessages === 1 ? "" : "s"}</strong>
                from <strong>${uniqueSenderNames.length} contact${uniqueSenderNames.length === 1 ? "" : "s"}</strong>
                across <strong>${conversationCount} conversation${conversationCount === 1 ? "" : "s"}</strong>.
              </p>
            </td>
          </tr>
${previewHtml}
${ctaButtonHtml(`${process.env.FRONTEND_URL || "https://hope-for-paws-official.vercel.app"}/chat`, "Open Chat")}
${infoBoxHtml("We'll only email you if you miss messages for a while.")}`;

  return {
    subject,
    html: emailShell(subject, preheaderText, body),
  };
}

// ============================================================
// Template: Seller Approved
// ============================================================
function buildSellerApprovedEmail({ storeName }) {
  const subject = "You are now a Verified Seller on Hope For Paws!";

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                Congratulations, ${storeName}!
              </h2>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                We are thrilled to inform you that your seller application has been <strong>approved</strong>.
                Your store is now part of our Verified Seller network!
              </p>
            </td>
          </tr>
${infoBoxHtml(`
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${C.green}; font-family: ${FONT};">What this means for you:</p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: ${C.textMuted}; font-family: ${FONT};">
                          <li>A premium <strong>Verified Seller</strong> badge has been added to your storefront.</li>
                          <li>Your products will stand out with enhanced buyer trust.</li>
                          <li>You now have full access to all marketplace features.</li>
                        </ul>`, "#4caf50")}
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${C.text}; font-family: ${FONT};">
                Thank you for being a trusted member of our community. We look forward to seeing your store grow!
              </p>
            </td>
          </tr>`;

  return {
    subject,
    html: emailShell(subject, `Congratulations ${storeName}, you are now a Verified Seller!`, body),
  };
}

// ============================================================
// Template: Seller Rejected
// ============================================================
function buildSellerRejectedEmail({ storeName, notes }) {
  const subject = "Update regarding your Hope for Paws Seller Account";

  const notesBlock = notes
    ? infoBoxHtml(`
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${C.orange}; font-family: ${FONT};">Reason provided by the admin:</p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${C.textMuted}; font-style: italic; font-family: ${FONT};">
                          ${notes}
                        </p>`, C.orange)
    : "";

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                Hi ${storeName},
              </h2>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                Thank you for your interest in becoming a Verified Seller on Hope for Paws.
                After careful review, we were unable to approve your verification at this time.
              </p>
            </td>
          </tr>
${notesBlock}
${infoBoxHtml(`
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${C.blue}; font-family: ${FONT};">Important:</p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 13px; line-height: 1.8; color: ${C.textMuted}; font-family: ${FONT};">
                          <li>You still have <strong>full access</strong> to your Seller Dashboard.</li>
                          <li>You can update your information and <strong>re-apply</strong> once the issue is resolved.</li>
                          <li>Your existing products and order history remain intact.</li>
                        </ul>`, C.blue)}
          <tr>
            <td style="padding: 0 40px 32px;">
              <p style="margin: 0; font-size: 15px; line-height: 1.6; color: ${C.text}; font-family: ${FONT};">
                If you have any questions, please don't hesitate to reach out to our support team.
              </p>
            </td>
          </tr>`;

  return {
    subject,
    html: emailShell(subject, `Update on your Hope for Paws Seller Account`, body),
  };
}

// ============================================================
// Template: Product Hidden (to seller)
// ============================================================
function buildProductHiddenEmail({ productTitle }) {
  const subject = "Notice: Product Temporarily Hidden";

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                Product Temporarily Hidden
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                Notice: Your product <strong>"${productTitle}"</strong> has been temporarily hidden
                due to multiple community reports.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                Please review our marketplace guidelines to ensure your listings comply with our policies.
              </p>
            </td>
          </tr>
${infoBoxHtml("If you believe this action was taken in error, please contact our support team for assistance.", C.orange)}`;

  return {
    subject,
    html: emailShell(subject, `Your product "${productTitle}" has been temporarily hidden`, body),
  };
}

// ============================================================
// Template: Admin Alert — Product Auto-Hidden
// ============================================================
function buildAdminAlertEmail({ productTitle, storeName }) {
  const subject = "Admin Alert: Product Hidden via Automated Moderation";

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                Automated Moderation Alert
              </h2>
              <p style="margin: 0 0 20px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                Product <strong>"${productTitle}"</strong> by <strong>${storeName || "Seller"}</strong>
                has crossed the report threshold (5) and was automatically hidden.
              </p>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: ${C.text}; text-align: center; font-family: ${FONT};">
                Please review the reports in the admin dashboard and take appropriate action.
              </p>
            </td>
          </tr>
${ctaButtonHtml(`${process.env.FRONTEND_URL || "https://hope-for-paws-official.vercel.app"}/admin/reports`, "View Reports")}`;

  return {
    subject,
    html: emailShell(subject, `Admin alert: "${productTitle}" has been auto-hidden`, body),
  };
}

// ============================================================
// Template: Contact Form Submission (to admin)
// ============================================================
function buildContactFormEmail({ name, email, message }) {
  const subject = "New Contact Form Submission";

  const body = `
          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: ${C.primary}; text-align: center; font-family: ${FONT};">
                New Contact Form Submission
              </h2>
            </td>
          </tr>
${infoBoxHtml(`
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${C.primary}; font-family: ${FONT};">From:</p>
                        <p style="margin: 0 0 12px; font-size: 13px; color: ${C.textMuted}; font-family: ${FONT};">${name} (${email})</p>
                        <p style="margin: 0 0 6px; font-size: 13px; font-weight: 700; color: ${C.primary}; font-family: ${FONT};">Message:</p>
                        <p style="margin: 0; font-size: 13px; line-height: 1.6; color: ${C.textMuted}; font-family: ${FONT};">${message}</p>`)}`;

  return {
    subject,
    html: emailShell(subject, `New contact form submission from ${name}`, body),
  };
}

// ============================================================
// buildVerificationEmail — UNCHANGED (master reference)
// ============================================================
function buildVerificationEmail({ code, heading, message, expiry, preheader: preheaderText }) {
  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${heading}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    /* Mobile */
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; max-width: 100% !important; }
      .fluid { max-width: 100% !important; height: auto !important; }
      .stack-column { display: block !important; width: 100% !important; }
      .code-text { font-size: 28px !important; letter-spacing: 6px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f4f1eb; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <!-- Preheader (hidden preview text) -->
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    ${preheaderText || `Your ${heading} is ${code}`}
    ${'&zwnj;&nbsp;'.repeat(30)}
  </div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f4f1eb;">
    <tr>
      <td align="center" style="padding: 24px 12px;">
        <!--[if mso]>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" align="center"><tr><td>
        <![endif]-->

        <!-- Email container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="email-container" style="max-width:600px; width:100%; margin:0 auto; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

          <!-- ====== HEADER ====== -->
          <tr>
            <td style="background-color: #6b493d; padding: 28px 40px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: 0.5px; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                Hope for Paws
              </h1>
            </td>
          </tr>

          <!-- ====== BODY ====== -->
          <tr>
            <td style="padding: 40px 40px 16px;">
              <!-- Heading -->
              <h2 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #6b493d; text-align: center; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ${heading}
              </h2>
              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #333333; text-align: center; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ${message}
              </p>

              <!-- Code box -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="background-color: #f9f6f2; border: 2px dashed #6b493d; border-radius: 10px; padding: 20px 44px; text-align: center;">
                          <span class="code-text" style="font-size: 36px; font-weight: 700; letter-spacing: 10px; color: #6b493d; font-family: 'Courier New', Courier, monospace; display: inline-block;">
                            ${code}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Expiry notice -->
              <p style="margin: 24px 0 0; font-size: 13px; color: #999999; text-align: center; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                ⏱ This code expires in <strong style="color:#6b493d;">${expiry}</strong>.
              </p>
            </td>
          </tr>

          <!-- ====== SECURITY NOTICE ====== -->
          <tr>
            <td style="padding: 0 40px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="background-color: #f2f2f2; border-left: 4px solid #6b493d; border-radius: 6px; padding: 14px 18px;">
                    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #666666; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                      🔒 <strong>Security Tip:</strong> If you didn't request this code, you can safely ignore this email. Never share your code with anyone.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ====== DIVIDER ====== -->
          <tr>
            <td style="padding: 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-top: 1px solid #eee8da; font-size: 1px; line-height: 1px;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ====== FOOTER ====== -->
          <tr>
            <td style="padding: 24px 40px 32px; text-align: center; background-color: #f2f2f2;">
              <p style="margin: 0 0 6px; font-size: 13px; color: #999999; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                Need help? Contact us at
                <a href="mailto:hopeforpaws24@gmail.com" style="color: #6b493d; text-decoration: none; font-weight: 600;">hopeforpaws24@gmail.com</a>
              </p>
              <p style="margin: 0 0 4px; font-size: 12px; color: #bbbbbb; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                &copy; 2024 Hope for Paws. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 11px; color: #cccccc; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                This is an automated message — please do not reply directly.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Email container -->

        <!--[if mso]>
        </td></tr></table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ============================================================
// Exports
// ============================================================
module.exports = {
  buildVerificationEmail,
  buildNotificationEmail,
  buildChatDigestEmail,
  buildSellerApprovedEmail,
  buildSellerRejectedEmail,
  buildProductHiddenEmail,
  buildAdminAlertEmail,
  buildContactFormEmail,
};
