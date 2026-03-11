# @vaed-ai/cyto

[![npm version](https://img.shields.io/npm/v/@vaed-ai/cyto?style=flat&color=000&labelColor=000)](https://www.npmjs.com/package/@vaed-ai/cyto)

React components for [Cytoscape.js](https://js.cytoscape.org/) — declarative graph nodes with React content inside.

**[Live examples & docs →](https://vaed-ai.github.io/cyto)**

## Install

```bash
npm install @vaed-ai/cyto cytoscape cytoscape-cola react-cytoscapejs
```

## Usage

```tsx
import { Cyto, CytoNode, CytoEdge, CytoStyle } from '@vaed-ai/cyto'

function Graph() {
  return (
    <div style={{ position: 'relative', height: 400 }}>
      <Cyto>
        <CytoNode id="a" element={{ data: { id: 'a', label: 'A' } }} />
        <CytoNode id="b" element={{ data: { id: 'b', label: 'B' } }} />
        <CytoEdge element={{ id: 'e1', data: { id: 'e1', source: 'a', target: 'b' } }} />
      </Cyto>
    </div>
  )
}
```

Wrap `<Cyto>` in a container with `position: relative` and a defined height. The component fills its parent absolutely. [Cola layout](https://github.com/cytoscape/cytoscape.js-cola) runs by default.

## Features

- **React content inside nodes** — render any React component as a graph node via `<CytoNode>` children
- **Declarative edges** — `<CytoEdge>` with automatic ghost nodes for source/target ordering
- **CSS variable support** — `resolveCssVars` resolves `var(--name)` in Cytoscape stylesheets at runtime
- **Grab mechanics** — `.cyto-grab` class makes React content draggable, `.cyto-no-grab` blocks propagation, interactive elements (`input`, `button`, `select`, etc.) excluded automatically
- **Cola layout** — force-directed layout with sensible defaults, debounced relayout on node changes

## Components

| Component | Description |
|-----------|-------------|
| `<Cyto>` | Main container. Renders Cytoscape canvas + overlay for React nodes |
| `<CytoNode>` | Adds a node. Pass `children` to render React content inside |
| `<CytoEdge>` | Adds an edge between two nodes |
| `<CytoStyle>` | Declarative stylesheet. Supports CSS variables via `var(--name)` |
| `useGraph()` | Hook to access the Cytoscape instance and internals |

## License

UNLICENSED — All rights reserved.
