'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { useMemo } from 'react'

export default function StylesExample() {
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
        'text-halign': 'center',
        'font-size': 10,
        'width': 'data(size)',
        'height': 'data(size)',
      }
    },
    {
      selector: 'node.highlight',
      style: {
        'background-color': '#ff6b6b',
        'border-width': 2,
        'border-color': '#ff0000',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 1,
        'line-color': isDark ? '#333' : '#ccc',
        'curve-style': 'bezier',
      }
    },
  ], [isDark])

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />
      <CytoNode id="hub" element={{ data: { id: 'hub', label: 'Hub', size: 40 }, classes: 'highlight' }} />
      <CytoNode id="s1" element={{ data: { id: 's1', label: 'S1', size: 20 } }} />
      <CytoNode id="s2" element={{ data: { id: 's2', label: 'S2', size: 20 } }} />
      <CytoNode id="s3" element={{ data: { id: 's3', label: 'S3', size: 20 } }} />
      <CytoNode id="s4" element={{ data: { id: 's4', label: 'S4', size: 20 } }} />
      <CytoEdge element={{ id: 'h1', data: { id: 'h1', source: 'hub', target: 's1' } }} />
      <CytoEdge element={{ id: 'h2', data: { id: 'h2', source: 'hub', target: 's2' } }} />
      <CytoEdge element={{ id: 'h3', data: { id: 'h3', source: 'hub', target: 's3' } }} />
      <CytoEdge element={{ id: 'h4', data: { id: 'h4', source: 'hub', target: 's4' } }} />
    </Cyto>
  )
}
