/**
 * Base Email Template — TelemetryFlow Enterprise
 *
 * Professional TABLE-based HTML email layout with inline SVG logo.
 * Compatible with Gmail, Outlook, Apple Mail, Yahoo Mail.
 * All auth email templates inherit this structure.
 */

export interface TemplateData {
  title: string;
  preheader?: string;
  content: string;
  footerText?: string;
}

/**
 * Inline SVG logo derived from the official TelemetryFlow brand asset.
 * Radial node-graph icon (teal spokes, orange nodes) + wordmark.
 */
const TFO_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" width="280" height="60">
  <g transform="translate(0,2)">
    <g stroke="#0d9488" stroke-width="3" stroke-linecap="round">
      <line x1="28" y1="28" x2="28" y2="8"/>
      <line x1="28" y1="28" x2="42" y2="14"/>
      <line x1="28" y1="28" x2="48" y2="28"/>
      <line x1="28" y1="28" x2="42" y2="42"/>
      <line x1="28" y1="28" x2="28" y2="48"/>
      <line x1="28" y1="28" x2="14" y2="42"/>
      <line x1="28" y1="28" x2="8" y2="28"/>
      <line x1="28" y1="28" x2="14" y2="14"/>
    </g>
    <g fill="none" stroke="#f97316" stroke-width="2.5">
      <circle cx="28" cy="8" r="5"/>
      <circle cx="42" cy="14" r="5"/>
      <circle cx="48" cy="28" r="5"/>
      <circle cx="42" cy="42" r="5"/>
      <circle cx="28" cy="48" r="5"/>
      <circle cx="14" cy="42" r="5"/>
      <circle cx="8" cy="28" r="5"/>
      <circle cx="14" cy="14" r="5"/>
    </g>
    <circle cx="28" cy="28" r="9" fill="none" stroke="#0d9488" stroke-width="3"/>
    <line x1="23" y1="23" x2="33" y2="33" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="33" y1="23" x2="23" y2="33" stroke="#0d9488" stroke-width="2.5" stroke-linecap="round"/>
  </g>
  <text x="64" y="30" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="22" font-weight="800" fill="#0f172a">TelemetryFlow</text>
  <text x="64" y="46" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif" font-size="8" font-weight="600" fill="#0d9488" letter-spacing="3">OBSERVABILITY PLATFORM</text>
</svg>`;

export const baseTemplate = (data: TemplateData): string => {
  const { title, preheader, content, footerText } = data;
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    /* Reset */
    body, table, td, p, a, li { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body { margin: 0; padding: 0; width: 100% !important; height: 100% !important; }

    /* Base */
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f1f5f9;
      color: #0f172a;
      line-height: 1.6;
    }
    a { color: #0d9488; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h2 { margin: 0 0 16px 0; color: #0f172a; font-size: 22px; font-weight: 700; line-height: 1.3; }
    p { margin: 0 0 14px 0; color: #475569; font-size: 15px; line-height: 1.7; }
    ul { margin: 12px 0; padding-left: 20px; }
    li { margin: 6px 0; color: #475569; font-size: 15px; line-height: 1.6; }

    /* Button */
    .button {
      display: inline-block;
      padding: 14px 36px;
      margin: 20px 0;
      background-color: #0d9488;
      color: #ffffff !important;
      text-decoration: none !important;
      border-radius: 8px;
      font-weight: 600;
      font-size: 15px;
      text-align: center;
      mso-padding-alt: 14px 36px;
    }

    /* Status Boxes */
    .info-box {
      background-color: #f0fdfa;
      border-left: 4px solid #0d9488;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .info-box p { margin: 0; color: #115e59; font-size: 14px; }

    .success-box {
      background-color: #ecfdf5;
      border-left: 4px solid #059669;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .success-box p { margin: 0; color: #065f46; font-size: 14px; }

    .alert-box {
      background-color: #fffbeb;
      border-left: 4px solid #d97706;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .alert-box p { margin: 0; color: #92400e; font-size: 14px; }

    .danger-box {
      background-color: #fef2f2;
      border-left: 4px solid #dc2626;
      padding: 16px 20px;
      margin: 20px 0;
      border-radius: 0 6px 6px 0;
    }
    .danger-box p { margin: 0; color: #991b1b; font-size: 14px; }

    .divider {
      height: 1px;
      background-color: #e2e8f0;
      margin: 24px 0;
      border: none;
    }

    /* Detail row */
    .detail-label { color: #64748b; font-size: 13px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; padding: 6px 0; }
    .detail-value { color: #1e293b; font-size: 15px; font-weight: 700; padding: 6px 0; }

    /* Dark mode */
    @media (prefers-color-scheme: dark) {
      body, .email-wrapper { background-color: #0f172a !important; }
      .email-card { background-color: #1e293b !important; }
      .email-header-row { background-color: #1e293b !important; }
      h2, .detail-value { color: #f1f5f9 !important; }
      p, li { color: #cbd5e1 !important; }
      .info-box { background-color: #042f2e !important; }
      .info-box p { color: #5eead4 !important; }
      .success-box { background-color: #022c22 !important; }
      .success-box p { color: #6ee7b7 !important; }
      .alert-box { background-color: #451a03 !important; }
      .alert-box p { color: #fcd34d !important; }
      .danger-box { background-color: #450a0a !important; }
      .danger-box p { color: #fca5a5 !important; }
      .email-footer td { color: #64748b !important; }
      .divider { background-color: #334155 !important; }
      .detail-label { color: #94a3b8 !important; }
    }

    /* Responsive */
    @media only screen and (max-width: 620px) {
      .email-card { width: 100% !important; border-radius: 0 !important; }
      .email-body-cell { padding: 24px 20px !important; }
      .email-header-cell { padding: 24px 20px !important; }
      .email-footer-cell { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#f1f5f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>` : ""}

  <!-- Wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="email-wrapper" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding: 32px 16px;">

        <!-- Card -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="email-card" style="max-width:600px; width:100%; background-color:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);">

          <!-- Header -->
          <tr>
            <td class="email-header-cell email-header-row" style="padding: 32px 40px 24px 40px; border-bottom: 1px solid #e2e8f0;">
              <!--[if mso]>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:24px; font-weight:800; color:#0f172a;">TelemetryFlow</td></tr></table>
              <![endif]-->
              <!--[if !mso]><!-->
              ${TFO_LOGO_SVG}
              <!--<![endif]-->
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="email-body-cell" style="padding: 36px 40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-cell email-footer" style="padding: 28px 40px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:13px; color:#64748b; line-height:1.6;">
                    ${footerText || "This is an automated message from TelemetryFlow. Please do not reply to this email."}
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:12px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:12px; color:#94a3b8;">
                    &copy; ${year} TelemetryFlow. All rights reserved.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:8px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; font-size:12px; color:#94a3b8;">
                    <a href="https://telemetryflow.id" style="color:#0d9488; text-decoration:none;">telemetryflow.id</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <!-- /Card -->

      </td>
    </tr>
  </table>
  <!-- /Wrapper -->
</body>
</html>
  `.trim();
};
