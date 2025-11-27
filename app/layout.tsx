import type { Metadata } from 'next'
import './globals.css'
import { Manrope } from 'next/font/google'

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['400', '500', '700', '800'],
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Next.js Boilerplate Landing Page',
  description: 'A production-ready Next.js boilerplate with payments, authentication, and everything else you need to go live and start generating revenue.',
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
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body className={manrope.variable}>
        {children}
      </body>
    </html>
  )
}

