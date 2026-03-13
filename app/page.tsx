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
          <Code value={`import { Cyto, CytoNode, CytoEdge, CytoStyle, useGraph } from '@vaed-ai/cyto'

<Cyto
  // layout — cytoscape layout config; cola by default
  layout={{ name: 'cola', edgeLength: 120, maxSimulationTime: 500 }}
  zoom={false}           // disable scroll-to-zoom (default: true)
  pan={false}            // disable drag-to-pan (default: true)
  onLoaded={cy => {}}    // called once with cytoscape instance after mount
  style={{}}             // CSS on root container div (position:absolute inset:0)
  className="my-graph"   // className on root container div
>
  <CytoStyle stylesheet={[
    { selector: 'node', style: { 'background-color': '#fff', 'label': 'data(label)' } },
    { selector: 'edge', style: { 'line-color': '#555', 'curve-style': 'bezier' } },
    // CSS vars work: 'var(--accent)' — resolved automatically at runtime
  ]} />

  <CytoNode
    id="a"
    element={{
      data: { id: 'a', label: 'A' },  // data.id required, label used by stylesheet
      position: { x: 0, y: 0 },       // initial position in graph coords
      locked: true,                     // layout won't move this node
      grabbable: false,                 // user can't drag this node
      classes: 'highlight',             // CSS class for CytoStyle selectors
    }}
    onClick={e => {}}      // cytoscape MouseEvent on click
    onAdded={(el, cy) => {}} // called once when node is added to cy graph
    onMount={el => {}}     // React mount lifecycle
    onUnmount={el => {}}   // React unmount lifecycle
  >
    {/* optional: React children rendered as HTML overlay on the node */}
    <div>React content</div>
  </CytoNode>

  <CytoEdge
    element={{
      id: 'e1',
      data: { id: 'e1', source: 'a', target: 'b' },
      classes: 'dashed',               // CSS class for edge styling
    }}
    onClick={e => {}}      // cytoscape MouseEvent on edge click
  />
</Cyto>`} lineNumbers={false} />
        </div>

        <p style={{ opacity: 0.5, marginTop: '0.75rem', fontSize: '0.8rem', lineHeight: 1.6 }}>
          Wrap <code style={{ fontFamily: 'monospace' }}>{'<Cyto>'}</code> in a container with <code style={{ fontFamily: 'monospace' }}>position: relative</code> and a defined height.
          The component fills its parent absolutely. Cola layout runs by default.
        </p>

        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.5rem 0 0.75rem', opacity: 0.8 }}>useGraph()</h2>
        <div style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
          <Code value={`// Available in any child of <Cyto>
const {
  cy,        // live cytoscape instance (null until mounted)
  cyRef,     // ref always holding current cy
  relayout,  // debounced: re-run cola layout
  layout,    // current layout config object
  layoutRef, // ref to running layout (stop/destroy)
  overlayRef,// ref to React overlay div
  rootRef,   // ref to root container div
} = useGraph()`} lineNumbers={false} />
        </div>

        <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: '1.5rem 0 0.75rem', opacity: 0.8 }}>Grab classes</h2>
        <div style={{ border: `1px solid ${isDark ? '#333' : '#ddd'}` }}>
          <Code value={`// Inside a CytoNode with React children:
<div className="cyto-grab">      {/* dragging here moves the node */}
  <div className="cyto-no-grab"> {/* interactive zone — clicks/inputs work */}
    <input />                     {/* inputs/buttons auto-excluded from grab */}
  </div>
</div>`} lineNumbers={false} />
        </div>
      </div>

      <Examples />
    </div>
  )
}
