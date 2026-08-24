"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })
    const json = await res.json()
    if (json.success) router.push("/dashboard")
    else setError(json.error || "Login failed")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <form onSubmit={handleSubmit} className="w-full max-w-sm p-6 border border-neutral-200 rounded-xl space-y-4">
        <h1 className="text-2xl font-black text-black">Login</h1>
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600 font-semibold">{error}</p>}
        <Button type="submit" className="w-full">Login</Button>
        <p className="text-xs text-neutral-500 text-center">Don't have an account? <a href="/signup" className="font-bold text-black">Sign up</a></p>
      </form>
    </div>
  )
}
