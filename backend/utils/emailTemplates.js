const BASE_STYLE = {
  fontFamily: "Arial, sans-serif",
  maxWidth: "600px",
  borderRadius: "12px",
  border: "1px solid #e5e0d8",
};

const COLORS = {
  primary: "#6b493d",
  primaryLight: "#a07855",
  bg: "#fdfbf7",
  footerBg: "#f5f3ed",
  text: "#4a342e",
  textLight: "#8d6e63",
  border: "#e5e0d8",
};

function baseLayout(content) {
  return `
    <div style="font-family: ${BASE_STYLE.fontFamily}; max-width: ${BASE_STYLE.maxWidth}; margin: 0 auto; border-radius: ${BASE_STYLE.borderRadius}; overflow: hidden; border: ${BASE_STYLE.border};">
      <div style="background: linear-gradient(135deg, ${COLORS.primary}, ${COLORS.primaryLight}); color: white; padding: 28px; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">Hope for Paws</h1>
      </div>
      <div style="padding: 28px; background-color: ${COLORS.bg};">
        ${content}
      </div>
      <div style="background-color: ${COLORS.footerBg}; padding: 16px; text-align: center; color: ${COLORS.textLight}; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Hope for Paws. All rights reserved.</p>
      </div>
    </div>
  `;
}

function ctaButton(url, text) {
  return `
    <div style="text-align: center; margin: 24px 0;">
      <a href="${url}" style="background-color: ${COLORS.primary}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; font-size: 14px;">
        ${text}
      </a>
    </div>
  `;
}

function infoBox(content, borderColor = "#6b493d") {
  return `
    <div style="margin: 16px 0; padding: 16px; background-color: #ffffff; border-left: 4px solid ${borderColor}; border-radius: 6px; font-size: 14px;">
      ${content}
    </div>
  `;
}

function divider() {
  return `<hr style="border: none; border-top: 1px solid ${COLORS.border}; margin: 20px 0;" />`;
}

function heading(text) {
  return `<h2 style="color: ${COLORS.text}; margin-top: 0; font-size: 18px;">${text}</h2>`;
}

function paragraph(text, opts = {}) {
  const { bold } = opts;
  return `<p style="color: ${COLORS.text}; line-height: 1.7; font-size: 14px; margin: 8px 0;">${bold ? `<strong>${text}</strong>` : text}</p>`;
}

module.exports = {

  // -- Simple transactional email (OTP, password reset codes, etc.)
  simpleEmail({ subject, bodyLines = [] }) {
    const content = bodyLines
      .map((line) => {
        if (line.type === "heading") return heading(line.text);
        if (line.type === "paragraph") return paragraph(line.text, line.opts || {});
        if (line.type === "code") {
          return `<div style="margin: 16px 0; padding: 14px; background-color: #ffffff; border: 2px dashed ${COLORS.primary}; border-radius: 8px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 4px; color: ${COLORS.primary};">${line.text}</div>`;
        }
        if (line.type === "info") return infoBox(line.text, line.borderColor);
        if (line.type === "cta") return ctaButton(line.url, line.text);
        if (line.type === "divider") return divider();
        return paragraph(line.text);
      })
      .join("");
    return {
      subject,
      html: baseLayout(content),
    };
  },

  // -- Generic notification email (likes, comments, adoption requests)
  notificationEmail({ title, message }) {
    return {
      subject: title,
      html: baseLayout(`
        ${heading(title)}
        ${paragraph(message)}
        ${infoBox(`This is an automated notification from Hope for Paws. You can manage your notification preferences in your account settings.`)}
      `),
    };
  },

  // -- Chat digest email
  chatDigestEmail({ recipient, totalMessages, uniqueSenderNames, conversationCount, previewMessages }) {
    const senderSummary =
      uniqueSenderNames.length === 1
        ? uniqueSenderNames[0]
        : `${uniqueSenderNames.length} contacts`;

    const subject =
      totalMessages === 1
        ? `New message from ${senderSummary} - Hope for Paws`
        : `You have ${totalMessages} new messages - Hope for Paws`;

    const previewHtml = previewMessages
      .map(
        (msg) => `
        <div style="margin-bottom: 10px; padding: 12px; background-color: #ffffff; border-radius: 6px; border-left: 3px solid ${COLORS.primary};">
          <p style="margin: 0; font-weight: bold; color: ${COLORS.primary}; font-size: 13px;">${msg.senderName}</p>
          <p style="margin: 4px 0 0 0; color: ${COLORS.text}; line-height: 1.5; font-size: 13px;">${msg.text}</p>
        </div>
      `
      )
      .join("");

    return {
      subject,
      html: baseLayout(`
        ${paragraph(`You have <strong>${totalMessages} unread message${totalMessages === 1 ? "" : "s"}</strong> from <strong>${uniqueSenderNames.length} contact${uniqueSenderNames.length === 1 ? "" : "s"}</strong> across <strong>${conversationCount} conversation${conversationCount === 1 ? "" : "s"}</strong>.`)}
        ${previewHtml ? `<div style="margin-top: 16px;">${previewHtml}</div>` : ""}
        ${ctaButton(`${process.env.FRONTEND_URL || "https://hope-for-paws-official.vercel.app"}/chat`, "Open Chat")}
        ${paragraph("We'll only email you if you miss messages for a while.", { bold: false })}
      `),
    };
  },

  // -- Seller approved email
  sellerApprovedEmail({ storeName }) {
    return {
      subject: "You are now a Verified Seller on Hope For Paws!",
      html: baseLayout(`
        ${heading(`Congratulations, ${storeName}!`)}
        ${paragraph("We are thrilled to inform you that your seller application has been approved. Your store is now part of our Verified Seller network!")}
        ${infoBox(`
          <p style="margin: 0 0 4px; color: #2e7d32; font-weight: bold;">What this means for you:</p>
          <ul style="color: ${COLORS.text}; line-height: 1.8; padding-left: 20px; margin: 4px 0 0 0; font-size: 13px;">
            <li>A premium <strong>Verified Seller</strong> badge has been added to your storefront.</li>
            <li>Your products will stand out with enhanced buyer trust.</li>
            <li>You now have full access to all marketplace features.</li>
          </ul>
        `, "#4caf50")}
        ${paragraph("Thank you for being a trusted member of our community. We look forward to seeing your store grow!")}
      `),
    };
  },

  // -- Seller rejected email
  sellerRejectedEmail({ storeName, notes }) {
    return {
      subject: "Update regarding your Hope for Paws Seller Account",
      html: baseLayout(`
        ${heading(`Hi ${storeName},`)}
        ${paragraph("Thank you for your interest in becoming a Verified Seller on Hope for Paws. After careful review, we were unable to approve your verification at this time.")}
        ${notes ? infoBox(`
          <p style="margin: 0 0 4px; color: #e65100; font-weight: bold;">Reason provided by the admin:</p>
          <p style="margin: 0; color: ${COLORS.text}; line-height: 1.6; font-style: italic;">${notes}</p>
        `, "#e65100") : ""}
        ${infoBox(`
          <p style="margin: 0 0 4px; color: #1565c0; font-weight: bold;">Important:</p>
          <ul style="color: ${COLORS.text}; line-height: 1.8; padding-left: 20px; margin: 4px 0 0 0; font-size: 13px;">
            <li>You still have <strong>full access</strong> to your Seller Dashboard.</li>
            <li>You can update your information and <strong>re-apply</strong> once the issue is resolved.</li>
            <li>Your existing products and order history remain intact.</li>
          </ul>
        `, "#1976d2")}
        ${paragraph("If you have any questions, please don't hesitate to reach out to our support team.")}
      `),
    };
  },

  // -- Product hidden email (to seller)
  productHiddenEmail({ productTitle }) {
    return {
      subject: "Notice: Product Temporarily Hidden",
      html: baseLayout(`
        ${heading("Product Temporarily Hidden")}
        ${paragraph(`Notice: Your product "${productTitle}" has been temporarily hidden due to multiple community reports.`)}
        ${paragraph("Please review our marketplace guidelines to ensure your listings comply with our policies.")}
        ${infoBox(`If you believe this action was taken in error, please contact our support team for assistance.`, "#e65100")}
      `),
    };
  },

  // -- Admin alert email (product auto-hidden)
  adminAlertEmail({ productTitle, storeName }) {
    return {
      subject: "Admin Alert: Product Hidden via Automated Moderation",
      html: baseLayout(`
        ${heading("Automated Moderation Alert")}
        ${paragraph(`Product "${productTitle}" by ${storeName || "Seller"} has crossed the report threshold (5) and was automatically hidden.`)}
        ${paragraph("Please review the reports in the admin dashboard and take appropriate action.")}
        ${ctaButton(`${process.env.FRONTEND_URL || "https://hope-for-paws-official.vercel.app"}/admin/reports`, "View Reports")}
      `),
    };
  },

  // -- Contact form submission email (to admin)
  contactFormEmail({ name, email, message }) {
    return {
      subject: "New Contact Form Submission",
      html: baseLayout(`
        ${heading("New Contact Form Submission")}
        ${infoBox(`
          <p style="margin: 0 0 4px; color: ${COLORS.primary}; font-weight: bold;">From:</p>
          <p style="margin: 0 0 8px; color: ${COLORS.text}; font-size: 13px;">${name} (${email})</p>
          <p style="margin: 0 0 4px; color: ${COLORS.primary}; font-weight: bold;">Message:</p>
          <p style="margin: 0; color: ${COLORS.text}; font-size: 13px; line-height: 1.6;">${message}</p>
        `)}
      `),
    };
  },
};
