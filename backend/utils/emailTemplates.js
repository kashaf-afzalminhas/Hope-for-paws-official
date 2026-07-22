// emailTemplates.js
// Responsive HTML email templates for Hope for Paws

/**
 * Generates a branded HTML email template for verification/OTP codes.
 *
 * @param {Object} options
 * @param {string} options.code        - The verification code to display
 * @param {string} options.heading     - Main heading text (e.g. "Verification Code")
 * @param {string} options.message     - Explanation text below the code
 * @param {string} options.expiry      - Human-readable expiry (e.g. "2 minutes")
 * @param {string} [options.preheader] - Optional preheader text for email previews
 * @returns {string} Complete HTML email string
 */
function buildVerificationEmail({ code, heading, message, expiry, preheader }) {
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
    ${preheader || `Your ${heading} is ${code}`}
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

module.exports = { buildVerificationEmail };
