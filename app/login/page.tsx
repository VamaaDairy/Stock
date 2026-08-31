"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
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

function ClipboardIllustration({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 620 720" xmlns="http://www.w3.org/2000/svg">
      <circle cx="330" cy="380" r="270" fill="#EAF0FB" />
      <circle cx="330" cy="380" r="270" fill="none" stroke="#2B2B2B" strokeWidth="1.5" />
      <g>
        <rect x="30" y="70" width="330" height="470" rx="18" fill="#DCE4F7" stroke="#B9C6EA" strokeWidth="2" />
        <rect x="130" y="46" width="130" height="46" rx="12" fill="#5B7FC7" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(60, ${170 + i * 100})`}>
            <circle cx="30" cy="10" r="28" fill="#6E8FD6" />
            <path d="M17 10 L26 19 L44 -3" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <rect x="80" y="0" width="200" height="8" rx="4" fill="#8FA6DE" />
          </g>
        ))}
        <rect x="90" y="490" width="150" height="8" rx="4" fill="#8FA6DE" />
      </g>
      <g transform="translate(190, 260)">
        <rect x="30" y="330" width="46" height="150" rx="18" fill="#4E7A4E" />
        <rect x="110" y="330" width="46" height="150" rx="18" fill="#4E7A4E" />
        <path d="M20 470 h60 l-10 24 h-45 z" fill="#3E5FA0" />
        <path d="M100 470 h60 l-10 24 h-45 z" fill="#3E5FA0" />
        <rect x="20" y="150" width="140" height="190" rx="30" fill="#F4C64B" />
        <rect x="140" y="170" width="110" height="34" rx="17" fill="#F4C64B" transform="rotate(8 140 170)" />
        <rect x="60" y="90" width="60" height="70" rx="20" fill="#E8B48C" />
        <circle cx="90" cy="70" r="46" fill="#E8B48C" />
        <path d="M40 60 a50 40 0 0 1 100 0 z" fill="#3E6FD6" />
        <ellipse cx="90" cy="60" rx="52" ry="10" fill="#F4A63E" />
        <path d="M40 60 q-10 40 20 55" fill="none" stroke="#2B2B2B" strokeWidth="4" />
        <circle cx="60" cy="118" r="6" fill="#2B2B2B" />
        <rect x="10" y="180" width="60" height="80" rx="8" fill="#E85C5C" transform="rotate(-8 10 180)" />
      </g>
      <rect x="480" y="360" width="34" height="70" rx="6" fill="#4CAF6E" transform="rotate(20 480 360)" />
      <g transform="translate(400, 300)">
        <rect x="0" y="0" width="230" height="330" rx="26" fill="#C9D6F5" stroke="#A9BAEF" strokeWidth="2" />
        {[0, 1, 2].map((i) => (
          <g key={i} transform={`translate(30, ${60 + i * 90})`}>
            <circle cx="20" cy="20" r="20" fill={i === 1 ? "#5B7FC7" : "#F5F8FF"} stroke="#5B7FC7" strokeWidth="3" />
            <rect x="60" y="6" width="120" height="28" rx="8" fill="#EEF2FC" />
          </g>
        ))}
      </g>
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ username?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const nextErrors: { username?: string; password?: string } = {}
    if (!username.trim()) nextErrors.username = "User name is required"
    if (!password.trim()) nextErrors.password = "Password is required"
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: username, password }),
      })
      const json = await res.json()
      if (json.success) {
        router.push("/")
      } else {
        setErrors({ general: json.error || "Login failed. Please check your credentials." })
      }
    } catch {
      setErrors({ general: "Connection error. Please try again." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white to-slate-50 font-sans px-6 py-10 box-border">
      <div className="w-full max-w-6xl flex items-center justify-between gap-10 flex-wrap">
        {/* Left illustration */}
        <div className="flex-1 min-w-[280px] max-w-[520px] basis-[420px]">
          <ClipboardIllustration className="w-full h-auto" />
        </div>

        {/* Right login card */}
        <div className="flex-1 min-w-[300px] max-w-[420px] basis-[380px]">
          <div className="mb-2">
            <GaiaLogo className="w-full h-auto max-w-[300px]" />
          </div>

          <h1 className="text-4xl font-bold text-neutral-800 mt-2 mb-2">Login</h1>
          <p className="text-gray-400 text-[15px] mb-7">Welcome back, please login into your account.</p>

          {errors.general && (
            <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label htmlFor="username" className="block text-sm font-semibold text-neutral-800 mb-2">
              <span className="text-red-500">*</span> User Name :
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter User Name"
              className={`w-full box-border px-4 py-3.5 text-sm rounded-lg bg-slate-50 outline-none border ${
                errors.username ? "border-red-500 mb-1" : "border-slate-200 mb-5"
              }`}
            />
            {errors.username && <div className="text-red-500 text-xs mb-4">{errors.username}</div>}

            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-800">
                <span className="text-red-500">*</span> Password :
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-700 hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className={`relative ${errors.password ? "mb-1" : "mb-7"}`}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className={`w-full box-border pl-4 pr-11 py-3.5 text-sm rounded-lg bg-slate-50 outline-none border ${
                  errors.password ? "border-red-500" : "border-slate-200"
                }`}
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
            {errors.password && <div className="text-red-500 text-xs mb-6">{errors.password}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 text-[15px] font-semibold text-white bg-blue-800 hover:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed border-none rounded-lg cursor-pointer transition-colors duration-150"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
