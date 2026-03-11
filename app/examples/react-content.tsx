'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo } from 'react'

export default function ReactContentExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

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

  const card = (accent: string): React.CSSProperties => ({
    padding: '12px 16px',
    border: `1px solid ${isDark ? '#444' : '#ccc'}`,
    background: isDark ? '#111' : '#fafafa',
    color: isDark ? '#fff' : '#000',
    fontFamily: 'monospace',
    fontSize: '0.8rem',
    borderLeft: `3px solid ${accent}`,
    minWidth: 120,
  })

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />
      <CytoNode id="user" element={{ data: { id: 'user' } }}>
        <div style={card('#4a9eff')}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>User</div>
          <div style={{ opacity: 0.6 }}>id: 1</div>
          <div style={{ opacity: 0.6 }}>name: Alice</div>
        </div>
      </CytoNode>
      <CytoNode id="post" element={{ data: { id: 'post' } }}>
        <div style={card('#ff6b6b')}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Post</div>
          <div style={{ opacity: 0.6 }}>title: Hello</div>
        </div>
      </CytoNode>
      <CytoNode id="comment" element={{ data: { id: 'comment' } }}>
        <div style={card('#51cf66')}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Comment</div>
          <div style={{ opacity: 0.6 }}>text: Nice!</div>
        </div>
      </CytoNode>
      <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'user', target: 'post' } }} />
      <CytoEdge element={{ id: 'e2', data: { id: 'e2', source: 'user', target: 'comment' } }} />
      <CytoEdge element={{ id: 'e3', data: { id: 'e3', source: 'post', target: 'comment' } }} />
    </Cyto>
  )
}
