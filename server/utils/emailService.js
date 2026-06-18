import nodemailer from 'nodemailer'

/**
 * Gửi email OTP sử dụng Resend API (hoạt động tốt trên Render)
 * hoặc fallback về Nodemailer nếu cần.
 * 
 * Render block SMTP outbound ports (465, 587) → dùng Resend (HTTP API)
 */

// ===== RESEND (ưu tiên dùng trên production) =====
async function sendViaResend(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY chưa được cấu hình')

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'FoodServe <onboarding@resend.dev>'

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: fromEmail, to, subject, html }),
  })

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
  })
}

/**
 * Hàm gửi email chính - tự chọn provider phù hợp
 */
export async function sendEmail({ to, subject, html }) {
  // Ưu tiên Resend (hoạt động trên Render)
  if (process.env.RESEND_API_KEY) {
    try {
      await sendViaResend(to, subject, html)
      console.log(`📧 Email gửi qua Resend thành công đến: ${to}`)
      return { success: true, provider: 'resend' }
    } catch (err) {
      console.error('Resend error:', err.message)
      throw err
    }
  }

  // Fallback về Gmail (dev local)
  const transporter = createGmailTransporter()
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"FoodServe 🍽️" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      })
      console.log(`📧 Email gửi qua Gmail thành công đến: ${to}`)
      return { success: true, provider: 'gmail' }
    } catch (err) {
      console.error('Gmail error:', err.message)
      throw err
    }
  }

  // Không có provider nào → throw để caller xử lý
  throw new Error('Chưa cấu hình email provider (RESEND_API_KEY hoặc EMAIL_USER/EMAIL_PASS)')
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
