import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Next.js Boilerplate',
  description: 'Next.js App Router with TypeScript and Tailwind CSS',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

