import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'Pares ni Balong | Order System',
  description: 'Order delicious Filipino Pares, Silog meals, and more from Pares ni Balong. Fast delivery in Novaliches area.',
  generator: 'Pares ni Balong',
  keywords: ['pares', 'filipino food', 'beef pares', 'silog', 'novaliches', 'food delivery', 'online order'],
  icons: {
    icon: '/logo.jpg',
    apple: '/logo.jpg',
  },
  openGraph: {
    title: 'Pares ni Balong | Order System',
    description: 'Order delicious Filipino Pares, Silog meals, and more!',
    images: ['/logo.jpg'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
