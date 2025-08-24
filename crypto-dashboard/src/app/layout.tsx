import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import '@/styles/design-system.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { FirebaseAuthProvider } from '@/components/providers/FirebaseAuthProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SecurityProvider } from '@/components/providers/SecurityProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crypto Trading Dashboard',
  description: 'Production-ready crypto trading dashboard with real-time data and AI-powered analysis',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.className} bg-background text-text crypto-dark`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <SecurityProvider>
            <QueryProvider>
              <AuthProvider>
                <FirebaseAuthProvider>
                  {children}
                </FirebaseAuthProvider>
              </AuthProvider>
            </QueryProvider>
          </SecurityProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
