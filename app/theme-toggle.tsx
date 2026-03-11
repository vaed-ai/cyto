'use client'

import { useTheme } from '@vaed-ai/cyto/app/theme-provider'

export function ThemeToggle() {
  const { theme, toggle } = useTheme()

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
      style={{
        width: 28,
        height: 28,
        padding: 0,
        border: '1px solid currentColor',
        background: 'transparent',
        color: 'inherit',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'monospace',
        fontSize: 14,
        opacity: 0.6,
        borderRadius: 0,
      }}
    >
      {theme === 'dark' ? '○' : '●'}
    </button>
  )
}
