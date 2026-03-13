'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo, useRef, useState } from 'react'

// Demonstrates Cyto container props:
//   zoom={false}   — disable scroll-to-zoom (user can't zoom)
//   pan={false}    — disable drag-to-pan
//   onLoaded       — imperative access to the cytoscape instance after init
//   style          — forwarded to the root container div
//
// CytoNode extras:
//   element.position  — initial {x, y} in graph coords (cola may move it unless locked)
//   element.locked    — node won't be moved by layout or user drag
//   element.grabbable — false: user can't drag this node (layout can still move it)

export default function CytoPropsExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const cyInstanceRef = useRef<any>(null)
  const [nodeCount, setNodeCount] = useState(0)

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
        'width': 12,
        'height': 12,
      }
    },
    {
      selector: 'node.locked',
      style: {
        'background-color': '#ff6b6b',
        'border-width': 2,
        'border-color': '#ff0000',
      }
    },
    {
      selector: 'node.fixed',
      style: { 'background-color': '#ffd43b' }
    },
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': isDark ? '#444' : '#ccc',
        'curve-style': 'bezier' as const,
      }
    },
  ], [isDark])

  const layout = useMemo(() => ({
    name: 'cola',
    maxSimulationTime: 1000,
    fit: false,
    edgeLength: 100,
  }), [])

  const dim = isDark ? '#666' : '#aaa'
  const bg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'

  return (
    <div style={{ position: 'relative', height: '100%' }}>
      {/* zoom={false} pan={false} — no scroll-zoom, no drag-pan
          onLoaded     — called once with cy instance after cytoscape mounts
          style        — applied to the root container div (position:absolute inset:0) */}
      <Cyto
        layout={layout}
        zoom={false}
        pan={false}
        style={{ background: isDark ? '#0a0a0a' : '#f8f8f8' }}
        onLoaded={(cy) => {
          cyInstanceRef.current = cy
          setNodeCount(cy.nodes().length)
          cy.on('add remove', 'node', () => setNodeCount(cy.nodes().length))
        }}
      >
        <CytoStyle stylesheet={stylesheet} />

        {/* locked: true — layout won't move this node; user can't drag it */}
        <CytoNode
          id="center"
          element={{
            data: { id: 'center', label: 'locked' },
            position: { x: 0, y: 0 },
            locked: true,
            classes: 'locked',
          }}
        />

        {/* grabbable: false — user can't drag; cola layout still positions it */}
        <CytoNode
          id="fixed1"
          element={{
            data: { id: 'fixed1', label: 'not\ngrabbable' },
            position: { x: 100, y: 0 },
            grabbable: false,
            classes: 'fixed',
          }}
        />
        <CytoNode
          id="fixed2"
          element={{
            data: { id: 'fixed2', label: 'not\ngrabbable' },
            position: { x: -100, y: 0 },
            grabbable: false,
            classes: 'fixed',
          }}
        />

        {/* normal nodes — cola places them from their initial positions */}
        <CytoNode id="a" element={{ data: { id: 'a', label: 'A' }, position: { x: 0, y: 120 } }} />
        <CytoNode id="b" element={{ data: { id: 'b', label: 'B' }, position: { x: 120, y: -80 } }} />
        <CytoNode id="c" element={{ data: { id: 'c', label: 'C' }, position: { x: -120, y: -80 } }} />

        <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'center', target: 'a' } }} />
        <CytoEdge element={{ id: 'e2', data: { id: 'e2', source: 'center', target: 'b' } }} />
        <CytoEdge element={{ id: 'e3', data: { id: 'e3', source: 'center', target: 'c' } }} />
        <CytoEdge element={{ id: 'e4', data: { id: 'e4', source: 'fixed1', target: 'b' } }} />
        <CytoEdge element={{ id: 'e5', data: { id: 'e5', source: 'fixed2', target: 'c' } }} />
      </Cyto>

      {/* Legend overlay — imperative cy access: node count from onLoaded */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        fontFamily: 'monospace', fontSize: 10, color: dim,
        background: bg, padding: '6px 10px', pointerEvents: 'none',
      }}>
        <div><span style={{ color: '#ff6b6b' }}>■</span> locked — layout won't touch it</div>
        <div><span style={{ color: '#ffd43b' }}>■</span> not grabbable — user can't drag</div>
        <div style={{ marginTop: 4, borderTop: `1px solid ${dim}`, paddingTop: 4 }}>
          zoom={'{false}'}  pan={'{false}'}  nodes via onLoaded: {nodeCount}
        </div>
      </div>
    </div>
  )
}
