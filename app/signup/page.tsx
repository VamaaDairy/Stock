"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    })
    const json = await res.json()
    if (json.success) router.push("/dashboard")
    else setError(json.error || "Signup failed")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 border border-blue-100 rounded-xl space-y-4">
        <h1 className="text-2xl font-black text-slate-800">Create Account</h1>
        <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <Input placeholder="Invite Code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        <Button type="submit" className="w-full">Sign Up</Button>
        <p className="text-xs text-slate-400 text-center">
          Already have an account? <a href="/login" className="font-bold text-slate-800">Login</a>
        </p>
      </form>
    </div>
  )
}
