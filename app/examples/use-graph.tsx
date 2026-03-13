'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle, useGraph } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo, useCallback, useState } from 'react'

// Demonstrates useGraph() hook — access cy instance and utilities from child components.
//
// useGraph() returns:
//   cy          — live cytoscape instance (null until <Cyto> mounts internally)
//   cyRef       — ref that always holds current cy instance
//   relayout    — debounced function: re-runs the cola layout
//   layout      — current layout config object
//   layoutRef   — ref to the running layout instance (stop/destroy)
//   style       — internal stylesheet setter (used by <CytoStyle>)
//   classesRef  — ref to classes map (internal)
//   overlayRef  — ref to the React overlay div
//   rootRef     — ref to the root container div

function Controls() {
  const { cy, relayout } = useGraph()

  const fit = useCallback(() => {
    cy?.fit(undefined, 50) // fit all elements with 50px padding
  }, [cy])

  const center = useCallback(() => {
    cy?.center()
  }, [cy])

  const reset = useCallback(() => {
    cy?.zoom(1)
    cy?.pan({ x: 0, y: 0 })
  }, [cy])

  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const btn: React.CSSProperties = {
    padding: '4px 10px',
    border: `1px solid ${isDark ? '#555' : '#bbb'}`,
    background: isDark ? '#222' : '#eee',
    color: isDark ? '#fff' : '#000',
    fontFamily: 'monospace',
    fontSize: 11,
    cursor: 'pointer',
  }

  return (
    <div style={{
      position: 'absolute', top: 8, left: 8, zIndex: 10,
      display: 'flex', gap: 4,
    }}>
      <button style={btn} onClick={fit}>fit()</button>
      <button style={btn} onClick={center}>center()</button>
      <button style={btn} onClick={reset}>reset zoom</button>
      <button style={btn} onClick={relayout}>relayout()</button>
    </div>
  )
}

function NodeCounter() {
  const { cy } = useGraph()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  // cy is null on first render — safe-access
  const count = cy?.nodes().length ?? 0

  return (
    <div style={{
      position: 'absolute', bottom: 8, right: 8, zIndex: 10,
      fontFamily: 'monospace', fontSize: 10,
      color: isDark ? '#888' : '#666',
      background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
      padding: '4px 8px',
    }}>
      {count} nodes via useGraph().cy
    </div>
  )
}

export default function UseGraphExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': isDark ? '#fff' : '#000',
        'label': 'data(label)',
        'color': isDark ? '#ccc' : '#555',
        'text-valign': 'bottom' as const,
        'text-margin-y': 6,
        'font-size': 10,
        'width': 10,
        'height': 10,
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': isDark ? '#444' : '#ccc',
        'target-arrow-color': isDark ? '#555' : '#aaa',
        'target-arrow-shape': 'triangle' as const,
        'curve-style': 'bezier' as const,
      }
    },
  ], [isDark])

  const IDS = ['a', 'b', 'c', 'd', 'e']

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />

      {/* useGraph() works in any child of <Cyto> */}
      <Controls />
      <NodeCounter />

      {IDS.map(id => (
        <CytoNode key={id} id={id} element={{ data: { id, label: id.toUpperCase() } }} />
      ))}
      <CytoEdge element={{ id: 'ab', data: { id: 'ab', source: 'a', target: 'b' } }} />
      <CytoEdge element={{ id: 'bc', data: { id: 'bc', source: 'b', target: 'c' } }} />
      <CytoEdge element={{ id: 'cd', data: { id: 'cd', source: 'c', target: 'd' } }} />
      <CytoEdge element={{ id: 'de', data: { id: 'de', source: 'd', target: 'e' } }} />
      <CytoEdge element={{ id: 'ea', data: { id: 'ea', source: 'e', target: 'a' } }} />
      <CytoEdge element={{ id: 'ac', data: { id: 'ac', source: 'a', target: 'c' } }} />
    </Cyto>
  )
}
