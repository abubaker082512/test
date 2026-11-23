// Instant Admin Email Notification Helper for WinX Pro Support Messages
// Target recipient: gamenext9999@gmail.com (overridable via SUPPORT_NOTIFY_EMAIL env var)
// Supports 3 delivery methods automatically:
//   1. Resend API (RESEND_API_KEY)
//   2. Gmail / Custom SMTP via Nodemailer (SMTP_USER + SMTP_PASS)
//   3. Zero-config FormSubmit.co fallback (requires 1-click activation email on first message)

const DEFAULT_ADMIN_EMAIL = process.env.SUPPORT_NOTIFY_EMAIL || 'gamenext9999@gmail.com'

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export async function sendSupportEmailNotification({
  userKey = '',
  email = '',
  name = '',
  text = '',
  hasImage = false,
  hasAudio = false,
  timestamp = new Date().toISOString()
}) {
  const toEmail = DEFAULT_ADMIN_EMAIL
  const senderLabel = name || email || userKey || 'Guest Player'
  const subject = `🔔 New WinX Pro Support Message from ${senderLabel}`

  const attachmentsNote = [
    hasImage ? '📷 Image screenshot attached (view in Admin Support Inbox)' : '',
    hasAudio ? '🎙️ Voice note attached (listen in Admin Support Inbox)' : ''
  ].filter(Boolean).join('\n')

  const plainBody = [
    `New Support Message on WinX Pro`,
    `--------------------------------`,
    `Player: ${senderLabel}`,
    `Email / ID: ${email || userKey || 'N/A'}`,
    `Time: ${timestamp}`,
    ``,
    `Message:`,
    text || '(Attachment only)',
    attachmentsNote ? `\nAttachments:\n${attachmentsNote}` : '',
    ``,
    `Reply directly in Admin Console: https://winxpro.com.pk/admin`
  ].filter(v => v !== undefined).join('\n')

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; background: #0d1510; color: #e2e8f0; border: 1px solid #00e65b; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #0b2918 0%, #05120a 100%); padding: 18px 20px; border-bottom: 1px solid rgba(0,230,91,0.3);">
        <h2 style="margin: 0; color: #00e65b; font-size: 18px;">🔔 New WinX Pro Support Message</h2>
        <p style="margin: 4px 0 0; color: #94a3b8; font-size: 12px;">Live customer support notification</p>
      </div>
      <div style="padding: 20px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 16px;">
          <tr>
            <td style="padding: 6px 0; color: #94a3b8; width: 110px;"><strong>Player:</strong></td>
            <td style="padding: 6px 0; color: #ffffff;">${escapeHtml(senderLabel)}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Email / Key:</strong></td>
            <td style="padding: 6px 0; color: #ffffff;">${escapeHtml(email || userKey || 'N/A')}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #94a3b8;"><strong>Time (UTC):</strong></td>
            <td style="padding: 6px 0; color: #cbd5e1;">${escapeHtml(timestamp)}</td>
          </tr>
        </table>

        <div style="background: rgba(255,255,255,0.05); border-left: 3px solid #00e65b; border-radius: 6px; padding: 14px; margin-bottom: 16px;">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.6px; color: #00e65b; margin-bottom: 6px; font-weight: bold;">Message</div>
          <div style="font-size: 14px; line-height: 1.6; color: #ffffff; white-space: pre-wrap;">${escapeHtml(text || '(Media attachment sent)')}</div>
          ${attachmentsNote ? `<div style="margin-top: 10px; font-size: 12px; color: #ffd54f;">${escapeHtml(attachmentsNote).replace(/\n/g, '<br/>')}</div>` : ''}
        </div>

        <a href="https://winxpro.com.pk/admin" style="display: inline-block; background: #00e65b; color: #050a06; text-decoration: none; font-weight: bold; font-size: 13px; padding: 10px 18px; border-radius: 8px;">
          Open Admin Support Inbox &rarr;
        </a>
      </div>
    </div>
  `

  // 1. Primary: Resend API (if RESEND_API_KEY configured in Vercel/env)
  if (process.env.RESEND_API_KEY) {
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 4000)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'WinX Pro Support <onboarding@resend.dev>',
          to: [toEmail],
          subject,
          html: htmlBody,
          text: plainBody
        }),
        signal: controller.signal
      })
      clearTimeout(timer)
      if (res.ok) {
        return { success: true, provider: 'resend' }
      }
      const errText = await res.text().catch(() => '')
      console.warn('[EmailNotifier] Resend failed:', res.status, errText)
    } catch (e) {
      console.warn('[EmailNotifier] Resend exception:', e.message)
    }
  }

  // 2. Secondary: Gmail / SMTP via Nodemailer (if SMTP_USER & SMTP_PASS configured)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = require('nodemailer')
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE !== 'false',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        connectionTimeout: 4000,
        greetingTimeout: 4000,
        socketTimeout: 4000
      })

      await transporter.sendMail({
        from: `"WinX Pro Support" <${process.env.SMTP_USER}>`,
        to: toEmail,
        replyTo: email && email.includes('@') ? email : undefined,
        subject,
        text: plainBody,
        html: htmlBody
      })
      return { success: true, provider: 'smtp' }
    } catch (e) {
      console.warn('[EmailNotifier] SMTP failed:', e.message)
    }
  }

  // 3. Zero-config Fallback: FormSubmit.co AJAX API (no API key needed; 1-time activation email sent on first trigger)
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(toEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': 'https://winxpro.com.pk',
        'Referer': 'https://winxpro.com.pk/support'
      },
      body: JSON.stringify({
        _subject: subject,
        _template: 'table',
        _captcha: 'false',
        Player: senderLabel,
        Email: email || userKey || 'N/A',
        Message: text || '(Media attachment sent)',
        Attachments: attachmentsNote || 'None',
        Admin_Panel: 'https://winxpro.com.pk/admin',
        Time: timestamp
      }),
      signal: controller.signal
    })
    clearTimeout(timer)
    if (res.ok) {
      return { success: true, provider: 'formsubmit' }
    }
    const errText = await res.text().catch(() => '')
    console.warn('[EmailNotifier] FormSubmit response:', res.status, errText)
    return { success: false, provider: 'formsubmit', error: errText }
  } catch (e) {
    console.warn('[EmailNotifier] FormSubmit exception:', e.message)
    return { success: false, error: e.message }
  }
}
