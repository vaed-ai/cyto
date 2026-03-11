'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo, useState } from 'react'

// Demonstrates:
// - .cyto-grab class: makes React content grabbable (drags the cytoscape node)
// - .cyto-no-grab class: stops grab propagation (interactive zone)
// - Interactive elements (input, button, select) automatically don't trigger grab

export default function GrabbableExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [log, setLog] = useState<string[]>([])

  const addLog = (msg: string) =>
    setLog(prev => [...prev.slice(-4), msg])

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: { 'background-opacity': 0, 'shape': 'rectangle' }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': isDark ? '#555' : '#aaa',
        'target-arrow-color': isDark ? '#555' : '#aaa',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      }
    },
  ], [isDark])

  const cardBase: React.CSSProperties = {
    border: `1px solid ${isDark ? '#444' : '#ccc'}`,
    background: isDark ? '#111' : '#fafafa',
    color: isDark ? '#fff' : '#000',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    pointerEvents: 'all',
    minWidth: 180,
  }

  const headerStyle: React.CSSProperties = {
    padding: '8px 12px',
    cursor: 'grab',
    borderBottom: `1px solid ${isDark ? '#333' : '#ddd'}`,
    userSelect: 'none',
  }

  const bodyStyle: React.CSSProperties = {
    padding: '8px 12px',
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '4px 6px',
    border: `1px solid ${isDark ? '#555' : '#bbb'}`,
    background: isDark ? '#222' : '#fff',
    color: isDark ? '#fff' : '#000',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    marginTop: 4,
    outline: 'none',
  }

  const btnStyle: React.CSSProperties = {
    padding: '4px 10px',
    border: `1px solid ${isDark ? '#555' : '#bbb'}`,
    background: isDark ? '#333' : '#eee',
    color: isDark ? '#fff' : '#000',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
    cursor: 'pointer',
    marginTop: 4,
  }

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />

      {/* Card with grabbable header, interactive body */}
      <CytoNode id="form" element={{ data: { id: 'form' } }}>
        <div style={cardBase}>
          {/* .cyto-grab: dragging here moves the node */}
          <div className="cyto-grab" style={{ ...headerStyle, borderLeft: '3px solid #4a9eff' }}>
            <b>Form Node</b> — drag here
          </div>
          {/* .cyto-no-grab: interactive zone */}
          <div className="cyto-no-grab" style={bodyStyle}>
            <div style={{ opacity: 0.5, marginBottom: 4 }}>interactive zone:</div>
            <input
              style={inputStyle}
              placeholder="type here..."
              onChange={e => addLog(`input: ${e.target.value}`)}
            />
            <button style={btnStyle} onClick={() => addLog('button clicked!')}>
              Click me
            </button>
            <select
              style={{ ...inputStyle, marginTop: 4 }}
              onChange={e => addLog(`select: ${e.target.value}`)}
            >
              <option>Option A</option>
              <option>Option B</option>
              <option>Option C</option>
            </select>
          </div>
        </div>
      </CytoNode>

      {/* Fully grabbable card — entire surface drags */}
      <CytoNode id="solid" element={{ data: { id: 'solid' } }}>
        <div className="cyto-grab" style={{
          ...cardBase,
          borderLeft: '3px solid #51cf66',
          padding: '12px 16px',
          cursor: 'grab',
          userSelect: 'none',
        }}>
          <b>Grabbable Card</b>
          <div style={{ opacity: 0.5, marginTop: 4 }}>
            entire surface is draggable
          </div>
          {/* button inside .cyto-grab — automatically excluded from grab */}
          <button style={btnStyle} onClick={() => addLog('green btn!')}>
            But this button works
          </button>
        </div>
      </CytoNode>

      {/* Log display node */}
      <CytoNode id="log" element={{ data: { id: 'log' } }}>
        <div style={{
          ...cardBase,
          borderLeft: '3px solid #ffd43b',
          padding: '8px 12px',
          minHeight: 80,
          pointerEvents: 'none',
        }}>
          <b style={{ opacity: 0.5 }}>Event log</b>
          {log.map((l, i) => (
            <div key={i} style={{ opacity: 0.7 }}>{l}</div>
          ))}
        </div>
      </CytoNode>

      <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'form', target: 'solid' } }} />
      <CytoEdge element={{ id: 'e2', data: { id: 'e2', source: 'form', target: 'log' } }} />
      <CytoEdge element={{ id: 'e3', data: { id: 'e3', source: 'solid', target: 'log' } }} />
    </Cyto>
  )
}
