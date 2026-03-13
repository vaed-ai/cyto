"use client"

import {
  createContext, forwardRef, memo, useCallback, useContext,
  useEffect, useLayoutEffect, useMemo, useRef, useState
} from 'react'
import { createPortal } from 'react-dom'

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

const CytoReactNodesContext = createContext<{
  mount: (id: string, activate: () => void) => boolean
  unmount: (id: string, activate: () => void) => void
} | null>(null)

const CytoElementsContext = createContext<any>(undefined)
CytoElementsContext.displayName = 'CytoElementsContext'

// ─── Portal ───

function Portal({ children, containerRef }: {
  children: React.ReactNode
  containerRef: React.RefObject<HTMLElement>
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true); return () => setMounted(false) }, [])
  const target = containerRef?.current || (typeof document !== 'undefined' ? document.body : null)
  return mounted && target ? createPortal(children, target) : null
}

// ─── CytoReactNode (renders React children in overlay) ───

function CytoReactNode({ id, children, boxRefCallback }: {
  id: string
  children: React.ReactNode
  boxRefCallback: (node: HTMLDivElement | null) => void
}) {
  const ctx = useContext(CytoReactNodesContext)
  if (!ctx) throw new Error('CytoReactNode must be inside <Cyto>')
  const { mount, unmount } = ctx
  const { overlayRef } = useGraph()

  const activate = useCallback(() => setIsActive(true), [])
  const initialActive = useMemo(() => mount(id, activate), [])
  const [isActive, setIsActive] = useState(initialActive)

  useEffect(() => () => { unmount(id, activate) }, [])

  if (!isActive) return null

  return (
    <Portal containerRef={overlayRef}>
      <div ref={boxRefCallback} style={{ position: 'absolute' }}>
        {children}
      </div>
    </Portal>
  )
}

// ─── Grab helpers ───

const INTERACTIVE_TAGS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A', 'LABEL'])

function shouldGrab(target: HTMLElement): boolean {
  let el: HTMLElement | null = target
  // Walk up from target; if we hit cyto-no-grab or interactive element before cyto-grab, don't grab
  while (el) {
    if (INTERACTIVE_TAGS.has(el.tagName)) return false
    if (el.getAttribute('contenteditable') === 'true') return false
    if (el.classList.contains('cyto-no-grab')) return false
    if (el.classList.contains('cyto-grab')) return true
    el = el.parentElement
  }
  return false
}

function forwardToCanvas(e: React.MouseEvent, rootRef: React.RefObject<HTMLElement>) {
  const canvas = rootRef.current?.querySelector('canvas')
  if (!canvas) return
  const rect = canvas.getBoundingClientRect()
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

// ─── Cyto (main container) ───

let nodesIterator = 1
let edgesIterator = 1
let stylesIterator = 1

export const Cyto = memo(function Cyto({
  onLoaded: _onLoaded,
  layout: _layout,
  className,
  style: _style = {},
  children = null,
  zoom = true,
  pan = true,
  ...props
}: {
  onLoaded?: (cy: any) => void
  layout?: any
  className?: string
  style?: React.CSSProperties
  children?: any
  zoom?: boolean
  pan?: boolean
  [key: string]: any
}) {
  const [_cy, setCy] = useState<any>()
  const cyRef = useRef<any>(undefined)
  cyRef.current = _cy
  const layoutRef = useRef<any>(undefined)
  const overlayRef = useRef<any>(undefined)
  const bgRef = useRef<any>(undefined)
  const rootRef = useRef<any>(undefined)

  const gridColor = '#747474'

  const onLoaded = useCallback((cy: any) => {
    if (_cy) return
    setCy(cy)
    cyRef.current = cy

    const viewport = () => {
      const pan = cy.pan()
      const zoom = cy.zoom()
      if (bgRef.current) {
        const z = zoom * 3
        bgRef.current.style['background-size'] = `${z}em ${z}em`
        bgRef.current.style['background-position'] = `${pan.x}px ${pan.y}px`
      }
      if (overlayRef.current) {
        overlayRef.current.style['transform'] = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
      }
    }

    const onNodeAdd = (evt: any) => {
      cy.emit(`node:created:${evt.target.id()}`, [evt.target])
      relayout()
    }

    cy.on('viewport', viewport)
    cy.on('add', 'node', onNodeAdd)
    _onLoaded?.(cy)

    return () => {
      cy.removeListener('viewport', viewport)
      cy.off('add', 'node', onNodeAdd)
    }
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

  const [cytoscapeEl, setCytoscapeEl] = useState<any>(null)
  useEffect(() => {
    if (rootRef.current) setCytoscapeEl(
      <CytoscapeComponent
        cy={onLoaded}
        elements={elements}
        layout={layout}
        stylesheet={finalStylesheet}
        panningEnabled={true}
        userZoomingEnabled={zoom}
        userPanningEnabled={pan}
        style={{ position: 'absolute', inset: 0 }}
      />
    )
  }, [onLoaded, finalStylesheet])

  // ─── React nodes activation tracking ───

  const activationMap = useRef<Map<string, Set<() => void>>>(new Map())
  const reactNodesProviderValue = useMemo(() => ({
    mount: (id: string, activate: () => void): boolean => {
      const set = activationMap.current.get(id)
      if (set) {
        set.add(activate)
        return false
      }
      activationMap.current.set(id, new Set([activate]))
      return true
    },
    unmount: (id: string, activate: () => void) => {
      const set = activationMap.current.get(id)
      if (!set) return
      set.delete(activate)
      if (set.size > 0) {
        const next = set.values().next().value
        next?.()
      } else {
        activationMap.current.delete(id)
      }
    },
  }), [])

  const handleOverlayMouseDown = useCallback((e: React.MouseEvent) => {
    if (shouldGrab(e.target as HTMLElement)) {
      e.preventDefault()
      forwardToCanvas(e, rootRef as React.RefObject<HTMLElement>)
    }
  }, [])

  const contextValue = useMemo(() => ({
    cyRef, layout, layoutRef, relayout, style, cy: _cy, classesRef, overlayRef, rootRef
  }), [cyRef, layout, layoutRef, relayout, style, _cy, classesRef, overlayRef])

  return (
    <CytoContext.Provider value={contextValue}>
      <CytoReactNodesContext.Provider value={reactNodesProviderValue}>
        <div className={className} style={{ position: 'absolute', inset: 0, ...(_style || {}) }} ref={rootRef}>
          <div
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
          />
          {cytoscapeEl}
          {!!_cy && <div
            ref={overlayRef}
            onMouseDown={handleOverlayMouseDown}
            style={{
              position: 'absolute', left: 0, top: 0,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
          >
            {children}
          </div>}
        </div>
      </CytoReactNodesContext.Provider>
    </CytoContext.Provider>
  )
})

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
  const { forwardedRef, element, ghost, children, onAdded, ...restProps } = props

  const internalElRef = useRef<any>(null)
  const refToUse = (forwardedRef && typeof forwardedRef === 'object' && 'current' in forwardedRef)
    ? forwardedRef : internalElRef

  const { cy, relayout } = useContext(CytoContext)
  const i = useMemo(() => nodesIterator++, [])
  const cls = useMemo(() => `ni-${i}${ghost ? '-ghost' : ''}`, [i, ghost])
  const parent: any = useContext(CytoElementsContext)

  const id = useMemo(() => `${props?.id || element?.id || element?.data?.id}`, [props?.id, element])
  if (!id) throw new Error('CytoNode requires an id')
  if (element) {
    element.id = id
    element.data.id = id
  }

  const [htmlElement, setHtmlElement] = useState<HTMLDivElement | null>(null)
  const boxRefCallback = useCallback((node: HTMLDivElement | null) => {
    setHtmlElement(node || null)
  }, [id])

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
      onAdded?.(cyEl, cy)
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

    // Ghost state management
    const classes = cyEl.classes() as string[]
    const hasGhostClasses = classes.some((c: string) => c.endsWith('-ghost'))
    const hasNonGhostClasses = classes.some((c: string) => c.startsWith('ni-') && !c.endsWith('-ghost'))
    const hasGhostCss = cyEl.hasClass('ghost')

    if (!ghost && (hasGhostClasses || hasGhostCss)) {
      cyEl.data(dataForCy)
      cyEl.removeClass('ghost')
      cyEl.emit('unghost')
    } else if (ghost && hasNonGhostClasses) {
      // non-ghost already controls — skip
    } else if (ghost && !hasGhostCss && !hasNonGhostClasses) {
      cyEl.addClass('ghost')
      cyEl.emit('ghost')
    }

    ;(refToUse as React.MutableRefObject<any>).current = cyEl
    if (typeof forwardedRef === 'function') forwardedRef(cyEl)
    setCytoscapeNode(cyEl)

    const { onClick, onGhost, onUnghost } = restProps
    const clickHandler = (e: any) => onClick?.(e)
    const ghostHandler = (e: any) => onGhost?.(e)
    const unghostHandler = (e: any) => onUnghost?.(e)

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
    cls, onAdded, refToUse, forwardedRef,
    restProps.onClick, restProps.onGhost, restProps.onUnghost, parent
  ])

  // ─── Position tracking + resize observer ───

  const onPositionRef = useRef<((p: { x: number; y: number }) => void) | null>(null)
  useEffect(() => {
    onPositionRef.current = (p) => {
      if (htmlElement) {
        htmlElement.style.transform = `translate(calc(${p.x}px - 50%), calc(${p.y}px - 50%))`
      }
    }
  }, [id, htmlElement])

  useEffect(() => {
    if (!children && !ghost) return
    if (!isMounted || !cytoscapeNode?.length || !cytoscapeNode.inside() || (children && !htmlElement)) return

    if (htmlElement) {
      const p = cytoscapeNode.position()
      if (p && onPositionRef.current) onPositionRef.current(p)
    }

    const handlePosition = (e: any) => {
      onPositionRef.current?.(e.target.position())
    }
    cytoscapeNode.on('position', handlePosition)

    let animId: number | null = null
    let observer: ResizeObserver | null = null

    if (htmlElement) {
      observer = new ResizeObserver(entries => {
        if (animId) cancelAnimationFrame(animId)
        animId = requestAnimationFrame(() => {
          for (const entry of entries) {
            if (entry.target === htmlElement && cytoscapeNode?.length && cytoscapeNode.inside()) {
              const { width, height } = entry.contentRect
              const parse = (v: any): number => typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0
              const cw = parse(cytoscapeNode.style('width'))
              const ch = parse(cytoscapeNode.style('height'))
              if (width > 0 && height > 0 && (Math.abs(cw - width) > 0.5 || Math.abs(ch - height) > 0.5)) {
                cytoscapeNode.style({ width, height })
                relayout?.()
              }
            }
          }
        })
      })
      observer.observe(htmlElement)

      const iw = htmlElement.offsetWidth, ih = htmlElement.offsetHeight
      if (iw > 0 && ih > 0 && cytoscapeNode?.length && cytoscapeNode.inside()) {
        const parse = (v: any): number => typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : 0
        const cw = parse(cytoscapeNode.style('width'))
        const ch = parse(cytoscapeNode.style('height'))
        if (Math.abs(cw - iw) > 0.5 || Math.abs(ch - ih) > 0.5) {
          cytoscapeNode.style({ width: iw, height: ih })
          relayout?.()
        }
      }
    }

    return () => {
      cytoscapeNode?.off?.('position', handlePosition)
      if (htmlElement && observer) observer.unobserve(htmlElement)
      if (animId) cancelAnimationFrame(animId)
      observer?.disconnect()
    }
  }, [id, relayout, isMounted, cytoscapeNode, htmlElement, children, ghost])

  return (
    <CytoElementsContext.Provider value={cytoscapeNode}>
      {!!children && <CytoReactNode id={id} children={children} boxRefCallback={boxRefCallback} />}
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

  // Ghost nodes for source/target
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
