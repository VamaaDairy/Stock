import ConditionalShell from "./components/ConditionalShell"
import "./globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-white text-black">
        <ConditionalShell>{children}</ConditionalShell>
      </body>
    </html>
  )
}
