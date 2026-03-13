'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo, useState } from 'react'

// Demonstrates:
//   CytoNode onClick   — called with cytoscape event when node is clicked
//   CytoEdge onClick   — called with cytoscape event when edge is clicked
//   CytoNode onAdded   — called with (cyEl, cy) once the node is added to the graph
//   CytoNode onMount   — called when the React element mounts (before cy add)
//   CytoNode onUnmount — called when the React element unmounts

const NODES = [
  { id: 'alice',   label: 'Alice' },
  { id: 'bob',     label: 'Bob' },
  { id: 'charlie', label: 'Charlie' },
]
const EDGES = [
  { id: 'e1', source: 'alice',   target: 'bob' },
  { id: 'e2', source: 'bob',     target: 'charlie' },
  { id: 'e3', source: 'charlie', target: 'alice' },
]

export default function EventsExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [log, setLog] = useState<string[]>(['(click a node or edge)'])

  const push = (msg: string) => setLog(prev => [...prev.slice(-5), msg])

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': isDark ? '#fff' : '#000',
        'label': 'data(label)',
        'color': isDark ? '#fff' : '#000',
        'text-valign': 'center' as const,
        'text-halign': 'right' as const,
        'text-margin-x': 10,
        'font-size': 12,
        'width': 12,
        'height': 12,
        'cursor': 'pointer',
      }
    },
    {
      selector: 'node:selected',
      style: {
        'background-color': '#4a9eff',
        'border-width': 2,
        'border-color': '#4a9eff',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': isDark ? '#555' : '#aaa',
        'target-arrow-color': isDark ? '#555' : '#aaa',
        'target-arrow-shape': 'triangle' as const,
        'curve-style': 'bezier' as const,
        'cursor': 'pointer',
      }
    },
    {
      selector: 'edge:selected',
      style: {
        'line-color': '#ff6b6b',
        'target-arrow-color': '#ff6b6b',
        'width': 3,
      }
    },
  ], [isDark])

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />

      {NODES.map(n => (
        <CytoNode
          key={n.id}
          id={n.id}
          element={{ data: { id: n.id, label: n.label } }}

          // onClick — cytoscape MouseEvent; e.target is the cy element
          onClick={(e: any) => push(`node clicked: ${e.target.id()}`)}

          // onAdded — (cyEl, cy) once node exists in graph; good for imperative setup
          onAdded={(cyEl: any, cy: any) => push(`node added: ${cyEl.id()} (total: ${cy.nodes().length})`)}

          // onMount — React lifecycle (before cy add)
          onMount={() => push(`node mounted: ${n.id}`)}

          // onUnmount — React lifecycle (on unmount)
          onUnmount={() => push(`node unmounted: ${n.id}`)}
        />
      ))}

      {EDGES.map(e => (
        <CytoEdge
          key={e.id}
          element={{ id: e.id, data: { id: e.id, source: e.source, target: e.target } }}

          // onClick — same signature as CytoNode.onClick
          onClick={(ev: any) => push(`edge clicked: ${ev.target.source().id()} → ${ev.target.target().id()}`)}
        />
      ))}

      {/* Log display — React overlay inside Cyto */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10, right: 10,
        fontFamily: 'monospace', fontSize: 10,
        color: isDark ? '#888' : '#666',
        background: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)',
        padding: '6px 10px', pointerEvents: 'none',
        borderTop: `1px solid ${isDark ? '#333' : '#ddd'}`,
      }}>
        {log.map((l, i) => <div key={i}>{l}</div>)}
      </div>
    </Cyto>
  )
}
