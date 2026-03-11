'use client'

import dynamic from 'next/dynamic'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { ThemeToggle } from '@vaed-ai/cyto/app/theme-toggle'
import { Code } from '@vaed-ai/cyto/app/code'

const Examples = dynamic(() => import('@vaed-ai/cyto/app/examples'), { ssr: false })

export default function Page() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const link: React.CSSProperties = {
    color: 'inherit',
    textDecoration: 'none',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
  }

  return (
    <div style={{
      background: isDark ? '#000' : '#fff',
      color: isDark ? '#fff' : '#000',
      minHeight: '100%',
      fontFamily: 'monospace',
      padding: '2rem',
    }}>
      {/* ─── Back link ─── */}
      <div style={{ marginBottom: '1.5rem' }}>
        <a href="https://vaed-ai.github.io" style={{ ...link, opacity: 0.4 }}>
          &#8592; v&#230;d.ai
        </a>
      </div>

      {/* ─── Header ─── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 400 }}>@vaed-ai/cyto</h1>
          <img
            src="https://img.shields.io/npm/v/@vaed-ai/cyto?style=flat&color=000&labelColor=000"
            alt="npm version"
            style={{ height: 20, opacity: isDark ? 1 : 0.8 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <a
            href="https://github.com/vaed-ai/cyto"
            style={{ ...link, opacity: 0.5 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </a>
          <ThemeToggle />
        </div>
      </div>

      <p style={{ opacity: 0.6, marginBottom: '2rem', maxWidth: 600, lineHeight: 1.6 }}>
        React components for Cytoscape.js — declarative graph nodes with React content inside.
      </p>

      {/* ─── Install ─── */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem', opacity: 0.8 }}>Install</h2>
        <div style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
          <Code value="npm install @vaed-ai/cyto cytoscape cytoscape-cola react-cytoscapejs" language="bash" lineNumbers={false} />
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.5rem 0 0.75rem', opacity: 0.8 }}>Usage</h2>
        <div style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
          <Code value={`import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'

<Cyto>
  <CytoNode id="a" element={{ data: { id: 'a', label: 'A' } }} />
  <CytoNode id="b" element={{ data: { id: 'b', label: 'B' } }} />
  <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'a', target: 'b' } }} />
</Cyto>`} lineNumbers={false} />
        </div>

        <p style={{ opacity: 0.5, marginTop: '0.75rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Wrap <code style={{ fontFamily: 'monospace' }}>{'<Cyto>'}</code> in a container with <code style={{ fontFamily: 'monospace' }}>position: relative</code> and a defined height.
          The component fills its parent absolutely. Cola layout runs by default.
        </p>
      </div>

      <Examples />
    </div>
  )
}
