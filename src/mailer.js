/**
 * WebAudX Native Mailer Module
 * Conforms to:
 * - WebAudX PRD v1.0 Section 10.1 (Accounts: Sign-in uses email)
 * - Zero external npm runtime dependencies (Native Node.js node:tls)
 * - Supports Gmail SMTP over SSL/TLS (port 465) with fallback logging
 */

const tls = require('node:tls');
const fs = require('node:fs');
const path = require('node:path');

// Load .env file if present without external dependencies
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const idx = trimmed.indexOf('=');
          const key = trimmed.substring(0, idx).trim();
          let val = trimmed.substring(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      });
    } catch (e) {
      // Ignore env read error
    }
  }
}

loadEnv();

function getSmtpConfig() {
  return {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '465', 10),
    user: process.env.SMTP_USER || '',
    pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
    fromName: process.env.FROM_NAME || 'WebAudX',
    fromEmail: process.env.FROM_EMAIL || process.env.SMTP_USER || ''
  };
}

/**
 * Sends an email using native Node.js TLS connection over SMTP.
 */
function sendRawSmtp({ host, port, user, pass, fromName, fromEmail, to, subject, html, text }) {
  return new Promise((resolve, reject) => {
    if (!user || !pass) {
      return reject(new Error('SMTP credentials not configured'));
    }

    const socket = tls.connect(port, host, { minVersion: 'TLSv1.2' }, () => {
      // Connection established
    });

    socket.setEncoding('utf8');

    let step = 0;
    let buffer = '';

    const send = (cmd) => {
      socket.write(cmd + '\r\n');
    };

    socket.on('data', (data) => {
      buffer += data;
      const lines = buffer.split('\r\n');
      const lastLine = lines[lines.length - 2] || lines[lines.length - 1];

      // Wait if multiline response (e.g. 250-...)
      if (/^\d{3}-/.test(lastLine)) {
        return;
      }

      const code = parseInt(buffer.substring(0, 3), 10);

      if (step === 0 && code === 220) {
        step = 1;
        buffer = '';
        send('EHLO localhost');
      } else if (step === 1 && code === 250) {
        step = 2;
        buffer = '';
        send('AUTH LOGIN');
      } else if (step === 2 && code === 334) {
        step = 3;
        buffer = '';
        send(Buffer.from(user).toString('base64'));
      } else if (step === 3 && code === 334) {
        step = 4;
        buffer = '';
        send(Buffer.from(pass).toString('base64'));
      } else if (step === 4 && code === 235) {
        step = 5;
        buffer = '';
        send(`MAIL FROM:<${fromEmail || user}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        buffer = '';
        send(`RCPT TO:<${to}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        buffer = '';
        send('DATA');
      } else if (step === 7 && code === 354) {
        step = 8;
        buffer = '';
        const boundary = '----=_WebAudX_Part_' + Date.now();
        const emailContent = [
          `From: "${fromName || 'WebAudX'}" <${fromEmail || user}>`,
          `To: <${to}>`,
          `Subject: ${subject}`,
          `MIME-Version: 1.0`,
          `Content-Type: multipart/alternative; boundary="${boundary}"`,
          ``,
          `--${boundary}`,
          `Content-Type: text/plain; charset=UTF-8`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          text,
          ``,
          `--${boundary}`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: 7bit`,
          ``,
          html,
          ``,
          `--${boundary}--`,
          `.`
        ].join('\r\n');

        socket.write(emailContent + '\r\n');
      } else if (step === 8 && code === 250) {
        step = 9;
        buffer = '';
        send('QUIT');
      } else if (step === 9) {
        socket.end();
        resolve({ success: true });
      } else if (code >= 400) {
        socket.end();
        reject(new Error(`SMTP Error ${code}: ${buffer.trim()}`));
      }
    });

    socket.on('error', (err) => {
      reject(err);
    });

    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error('SMTP Connection timed out'));
    });

    socket.setTimeout(15000);
  });
}

/**
 * Builds HTML template for the magic link email.
 */
function buildEmailHtml(magicLink, email) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Your WebAudX Sign-In Link</title>
</head>
<body style="margin: 0; padding: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f5f9; color: #17171d;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="100%" max-width="540" style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2d5ec; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(131, 6, 193, 0.05);" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 2px solid #8306c1;">
              <span style="font-size: 20px; font-weight: 700; color: #17171d; letter-spacing: -0.5px;">Web<span style="color: #8306c1;">AudX</span></span>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="font-size: 20px; font-weight: 700; color: #17171d; margin: 0 0 16px 0; line-height: 1.3;">Your Sign-In Link</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #4a4a58; margin: 0 0 24px 0;">
                Click the button below to sign in to your agency account and configure your custom report branding:
              </p>
              
              <div style="text-align: center; margin: 28px 0;">
                <a href="${magicLink}" style="background-color: #8306c1; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-size: 14px; font-weight: 600; display: inline-block;">Sign In to WebAudX &rarr;</a>
              </div>

              <p style="font-size: 12px; line-height: 1.5; color: #68687a; margin: 24px 0 0 0;">
                Or copy and paste this link into your browser:<br>
                <a href="${magicLink}" style="color: #8306c1; word-break: break-all;">${magicLink}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px; background-color: #fbfbfe; border-top: 1px solid #f3eef7; font-size: 11px; line-height: 1.5; color: #8c8c9e;">
              This sign-in link was sent to <strong style="color: #4a4a58;">${email}</strong> and is valid for 15 minutes. If you did not request this link, you can safely ignore this email.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Dispatches a magic link email.
 * Gracefully falls back to console logging if SMTP fails or is unconfigured.
 */
async function sendMagicLinkEmail({ to, magicLink }) {
  const config = getSmtpConfig();

  const subject = 'Your WebAudX Sign-In Link';
  const html = buildEmailHtml(magicLink, to);
  const text = `Sign in to WebAudX by visiting this link (valid for 15 minutes):\n\n${magicLink}\n\nIf you did not request this link, you can safely ignore this email.`;

  if (!config.user || !config.pass) {
    console.log(`[Mailer] SMTP not configured. Direct link for ${to}: ${magicLink}`);
    return { sent: false, reason: 'unconfigured' };
  }

  try {
    await sendRawSmtp({
      host: config.host,
      port: config.port,
      user: config.user,
      pass: config.pass,
      fromName: config.fromName,
      fromEmail: config.fromEmail,
      to: to,
      subject: subject,
      html: html,
      text: text
    });
    console.log(`[Mailer] Outbound magic link email delivered to ${to}`);
    return { sent: true };
  } catch (err) {
    console.error(`[Mailer Error] Failed to send email to ${to}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  sendMagicLinkEmail,
  buildEmailHtml,
  getSmtpConfig,
  loadEnv
};
