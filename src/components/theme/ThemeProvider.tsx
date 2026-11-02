'use client'

/**
 * ThemeProvider — manages light/dark theme preference.
 *
 * Reads the initial theme from localStorage (set by the pre-paint inline
 * script in src/app/layout.tsx) so React state matches the DOM attribute
 * that already exists before hydration.
 *
 * The theme is persisted as the plain string "light" or "dark" under the
 * key "ricoz_theme_preference" in localStorage.
 *
 * SECURITY: Only the visual theme string is stored in localStorage.
 * Authentication tokens are NEVER stored in browser storage.
 *
 * The data-theme attribute on <html> drives all CSS custom-property overrides
 * defined in globals.css under :root[data-theme="dark"].
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ricoz_theme_preference'

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

function getInitialTheme(): Theme {
  // On the server (SSR/RSC pass) there is no window — return 'light' as the
  // neutral default. The pre-paint script in layout.tsx corrects this before
  // first paint, so no flash occurs.
  if (typeof window === 'undefined') return 'light'

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'dark' || saved === 'light') return saved
    // Fall back to the OS preference if no stored preference exists.
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // Sync the data-theme attribute and localStorage whenever the theme changes.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try {
      localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      // localStorage may be unavailable in private browsing — silently ignore.
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/** Hook to consume the current theme and toggle function. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}
