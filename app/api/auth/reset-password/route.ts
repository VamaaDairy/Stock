import { NextRequest, NextResponse } from "next/server"
import {
  getUserByEmail,
  findResetToken,
  findResetTokenByEmailAndCode,
  deleteResetToken,
  deleteResetTokensForEmail,
  updateUserPassword,
  ensureUsersTable
} from "@/lib/db/users"

const MASTER_RESET_CODE = process.env.SIGNUP_INVITE_CODE || process.env.RESET_MASTER_CODE || "Gaia@2026"

export async function POST(req: NextRequest) {
  try {
    await ensureUsersTable()

    const { email, username, securityCode, token, code, newPassword } = await req.json()

    const identifier = (email || username || "").trim()

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "User name or email is required" },
        { status: 400 }
      )
    }

    if (!newPassword) {
      return NextResponse.json(
        { success: false, error: "New password is required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    const inputCode = (securityCode || code || token || "").trim()

    if (!inputCode) {
      return NextResponse.json(
        { success: false, error: "Security reset code is required" },
        { status: 400 }
      )
    }

    // 1. Verify user exists
    const user = await getUserByEmail(identifier)
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with this user name or email." },
        { status: 404 }
      )
    }

    // 2. Check Master Security Code (Gaia@2026) OR dynamic token in DB
    const isMasterMatch = inputCode === MASTER_RESET_CODE || inputCode === "Gaia@2026"

    if (!isMasterMatch) {
      // Check database token/OTP as fallback
      let record = await findResetTokenByEmailAndCode(user.email, inputCode)
      if (!record && token) {
        record = await findResetToken(token)
      }

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Invalid security code. Please enter the correct code (Gaia@2026)." },
          { status: 400 }
        )
      }

      const expiryDate = new Date(record.expires_at)
      if (expiryDate.getTime() < Date.now()) {
        await deleteResetTokensForEmail(user.email)
        return NextResponse.json(
          { success: false, error: "This code has expired. Please try again." },
          { status: 400 }
        )
      }
    }

    // 3. Update password
    await updateUserPassword(user.email, newPassword)
    await deleteResetTokensForEmail(user.email)

    return NextResponse.json({
      success: true,
      message: `Password for ${user.name || user.email} has been updated successfully.`,
    })
  } catch (err) {
    console.error("Reset password error:", err)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
