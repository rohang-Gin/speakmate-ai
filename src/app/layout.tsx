import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SpeakMate AI – English Conversation Coach',
  description: 'Your personal AI-powered English tutor. Practice speaking, improve grammar, and build confidence.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
