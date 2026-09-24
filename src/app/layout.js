import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MainWrapper from '@/components/MainWrapper'
import SmoothScroll from '@/components/SmoothScroll'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  title: 'DualTurf — Premium Football Jerseys & Kits',
  description: 'Shop official and replica football jerseys, retro classics, anthem jackets, and international kits across India.',
  icons: {
    icon: '/images/logo.png',
    shortcut: '/images/logo.png',
    apple: '/images/logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        <SmoothScroll>
          <AuthProvider>
            <CartProvider>
              <Header />
              <MainWrapper>{children}</MainWrapper>
              <Footer />
            </CartProvider>
          </AuthProvider>
        </SmoothScroll>
      </body>
    </html>
  )
}
