"use client"
import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import React from "react"

function GaiaLogo({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 260 150" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M16 42 C 8 26, 16 6, 38 4 C 53 2, 58 12, 70 8 C 88 2, 102 14, 116 6 C 132 -2, 148 8, 162 4 C 180 -1, 198 4, 210 16 C 224 28, 228 36, 222 48 C 230 56, 232 68, 222 76 C 228 84, 224 94, 212 92 C 214 100, 202 106, 190 100 C 180 106, 166 102, 160 94 C 146 102, 128 98, 122 88 C 108 96, 90 92, 84 82 C 68 88, 50 82, 46 70 C 30 72, 16 62, 18 50 C 10 48, 8 44, 16 42 Z"
        fill="#4A6FA5"
      />
      <text x="130" y="66" textAnchor="middle" fontFamily="'Baloo 2', 'Segoe UI', system-ui, sans-serif" fontWeight={700} fontSize="46" fill="#FFFFFF" letterSpacing="1">
        gaia
      </text>
      <text x="130" y="132" textAnchor="middle" fontFamily="'Segoe UI', system-ui, sans-serif" fontWeight={400} fontSize="17" fill="#3E9B4F">
        nourishment for life
      </text>
    </svg>
  )
}

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
          !
        </div>
        <h2 className="text-lg font-bold text-neutral-800">Invalid Reset Link</h2>
        <p className="text-sm text-gray-500">
          The reset link is missing a valid token. Please request a new link from the forgot password page.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block py-2.5 px-6 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
        >
          Go to Forgot Password
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }),
      })
      const data = await res.json()
      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push("/login")
        }, 2000)
      } else {
        setError(data.error || "Failed to reset password")
      }
    } catch {
      setError("Unable to connect to server. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="text-2xl font-bold text-neutral-800 text-center mb-2">
        Set New Password
      </h1>
      <p className="text-gray-500 text-sm text-center mb-6">
        Enter your new password below.
      </p>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
          {error}
        </div>
      )}

      {success ? (
        <div className="text-center space-y-4 py-4">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <p className="text-sm font-medium text-gray-800">
            Password reset successful! Redirecting to login...
          </p>
          <Link
            href="/login"
            className="inline-block py-2.5 px-6 text-sm font-semibold text-white bg-blue-800 hover:bg-blue-900 rounded-lg"
          >
            Login Now
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-neutral-800 mb-1">
              <span className="text-red-500">*</span> New Password :
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter at least 6 characters"
                className="w-full box-border pl-4 pr-11 py-3 text-sm rounded-lg bg-slate-50 outline-none border border-slate-200 focus:border-blue-700"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-gray-400 flex items-center p-0"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" strokeWidth="1.8" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M3 3l18 18M10.6 10.7a3 3 0 0 0 4.2 4.2M6.6 6.7C4.3 8.2 2.7 10.4 2 12c0 0 3.5 7 10 7 1.9 0 3.5-.5 4.9-1.3M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7-.4.8-1.1 1.9-2.1 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-neutral-800 mb-1">
              <span className="text-red-500">*</span> Confirm Password :
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className="w-full box-border px-4 py-3 text-sm rounded-lg bg-slate-50 outline-none border border-slate-200 focus:border-blue-700"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-[15px] font-semibold text-white bg-gradient-to-br from-[#4A6FA5] to-[#3E5FA0] hover:brightness-110 disabled:opacity-60 rounded-lg cursor-pointer transition-all shadow-xs"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white to-slate-50 font-sans px-6 py-10 box-border">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-sm rounded-2xl p-8 sm:p-10">
        <div className="flex justify-center mb-4">
          <GaiaLogo className="w-48 h-auto" />
        </div>
        <Suspense fallback={<div className="text-center py-6 text-sm text-gray-500">Loading...</div>}>
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
