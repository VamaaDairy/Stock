import { SignJWT, jwtVerify } from "jose"
import type { Role } from "./db/users"

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret-change-me")

export async function createSession(userId: number, email: string, role: Role) {
  return await new SignJWT({ userId, email, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret)
}

export async function verifySession(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload as { userId: number; email: string; role: Role }
  } catch {
    return null
  }
}
