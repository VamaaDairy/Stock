import { NextRequest, NextResponse } from "next/server"
import { getUserByEmail, ensureUsersTable, createResetToken } from "@/lib/db/users"
import crypto from "crypto"

export async function POST(req: NextRequest) {
  try {
    await ensureUsersTable()

    const { email } = await req.json()
    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 })
    }

    const user = await getUserByEmail(email.trim())

    // Return success to prevent email enumeration even if user not found
    if (!user) {
      return NextResponse.json({ success: true, message: "If that email exists, an OTP was sent." })
    }

    // Generate a 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes validity

    await createResetToken(email.trim(), otp, expiresAt)

    const host = req.headers.get("host") || "localhost:3000"
    const protocol = req.headers.get("x-forwarded-proto") || "http"
    const resetUrl = `${protocol}://${host}/reset-password?token=${otp}&email=${encodeURIComponent(email.trim())}`

    console.log("=========================================")
    console.log(`🔑 [PASSWORD RESET OTP] For ${email}: ${otp}`)
    console.log(`🔗 Reset URL: ${resetUrl}`)
    console.log("=========================================")

    const resendApiKey = process.env.RESEND_API_KEY
    let emailSent = false
    let emailErrorMsg: string | null = null

    if (resendApiKey) {
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Gaia Dairy <onboarding@resend.dev>",
            to: [email.trim()],
            subject: `${otp} is your Gaia Dairy password reset code`,
            html: `
              <div style="font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 24px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                <h2 style="color: #1e293b; font-size: 22px; font-weight: 700; margin-bottom: 12px;">Reset Your Password</h2>
                <p style="color: #475569; font-size: 15px; line-height: 1.5; margin-bottom: 20px;">
                  Hello <strong>${user.name}</strong>,<br/><br/>
                  Here is your 6-digit verification code to reset your Gaia Dairy account password:
                </p>
                
                <div style="text-align: center; margin: 28px 0; background: #f1f5f9; padding: 20px; border-radius: 10px;">
                  <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a; font-family: monospace;">
                    ${otp}
                  </span>
                  <p style="margin: 8px 0 0 0; color: #64748b; font-size: 12px;">Valid for 15 minutes</p>
                </div>

                <div style="text-align: center; margin-bottom: 24px;">
                  <a href="${resetUrl}" style="background-color: #1e40af; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
                    Or Click Here to Reset Directly
                  </a>
                </div>

                <p style="color: #94a3b8; font-size: 12px; line-height: 1.4;">
                  If you did not request this, please ignore this email.
                </p>
              </div>
            `,
          }),
        })

        if (!emailRes.ok) {
          const errorData = await emailRes.json()
          console.warn("⚠️ Resend test mode restriction:", errorData?.message || errorData)
          emailErrorMsg = errorData?.message || "Resend test domain limit"
        } else {
          emailSent = true
        }
      } catch (e) {
        console.error("Resend network error:", e)
      }
    }

    return NextResponse.json({
      success: true,
      message: "6-digit OTP generated.",
      // If email wasn't delivered due to unverified domain test mode, provide dev OTP on screen
      devOtp: !emailSent ? otp : undefined,
      devResetUrl: !emailSent ? resetUrl : undefined,
    })
  } catch (err) {
    console.error("Forgot password error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
