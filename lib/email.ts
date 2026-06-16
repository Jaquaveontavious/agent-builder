import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM = 'Iron Operative <hello@ironoperative.com>'

export async function sendProWelcomeEmail(to: string) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Iron Operative Pro — you\'re live',
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Iron Operative Pro</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2563eb;border-radius:10px;width:36px;height:36px;text-align:center;vertical-align:middle;">
                    <span style="color:#fff;font-size:18px;font-weight:900;line-height:36px;">⚡</span>
                  </td>
                  <td style="padding-left:10px;color:#fff;font-size:20px;font-weight:700;vertical-align:middle;">Iron Operative</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td style="background:#0f1117;border:1px solid #1e293b;border-radius:16px;padding:40px;">

              <p style="margin:0 0 8px;color:#3b82f6;font-size:13px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Pro subscription confirmed</p>
              <h1 style="margin:0 0 16px;color:#f1f5f9;font-size:28px;font-weight:800;line-height:1.2;">Your operatives are fully unlocked.</h1>
              <p style="margin:0 0 32px;color:#94a3b8;font-size:16px;line-height:1.6;">
                You now have full access to Iron Operative Pro. Deploy custom AI operatives, access the full template library, and let your operatives learn your business over time.
              </p>

              <!-- What's unlocked -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr><td style="padding-bottom:12px;">
                  <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">What's now unlocked</p>
                </td></tr>
                ${[
                  ['Custom AI Operatives', 'Deploy AI agents tailored to any part of your business'],
                  ['Operative Memory', 'Your operatives remember your pricing, tone, and client details across sessions'],
                  ['Discover Library', '20+ one-click templates across trades, real estate, agencies, and more'],
                  ['AI Idea Generator', 'Describe your business and get custom operative ideas instantly'],
                  ['Print & PDF Export', 'Download every generated output as a clean, formatted PDF'],
                ].map(([title, desc]) => `
                <tr><td style="padding-bottom:16px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="color:#22c55e;font-size:16px;vertical-align:top;padding-right:10px;padding-top:1px;">✓</td>
                      <td>
                        <p style="margin:0;color:#e2e8f0;font-size:14px;font-weight:600;">${title}</p>
                        <p style="margin:2px 0 0;color:#64748b;font-size:13px;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>`).join('')}
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#2563eb;border-radius:12px;">
                    <a href="https://ironoperative.com/dashboard" style="display:inline-block;padding:14px 28px;color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
                      Open your dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Billing note -->
          <tr>
            <td style="padding:24px 0 8px;">
              <p style="margin:0;color:#334155;font-size:13px;line-height:1.6;">
                Your Pro subscription is active at $97/month. You can manage or cancel anytime from your dashboard settings. Questions? Reply to this email.
              </p>
            </td>
          </tr>

          <!-- Disclaimer -->
          <tr>
            <td style="padding-top:8px;border-top:1px solid #1e293b;">
              <p style="margin:0;color:#1e293b;font-size:11px;line-height:1.6;">
                AI-generated outputs are for reference only and should be reviewed before use. Iron Operative is not liable for errors in AI-generated content. © ${new Date().getFullYear()} Iron Operative. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim(),
  })
}
