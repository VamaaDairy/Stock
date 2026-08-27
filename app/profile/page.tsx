"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/me").then(res => res.json()).then(json => {
      if (json.success) setEmail(json.email)
      else router.push("/login")
    })
  }, [router])

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  if (!email) return null

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-md mx-auto space-y-4 border border-blue-100 rounded-xl p-6">
        <h1 className="text-2xl font-black text-slate-800">Profile</h1>
        <p className="text-slate-500">Email: <span className="font-bold text-slate-800">{email}</span></p>
        <Button onClick={handleLogout} variant="outline">Logout</Button>
      </div>
    </div>
  )
}
