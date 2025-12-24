import { Manrope } from 'next/font/google'
import './globals.css'
import 'aos/dist/aos.css'; // Import AOS styles globally
import { Metadata } from 'next'
import { AuthContextProvider } from '@/app/context/AuthContext'

const font = Manrope({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SecFlowCheck',
  icons: {
    icon: '/images/logo/log3.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${font.className}`}>
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
      </body>
    </html>
  )
}

