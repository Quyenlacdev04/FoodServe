import nodemailer from 'nodemailer'

/**
 * Gửi email OTP sử dụng nhiều provider:
 * 1. Brevo (Sendinblue) — HTTP API, miễn phí 300 email/ngày, hoạt động trên Render
 * 2. Resend — HTTP API, cần domain riêng cho production
 * 3. Gmail (Nodemailer) — SMTP, chỉ dùng cho local dev (Render block SMTP ports)
 */

// ===== HELPER: Timeout wrapper =====
function withTimeout(promise, ms, label = 'Operation') {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout sau ${ms / 1000}s`)), ms)
    )
  ])
}

// ===== BREVO / SENDINBLUE (ưu tiên dùng trên production) =====
async function sendViaBrevo(to, subject, html) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY chưa được cấu hình')

  const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER || 'noreply@foodserve.com'
  const senderName = process.env.BREVO_SENDER_NAME || 'FoodServe'

  const response = await withTimeout(
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    }),
    10000,
    'Brevo API'
  )

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Brevo API error: ${JSON.stringify(data)}`)
  }
  return data
}

// ===== RESEND (backup cho production) =====
async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY chưa được cấu hình')

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'FoodServe <onboarding@resend.dev>'

  const response = await withTimeout(
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    }),
    10000,
    'Resend API'
  )

  const data = await response.json()
  if (!response.ok) {
    throw new Error(`Resend API error: ${JSON.stringify(data)}`)
  }
  return data
}

// ===== NODEMAILER / GMAIL (dùng cho dev local) =====
function createGmailTransporter() {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) return null
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    // Timeout ngắn để không bị treo trên Render (Render block SMTP ports)
    connectionTimeout: 5000,  // 5s để kết nối
    greetingTimeout: 5000,    // 5s chờ greeting
    socketTimeout: 5000,      // 5s cho mỗi socket operation
  })
}

/**
 * Hàm gửi email chính - tự chọn provider phù hợp
 * Thứ tự ưu tiên: Brevo → Resend → Gmail
 * Có timeout tổng 15s để đảm bảo API luôn trả response
 */
export async function sendEmail({ to, subject, html }) {
  const errors = []
  const isProduction = process.env.NODE_ENV === 'production'
  let gmailTried = false

  // Helper function to send via Gmail SMTP
  async function tryGmailSMTP() {
    gmailTried = true
    const transporter = createGmailTransporter()
    if (transporter) {
      try {
        await withTimeout(
          transporter.sendMail({
            from: `"FoodServe 🍽️" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
          }),
          8000,  // 8s timeout tổng cho Gmail
          'Gmail SMTP'
        )
        console.log(`📧 Email gửi qua Gmail SMTP thành công đến: ${to}`)
        return { success: true, provider: 'gmail' }
      } catch (err) {
        console.error('❌ Gmail SMTP error:', err.message)
        errors.push(`Gmail SMTP: ${err.message}`)
        transporter.close()
      }
    }
    return null
  }

  // 1. Trong môi trường development (local), ưu tiên dùng Gmail SMTP trước
  // vì gửi trực tiếp từ Gmail cá nhân sẽ giúp email vào hộp thư chính (Inbox), tránh bị bộ lọc Spam của Gmail chặn (lỗi DMARC khi gửi ké qua Brevo)
  if (!isProduction) {
    const res = await tryGmailSMTP()
    if (res) return res
  }

  // 2. Thử gửi qua Brevo (ưu tiên hàng đầu trên production Render vì Render chặn cổng SMTP)
  if (process.env.BREVO_API_KEY) {
    try {
      await sendViaBrevo(to, subject, html)
      console.log(`📧 Email gửi qua Brevo thành công đến: ${to}`)
      return { success: true, provider: 'brevo' }
    } catch (err) {
      console.error('❌ Brevo error:', err.message)
      errors.push(`Brevo: ${err.message}`)
    }
  }

  // 3. Thử gửi qua Resend (phương án dự phòng thứ 2 cho production)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html)
      console.log(`📧 Email gửi qua Resend thành công đến: ${to}`)
      return { success: true, provider: 'resend' }
    } catch (err) {
      console.error('❌ Resend error:', err.message)
      errors.push(`Resend: ${err.message}`)
    }
  }

  // 4. Nếu ở production (hoặc Gmail SMTP chưa được thử ở dev), thử gửi qua Gmail SMTP như phương án cuối cùng
  if (!gmailTried) {
    const res = await tryGmailSMTP()
    if (res) return res
  }

  // Không có provider nào gửi thành công
  const errorMsg = errors.length > 0
    ? `Tất cả email provider đều lỗi: ${errors.join(' | ')}`
    : 'Chưa cấu hình email provider (BREVO_API_KEY, RESEND_API_KEY, hoặc EMAIL_USER/EMAIL_PASS)'
  console.error(`🚫 ${errorMsg}`)
  throw new Error(errorMsg)
}

// ===== HTML TEMPLATES =====

export function otpEmailTemplate({ name, otp, type = 'reset' }) {
  const isRegister = type === 'register'
  const title = isRegister ? 'Xác minh Email Đăng ký' : 'Đặt lại mật khẩu'
  const subtitle = isRegister
    ? `Xin chào <strong>${name || 'bạn'}</strong>! Nhập mã OTP dưới đây để hoàn tất đăng ký:`
    : 'Mã OTP của bạn để đặt lại mật khẩu:'

  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
      <div style="background: linear-gradient(135deg, #ff6b35, #f7c948); padding: 32px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🍽️ FoodServe</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Ăn ngon mỗi ngày</p>
      </div>
      <div style="padding: 32px; text-align: center;">
        <h2 style="color: #333; margin-bottom: 8px;">${title}</h2>
        <p style="color: #666; margin-bottom: 24px;">${subtitle}</p>
        <div style="background: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 200px;">
          <span style="font-size: 36px; font-weight: bold; color: #ff6b35; letter-spacing: 8px;">${otp}</span>
        </div>
        <p style="color: #999; font-size: 13px; margin-top: 20px;">⏰ Mã có hiệu lực trong <strong>5 phút</strong></p>
        <p style="color: #bbb; font-size: 12px; margin-top: 8px;">Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
      </div>
    </div>
  `
}
