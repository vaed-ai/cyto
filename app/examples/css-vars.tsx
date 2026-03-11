'use client'

import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'
import { useMemo } from 'react'

// Cytoscape natively does NOT support CSS custom properties (var(--...)).
// @vaed-ai/cyto resolves them automatically via resolveCssVars:
// any var(--name) in stylesheet values is replaced with the computed value
// from getComputedStyle(document.documentElement) before passing to Cytoscape.
//
// This means you can use your app's CSS variables (from Tailwind, theme systems,
// or any CSS) directly in Cytoscape stylesheets — they resolve at runtime.

export default function CssVarsExample() {
  // These CSS variables come from globals.css [data-vaed][data-theme="..."]
  // --vaed-text, --vaed-bg, --vaed-text-dim are defined there.
  // Cytoscape would normally ignore them, but resolveCssVars converts them.

  const stylesheet = useMemo(() => [
    {
      selector: 'node',
      style: {
        'background-color': 'var(--vaed-text)',        // resolved: #fff or #000
        'label': 'data(label)',
        'color': 'var(--vaed-text)',                    // resolved from CSS var
        'text-valign': 'center',
        'text-halign': 'right',
        'text-margin-x': 10,
        'font-size': 12,
        'width': 12,
        'height': 12,
      }
    },
    {
      selector: 'node.dim',
      style: {
        'background-color': 'var(--vaed-text-dim)',     // resolved: rgba(...)
        'color': 'var(--vaed-text-dim)',
      }
    },
    {
      selector: 'edge',
      style: {
        'width': 2,
        'line-color': 'var(--vaed-text-dim)',           // uses CSS variable
        'target-arrow-color': 'var(--vaed-text-dim)',
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
      }
    },
  ], [])  // no deps — var() values resolve dynamically on theme change

  return (
    <Cyto>
      <CytoStyle stylesheet={stylesheet} />
      <CytoNode id="main" element={{ data: { id: 'main', label: 'var(--vaed-text)' } }} />
      <CytoNode id="dim1" element={{ data: { id: 'dim1', label: 'var(--vaed-text-dim)' }, classes: 'dim' }} />
      <CytoNode id="dim2" element={{ data: { id: 'dim2', label: 'var(--vaed-text-dim)' }, classes: 'dim' }} />
      <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'main', target: 'dim1' } }} />
      <CytoEdge element={{ id: 'e2', data: { id: 'e2', source: 'main', target: 'dim2' } }} />
    </Cyto>
  )
}
