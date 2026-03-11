'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo } from 'react'

export default function BasicExample() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': isDark ? '#fff' : '#000',
        'label': 'data(label)',
        'color': isDark ? '#fff' : '#000',
        'text-valign': 'center',
        'text-halign': 'right',
        'text-margin-x': 10,
        'font-size': 12,
        'width': 10,
        'height': 10,
      }
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

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />
      <CytoNode id="a" element={{ data: { id: 'a', label: 'Node A' } }} />
      <CytoNode id="b" element={{ data: { id: 'b', label: 'Node B' } }} />
      <CytoNode id="c" element={{ data: { id: 'c', label: 'Node C' } }} />
      <CytoEdge element={{ id: 'ab', data: { id: 'ab', source: 'a', target: 'b' } }} />
      <CytoEdge element={{ id: 'bc', data: { id: 'bc', source: 'b', target: 'c' } }} />
      <CytoEdge element={{ id: 'ca', data: { id: 'ca', source: 'c', target: 'a' } }} />
    </Cyto>
  )
}
