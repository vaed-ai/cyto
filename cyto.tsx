"use client"

import {
  createContext, forwardRef, memo, useCallback, useContext,
  useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react'
import { Over, Node as OverNode, useOver } from '@vaed-ai/over'

// @ts-ignore
import CytoscapeComponent from 'react-cytoscapejs'
import cytoscape from 'cytoscape'
import cola from 'cytoscape-cola'

cytoscape.use(cola)

// ─── Helpers ───

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  const ka = Object.keys(a), kb = Object.keys(b)
  if (ka.length !== kb.length) return false
  return ka.every(k => deepEqual(a[k], b[k]))
}

function resolveCssVars(styleArray: any[]): Promise<any[]> {
  return new Promise(resolve => {
    setTimeout(() => {
      if (typeof document === 'undefined') return resolve(styleArray)
      const computed = getComputedStyle(document.documentElement)
      resolve(styleArray.map(rule => {
        if (!rule.style) return rule
        const style: Record<string, any> = {}
        for (const [key, value] of Object.entries(rule.style)) {
          if (typeof value === 'string' && value.startsWith('var(')) {
            const m = value.match(/var\((--[^,)]+)(,.*)?\)/)
            if (m) {
              const resolved = computed.getPropertyValue(m[1].trim()).trim()
              style[key] = resolved || (m[2] ? m[2].substring(1).trim() : value)
            } else {
              style[key] = value
            }
          } else {
            style[key] = value
          }
        }
        return { ...rule, style }
      }))
    }, 0)
  })
}

// ─── Contexts ───

export const CytoContext = createContext<any>(null)

export function useGraph() {
  return useContext(CytoContext)
}

const CytoElementsContext = createContext<any>(undefined)
CytoElementsContext.displayName = 'CytoElementsContext'

// ─── Grab helpers ───

const INTERACTIVE_TAGS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A', 'LABEL'])

function shouldGrab(target: HTMLElement): boolean {
  let el: HTMLElement | null = target
  while (el) {
    if (INTERACTIVE_TAGS.has(el.tagName)) return false
    if (el.getAttribute('contenteditable') === 'true') return false
    if (el.classList.contains('cyto-no-grab')) return false
    if (el.classList.contains('cyto-grab')) return true
    el = el.parentElement
  }
  return false
}

function forwardToCanvas(e: MouseEvent, rootRef: React.RefObject<HTMLElement>) {
  const canvas = rootRef.current?.querySelector('canvas')
  if (!canvas) return
  const synth = new MouseEvent('mousedown', {
    clientX: e.clientX,
    clientY: e.clientY,
    screenX: e.screenX,
    screenY: e.screenY,
    button: e.button,
    buttons: e.buttons,
    bubbles: true,
    cancelable: true,
  })
  canvas.dispatchEvent(synth)
}

// ─── ViewportSync (syncs cy viewport → Over transform + grid bg) ───

function ViewportSync({ bgRef }: { bgRef: React.RefObject<HTMLDivElement> }) {
  const over = useOver()
  const { cy } = useContext(CytoContext)

  useEffect(() => {
    if (!cy || !over) return
    const viewport = () => {
      const pan = cy.pan()
      const zoom = cy.zoom()
      if (bgRef.current) {
        const z = zoom * 3
        bgRef.current.style.backgroundSize = `${z}em ${z}em`
        bgRef.current.style.backgroundPosition = `${pan.x}px ${pan.y}px`
      }
      over.setTransform(pan, zoom)
    }
    cy.on('viewport', viewport)
    return () => cy.removeListener('viewport', viewport)
  }, [cy, over, bgRef])

  return null
}

// ─── GrabHandler (forwards mousedown on .cyto-grab to cytoscape canvas) ───

function GrabHandler() {
  const over = useOver()
  const { rootRef } = useContext(CytoContext)

  useEffect(() => {
    const el = over?.overlayRef?.current
    if (!el) return
    const handler = (e: MouseEvent) => {
      if (shouldGrab(e.target as HTMLElement)) {
        e.preventDefault()
        forwardToCanvas(e, rootRef)
      }
    }
    el.addEventListener('mousedown', handler)
    return () => el.removeEventListener('mousedown', handler)
  }, [over, rootRef])

  return null
}

// ─── Cyto (main container) ───

let nodesIterator = 1
let edgesIterator = 1
let stylesIterator = 1

export const Cyto = memo(function Cyto(props: {
  onLoaded?: (cy: any) => void
  layout?: any
  className?: string
  style?: React.CSSProperties
  children?: any
  zoom?: boolean
  pan?: boolean
  grid?: boolean
  [key: string]: any
}) {
  return (
    <Over className={props.className} style={props.style}>
      <CytoInner {...props} />
    </Over>
  )
})

function CytoInner({
  onLoaded: _onLoaded,
  layout: _layout,
  children = null,
  zoom = true,
  pan = true,
  grid = true,
}: {
  onLoaded?: (cy: any) => void
  layout?: any
  children?: any
  zoom?: boolean
  pan?: boolean
  grid?: boolean
  [key: string]: any
}) {
  const over = useOver()

  const [_cy, setCy] = useState<any>()
  const cyRef = useRef<any>(undefined)
  cyRef.current = _cy
  const layoutRef = useRef<any>(undefined)
  const bgRef = useRef<any>(undefined)

  const gridColor = '#747474'

  const onLoaded = useCallback((cy: any) => {
    if (_cy) return
    setCy(cy)
    cyRef.current = cy

    const onNodeAdd = (evt: any) => {
      cy.emit(`node:created:${evt.target.id()}`, [evt.target])
      relayout()
    }

    cy.on('add', 'node', onNodeAdd)
    _onLoaded?.(cy)
  }, [_cy])

  // ─── Stylesheet management ───

  const [styles, setStyles] = useState<Record<number, any>>({})
  const style = useCallback((i: number, styleSheet?: any) => {
    setStyles(prev => {
      const next = { ...prev }
      if (!styleSheet) delete next[i]
      else next[i] = styleSheet
      return next
    })
  }, [])

  const classesRef = useRef<Map<string, Set<Function>>>(new Map())

  const [finalStylesheet, setFinalStylesheet] = useState<any[]>([])
  useEffect(() => {
    const flat = Object.values(styles).flat()
    const clone = JSON.parse(JSON.stringify(flat))
    resolveCssVars(clone).then(setFinalStylesheet)
  }, [styles])

  const elements = useMemo(() => [], [])

  const layout = useMemo(() => (
    typeof _layout === 'object' ? _layout : {
      name: 'cola',
      refresh: 10,
      maxSimulationTime: 100,
      fit: false,
      nodeDimensionsIncludeLabels: true,
      edgeLength: (edge: any) => {
        const s = edge.source().connectedEdges().length
        const t = edge.target().connectedEdges().length
        return 100 + (s + t) * 10
      },
    }
  ), [_layout])

  const relayoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const relayout = useCallback(() => {
    if (relayoutTimer.current) clearTimeout(relayoutTimer.current)
    relayoutTimer.current = setTimeout(() => {
      if (!cyRef.current) return
      let lay = layoutRef.current
      if (lay) {
        lay.stop?.()
        lay.destroy?.()
      }
      layoutRef.current = lay = cyRef.current.elements().layout(layout)
      lay.run()
    }, 300)
  }, [layout])

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const contextValue = useMemo(() => ({
    cyRef, layout, layoutRef, relayout, style, cy: _cy, classesRef,
    overlayRef: over?.overlayRef,
    rootRef: over?.rootRef,
  }), [cyRef, layout, layoutRef, relayout, style, _cy, classesRef, over])

  return (
    <CytoContext.Provider value={contextValue}>
      {grid && <div
        ref={bgRef}
        style={{
          position: 'absolute', inset: 0,
          width: '100%', height: '100%',
          backgroundImage: `
            radial-gradient(circle at 0 0, ${gridColor} 1px, transparent 1px),
            radial-gradient(circle at .1em .1em, ${gridColor} 1px, transparent 1px),
            radial-gradient(circle at 0 .1em, ${gridColor} 1px, transparent 1px),
            radial-gradient(circle at .1em 0, ${gridColor} 1px, transparent 1px)
          `,
          backgroundSize: '3em 3em',
          backgroundPosition: '0 0',
          backgroundRepeat: 'repeat',
        }}
      />}
      {mounted && <CytoscapeComponent
        cy={onLoaded}
        elements={elements}
        layout={layout}
        stylesheet={finalStylesheet}
        panningEnabled={true}
        userZoomingEnabled={zoom}
        userPanningEnabled={pan}
        style={{ position: 'absolute', inset: 0 }}
      />}
      {!!_cy && <>
        <ViewportSync bgRef={bgRef} />
        <GrabHandler />
        {children}
      </>}
    </CytoContext.Provider>
  )
}

// ─── CytoNode ───

interface CytoNodeProps {
  id?: string
  element?: {
    id?: string
    data: { id?: string; parent?: string; [key: string]: any }
    position?: { x?: number; y?: number }
    classes?: string | string[]
    locked?: boolean
    grabbable?: boolean
  }
  ghost?: boolean
  children?: any
  onAdded?: (el: any, cy: any) => void
  onClick?: (e: any) => void
  onGhost?: (e: any) => void
  onUnghost?: (e: any) => void
  onMount?: (element: any) => void
  onUnmount?: (element: any) => void
  [key: string]: any
}

const CytoNodeCore: React.FC<CytoNodeProps & { forwardedRef: React.Ref<any> }> = (props) => {
  const { forwardedRef, element, ghost, children, onAdded, onClick, onGhost, onUnghost } = props

  const onAddedRef = useRef(onAdded)
  const onClickRef = useRef(onClick)
  const onGhostRef = useRef(onGhost)
  const onUnghostRef = useRef(onUnghost)
  onAddedRef.current = onAdded
  onClickRef.current = onClick
  onGhostRef.current = onGhost
  onUnghostRef.current = onUnghost

  const internalElRef = useRef<any>(null)
  const refToUse = (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef)
    ? forwardedRef : internalElRef

  const { cy, relayout } = useContext(CytoContext)
  const over = useOver()
  const i = useMemo(() => nodesIterator++, [])
  const cls = useMemo(() => `ni-${i}${ghost ? '-ghost' : ''}`, [i, ghost])
  const parent: any = useContext(CytoElementsContext)

  const id = useMemo(() => `${props?.id || element?.id || element?.data?.id}`, [props?.id, element])
  if (!id) throw new Error('CytoNode requires an id')
  if (element) {
    element.id = id
    element.data.id = id
  }

  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
    props.onMount?.(element)
    return () => { props.onUnmount?.(element) }
  }, [element, props.onMount, props.onUnmount])

  const [cytoscapeNode, setCytoscapeNode] = useState<any>(null)
  const classesArray = useMemo(() =>
    typeof element?.classes === 'string' ? element.classes.split(' ') : element?.classes || []
  , [element?.classes])

  const useEffectHook = ghost ? useEffect : useLayoutEffect

  useEffectHook(() => {
    if (!cy) return

    let cyEl = cy.$id(id)
    const isNew = !cyEl.length

    const dataForCy = {
      id,
      label: element?.data?.label,
      parent: (parent && parent.id()) || undefined,
      ...element?.data
    }

    if (isNew) {
      cyEl = cy.add({
        group: 'nodes' as const,
        data: dataForCy,
        position: element?.position,
        classes: [cls, ...classesArray],
        locked: element?.locked,
        grabbable: element?.grabbable,
      })
      if (ghost) { cyEl.addClass('ghost'); cyEl.emit('ghost') }
      onAddedRef.current?.(cyEl, cy)
    } else {
      cyEl.addClass(cls)
      if (classesArray.length > 0) cyEl.addClass(classesArray.join(' '))
      if (!ghost) cyEl.data(dataForCy)
      else if (!ghost) {
        if (!deepEqual(cyEl.data(), dataForCy)) cyEl.data(dataForCy)
      }
      if (typeof element?.locked === 'boolean' && cyEl.locked() !== element.locked)
        cyEl[element.locked ? 'lock' : 'unlock']()
      if (typeof element?.grabbable === 'boolean' && cyEl.grabbable() !== element.grabbable)
        cyEl[element.grabbable ? 'grabify' : 'ungrabify']()
    }

    const classes = cyEl.classes() as string[]
    const hasGhostClasses = classes.some((c: string) => c.endsWith('-ghost'))
    const hasNonGhostClasses = classes.some((c: string) => c.startsWith('ni-') && !c.endsWith('-ghost'))
    const hasGhostCss = cyEl.hasClass('ghost')

    if (!ghost && (hasGhostClasses || hasGhostCss)) {
      cyEl.data(dataForCy)
      cyEl.removeClass('ghost')
      cyEl.emit('unghost')
    } else if (ghost && hasNonGhostClasses) {
      // non-ghost already controls
    } else if (ghost && !hasGhostCss && !hasNonGhostClasses) {
      cyEl.addClass('ghost')
      cyEl.emit('ghost')
    }

    ;(refToUse as React.MutableRefObject<any>).current = cyEl
    if (typeof forwardedRef === 'function') forwardedRef(cyEl)
    setCytoscapeNode(cyEl)

    const clickHandler = (e: any) => onClickRef.current?.(e)
    const ghostHandler = (e: any) => onGhostRef.current?.(e)
    const unghostHandler = (e: any) => onUnghostRef.current?.(e)

    cyEl.on('click', clickHandler)
    cyEl.on('ghost', ghostHandler)
    cyEl.on('unghost', unghostHandler)

    return () => {
      cyEl.off('click', clickHandler)
      cyEl.off('ghost', ghostHandler)
      cyEl.off('unghost', unghostHandler)

      const cur = cy?.$id(id)
      if (cur?.length && cur.inside()) {
        cur.removeClass(cls)
        const remaining = (cur.classes() as string[]).filter((c: string) => c.startsWith('ni-'))
        if (remaining.length === 0) {
          cur.remove()
        } else {
          const nonGhost = remaining.filter((c: string) => !c.endsWith('-ghost'))
          const ghostCls = remaining.filter((c: string) => c.endsWith('-ghost'))
          if (nonGhost.length === 0 && ghostCls.length > 0) {
            cur.data({ id, parent: cur.data('parent') })
            cur.addClass('ghost')
            cur.emit('ghost')
          }
        }
      }
      setCytoscapeNode(null)
    }
  }, [
    cy, id, ghost, element?.data?.label, element?.data?.id,
    element?.locked, element?.grabbable, JSON.stringify(classesArray),
    cls, refToUse, forwardedRef, parent
  ])

  // ─── Position sync: cy node → Over node ───

  useEffect(() => {
    if (!children || !cytoscapeNode?.length || !cytoscapeNode.inside() || !over) return

    const p = cytoscapeNode.position()
    if (p) over.setNodePosition(id, p)

    const handlePosition = (e: any) => {
      over.setNodePosition(id, e.target.position())
    }
    cytoscapeNode.on('position', handlePosition)

    return () => {
      cytoscapeNode?.off?.('position', handlePosition)
    }
  }, [id, cytoscapeNode, over, children])

  // ─── Resize: Over node size → cy node size ───

  const handleResize = useCallback((size: { width: number; height: number }) => {
    if (!cytoscapeNode?.length || !cytoscapeNode.inside()) return
    const parse = (v: any): number => typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0
    const cw = parse(cytoscapeNode.style('width'))
    const ch = parse(cytoscapeNode.style('height'))
    if (size.width > 0 && size.height > 0 && (Math.abs(cw - size.width) > 0.5 || Math.abs(ch - size.height) > 0.5)) {
      cytoscapeNode.style({ width: size.width, height: size.height })
      relayout?.()
    }
  }, [cytoscapeNode, relayout])

  return (
    <CytoElementsContext.Provider value={cytoscapeNode}>
      {!!children && <OverNode id={id} onResize={handleResize}>{children}</OverNode>}
    </CytoElementsContext.Provider>
  )
}

const ForwardedCytoNode = forwardRef<any, CytoNodeProps>((props, ref) => (
  <CytoNodeCore {...props} forwardedRef={ref} />
))
ForwardedCytoNode.displayName = 'CytoNode'

export const CytoNode = memo(ForwardedCytoNode, (prev, next) => {
  if (prev.ghost !== next.ghost) return false
  if (prev.element?.id !== next.element?.id) return false
  if (!deepEqual(prev.element?.data, next.element?.data)) return false
  if (!deepEqual(prev.element?.position, next.element?.position)) return false
  if (!deepEqual(prev.element?.classes, next.element?.classes)) return false
  if (prev.element?.locked !== next.element?.locked) return false
  if (prev.element?.grabbable !== next.element?.grabbable) return false
  if (prev.children !== next.children) return false
  return true
})

// ─── CytoEdge ───

export const CytoEdge = memo(function CytoEdge({
  element,
  children = null,
  ...props
}: {
  element: {
    id: string
    data: { id: string; source: string; target: string; [key: string]: any }
    classes?: string | string[]
    [key: string]: any
  }
  children?: any
  [key: string]: any
}) {
  const { cy, relayout } = useContext(CytoContext)
  const i = useMemo(() => edgesIterator++, [])
  const cls = useMemo(() => `ei-${i}`, [])

  const id = useMemo(() => {
    const eid = element?.id || element?.data?.id
    if (!eid && element?.data?.source && element?.data?.target)
      return `edge-${element.data.source}-${element.data.target}-${i}`
    return `${eid || `generated-edge-${i}`}`
  }, [element, i])

  const [isMounted, setIsMounted] = useState(false)
  const mount = useCallback(() => setIsMounted(true), [id])

  const classesArray = useMemo(() =>
    typeof element?.classes === 'string' ? element.classes.split(' ') : element?.classes || []
  , [element?.classes])

  const addEdge = useCallback(() => {
    if (!cy || !element?.data?.source || !element?.data?.target || !isMounted) return

    let cyEdge = cy.$id(id)
    if (cyEdge.length > 0) {
      if (!cyEdge.hasClass(cls)) cyEdge.addClass(cls)
      return
    }

    const tryCreate = () => {
      const src = cy.$id(element.data.source)
      const tgt = cy.$id(element.data.target)
      if (!src.length || !tgt.length) return

      const added = cy.add({
        group: 'edges' as const,
        data: { ...element.data, id },
        classes: [cls, ...classesArray],
      })

      if (props.onClick) {
        const handler = (e: any) => props.onClick(e)
        added.on('click', handler)
      }
    }

    const src = cy.$id(element.data.source)
    const tgt = cy.$id(element.data.target)

    if (!src.length) cy.once(`node:created:${element.data.source}`, tryCreate)
    if (!tgt.length) cy.once(`node:created:${element.data.target}`, tryCreate)
    if (src.length && tgt.length) tryCreate()
  }, [cy, element, isMounted, id, cls, props.onClick])

  useEffect(() => {
    if (!cy || !isMounted || !element?.data?.source || !element?.data?.target) return

    let cyEdge = cy.$id(id)
    if (!cyEdge.length) {
      addEdge()
    } else {
      if (!deepEqual(cyEdge.data(), { ...element.data, id })) cyEdge.data(element.data)
      if (!cyEdge.hasClass(cls)) cyEdge.addClass(cls)
    }
  }, [cy, element, isMounted, id, cls, addEdge])

  useEffect(() => () => {
    if (cy) {
      const edge = cy.$id(id)
      if (edge.length) edge.remove()
    }
  }, [cy, id])

  const ghostsRef = useRef(0)
  const ghostMounted = useCallback(() => {
    ghostsRef.current++
    if (ghostsRef.current >= 2) mount()
  }, [id, mount])

  return <>
    <CytoNode
      element={{ id: element.data.source, data: { id: element.data.source } }}
      ghost={true}
      onMount={() => ghostMounted()}
    />
    <CytoNode
      element={{ id: element.data.target, data: { id: element.data.target } }}
      ghost={true}
      onMount={() => ghostMounted()}
    />
  </>
}, (prev, next) => {
  if (prev.element?.id !== next.element?.id) return false
  if (!deepEqual(prev.element?.data, next.element?.data)) return false
  if (!deepEqual(prev.element?.classes, next.element?.classes)) return false
  if (prev.onClick !== next.onClick) return false
  return true
})

// ─── CytoStyle ───

export const CytoStyle = memo(function CytoStyle({
  stylesheet,
}: {
  stylesheet?: any
}) {
  const i = useMemo(() => stylesIterator++, [])
  const { style } = useContext(CytoContext)

  useEffect(() => {
    style?.(i, stylesheet)
    return () => { style?.(i, undefined) }
  }, [i, style, stylesheet])

  return null
}, (p, n) => deepEqual(p.stylesheet, n.stylesheet))
