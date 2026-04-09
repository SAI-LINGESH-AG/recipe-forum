import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import { ThemeProvider } from '@/app/providers/theme-provider'
import Navbar from '@/app/components/layout/Navbar'
import Footer from '@/app/components/layout/Footer'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Recipe Forum — Share Recipes From Around The World',
  description: 'A global community for sharing and discovering food recipes.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={geist.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeProvider>
          <Navbar />
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}