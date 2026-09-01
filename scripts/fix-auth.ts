import { config } from "dotenv"
config({ path: ".env.local" })
import bcrypt from "bcryptjs"

async function testAuth() {
  const { getUserByEmail, updateUserPassword } = await import("../lib/db/users")
  const user = await getUserByEmail("darshan@vamaadairy.com")
  console.log("User fetched:", user)
  if (user) {
    const test1 = await bcrypt.compare("Gaia@2026", user.passwordHash)
    console.log("Password 'Gaia@2026' match:", test1)
    if (!test1) {
      console.log("Setting password to 'Gaia@2026'...")
      await updateUserPassword("darshan@vamaadairy.com", "Gaia@2026")
      const updatedUser = await getUserByEmail("darshan@vamaadairy.com")
      const test2 = await bcrypt.compare("Gaia@2026", updatedUser!.passwordHash)
      console.log("Password updated. New match with 'Gaia@2026':", test2)
    }
  }
}

testAuth().catch(console.error)
