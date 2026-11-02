import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'
import { Providers } from './providers'

export const metadata: Metadata = {
  title: 'RicozPortfolio',
  description: 'Multi-tenant Project Portfolio Management SaaS',
}

const themeInitScript = `
  (function() {
    try {
      var key = 'ricoz_theme_preference';
      var saved = localStorage.getItem(key);
      var theme = (saved === 'dark' || saved === 'light')
        ? saved
        : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

