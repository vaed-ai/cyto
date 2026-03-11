'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'

interface ThemeCtx {
  theme: Theme
  toggle: () => void
}

const Ctx = createContext<ThemeCtx>({ theme: 'dark', toggle: () => {} })

export function useTheme() {
  return useContext(Ctx)
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('vaed-ai-theme') as Theme
    if (stored === 'light' || stored === 'dark') setTheme(stored)
    else if (window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light')
    setMounted(true)
  }, [])

  const toggle = () =>
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark'
      localStorage.setItem('vaed-ai-theme', next)
      return next
    })

  const resolved = mounted ? theme : 'dark'

  useEffect(() => {
    const bg = resolved === 'dark' ? '#000' : '#fff'
    document.documentElement.style.backgroundColor = bg
    document.body.style.backgroundColor = bg
  }, [resolved])

  return (
    <Ctx.Provider value={{ theme: resolved, toggle }}>
      <div data-vaed="" data-theme={resolved} style={{ height: '100%' }}>
        {children}
      </div>
    </Ctx.Provider>
  )
}
