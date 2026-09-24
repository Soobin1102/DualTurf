import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import MainWrapper from '@/components/MainWrapper'
import SmoothScroll from '@/components/SmoothScroll'
import { CartProvider } from '@/context/CartContext'
import { AuthProvider } from '@/context/AuthContext'

export const metadata = {
  metadataBase: new URL('https://www.dualturf.in'),
  title: 'DualTurf — Premium Football Jerseys & Kits',
  description: 'Shop official and replica football jerseys, retro classics, anthem jackets, and international kits across India.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/images/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/images/logo.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({ children }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    'name': 'DualTurf',
    'url': 'https://www.dualturf.in',
    'logo': 'https://www.dualturf.in/images/logo.png',
  }

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" href="/images/logo.png" />
        <link rel="apple-touch-icon" href="/images/logo.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
