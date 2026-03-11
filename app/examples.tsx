'use client'

import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { Code } from '@vaed-ai/cyto/app/code'
import { useState, useEffect } from 'react'

// Components
import BasicExample from '@vaed-ai/cyto/app/examples/basic'
import ReactContentExample from '@vaed-ai/cyto/app/examples/react-content'
import StylesExample from '@vaed-ai/cyto/app/examples/styles'
import GrabbableExample from '@vaed-ai/cyto/app/examples/grabbable'
import CssVarsExample from '@vaed-ai/cyto/app/examples/css-vars'

// Source code as strings
// @ts-ignore
import basicSrc from './examples/basic.tsx?raw'
// @ts-ignore
import reactContentSrc from './examples/react-content.tsx?raw'
// @ts-ignore
import stylesSrc from './examples/styles.tsx?raw'
// @ts-ignore
import grabbableSrc from './examples/grabbable.tsx?raw'
// @ts-ignore
import cssVarsSrc from './examples/css-vars.tsx?raw'

// ─── Responsive ───

const MOBILE = 768

function useIsMobile() {
  const [m, setM] = useState(false)
  useEffect(() => {
    const check = () => setM(window.innerWidth < MOBILE)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])
  return m
}

// ─── Example wrapper ───

function Example({ title, code, children }: {
  title: string
  code: string
  children: React.ReactNode
}) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const isMobile = useIsMobile()
  const [tab, setTab] = useState<'code' | 'view'>('view')

  const border = `1px solid ${isDark ? '#333' : '#ddd'}`

  const tabBtn = (t: 'code' | 'view', label: string) => (
    <button
      onClick={() => setTab(t)}
      style={{
        flex: 1,
        padding: '8px 0',
        border: 'none',
        borderBottom: tab === t ? `2px solid ${isDark ? '#fff' : '#000'}` : '2px solid transparent',
        background: 'transparent',
        color: tab === t ? (isDark ? '#fff' : '#000') : (isDark ? '#666' : '#999'),
        fontFamily: 'monospace',
        fontSize: '0.8rem',
        cursor: 'pointer',
        fontWeight: tab === t ? 600 : 400,
      }}
    >
      {label}
    </button>
  )

  return (
    <section style={{ marginBottom: '3rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.8 }}>
        {title}
      </h2>

      {isMobile ? (
        <div style={{ border }}>
          <div style={{ display: 'flex', borderBottom: border }}>
            {tabBtn('view', 'View')}
            {tabBtn('code', 'Code')}
          </div>
          {tab === 'code' ? (
            <div style={{ maxHeight: 500, overflow: 'auto' }}>
              <Code value={code} />
            </div>
          ) : (
            <div style={{ height: 350, position: 'relative', overflow: 'hidden' }}>
              {children}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', border }}>
          <div style={{ width: '50%', flexShrink: 0, borderRight: border, maxHeight: 600, overflow: 'auto' }}>
            <Code value={code} />
          </div>
          <div style={{
            width: '50%',
            minHeight: 350,
            position: 'relative',
            overflow: 'hidden',
          }}>
            {children}
          </div>
        </div>
      )}
    </section>
  )
}

// ─── All examples ───

export default function Examples() {
  return <>
    <Example title="Basic: nodes + edges" code={basicSrc}>
      <BasicExample />
    </Example>

    <Example title="React content inside nodes" code={reactContentSrc}>
      <ReactContentExample />
    </Example>

    <Example title="Dynamic styles + classes" code={stylesSrc}>
      <StylesExample />
    </Example>

    <Example title="Grabbable nodes with interactive elements" code={grabbableSrc}>
      <GrabbableExample />
    </Example>

    <Example title="CSS variables in Cytoscape stylesheets" code={cssVarsSrc}>
      <CssVarsExample />
    </Example>
  </>
}
