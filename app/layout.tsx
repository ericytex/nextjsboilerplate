import type { Metadata } from 'next'
import './globals.css'
import { Manrope } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'aistoryshorts.com - Create Viral Faceless Videos on Auto-Pilot',
  description: 'Generate AI Videos in minutes. Our AI creation tool crafts viral AI videos for you. Create engaging videos for TikTok and YouTube on autopilot.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=optional"
          rel="stylesheet"
        />
      </head>
      <body className={manrope.variable}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

