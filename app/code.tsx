'use client'

import { useTheme } from '@vaed-ai/cyto/app/theme-provider'
import { Highlight, type PrismTheme } from 'prism-react-renderer'

// ─── Monochrome Prism themes ───

const darkTheme: PrismTheme = {
  plain: { color: '#d4d4d4', backgroundColor: '#000000' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#555' } },
    { types: ['punctuation', 'operator'], style: { color: '#888' } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'], style: { color: '#ccc' } },
    { types: ['selector', 'attr-name', 'string', 'char', 'builtin'], style: { color: '#999' } },
    { types: ['keyword', 'important'], style: { color: '#fff', fontWeight: 'bold' as const } },
    { types: ['function', 'class-name'], style: { color: '#e0e0e0' } },
    { types: ['regex', 'variable'], style: { color: '#bbb' } },
    { types: ['attr-value', 'template-string'], style: { color: '#aaa' } },
  ],
}

const lightTheme: PrismTheme = {
  plain: { color: '#1a1a1a', backgroundColor: '#ffffff' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#aaa' } },
    { types: ['punctuation', 'operator'], style: { color: '#777' } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'], style: { color: '#333' } },
    { types: ['selector', 'attr-name', 'string', 'char', 'builtin'], style: { color: '#666' } },
    { types: ['keyword', 'important'], style: { color: '#000', fontWeight: 'bold' as const } },
    { types: ['function', 'class-name'], style: { color: '#222' } },
    { types: ['regex', 'variable'], style: { color: '#444' } },
    { types: ['attr-value', 'template-string'], style: { color: '#555' } },
  ],
}

// ─── Code block ───

export function Code({ value, language = 'tsx', lineNumbers = true, style: extraStyle }: {
  value: string
  language?: string
  lineNumbers?: boolean
  style?: React.CSSProperties
}) {
  const { theme } = useTheme()
  const prismTheme = theme === 'dark' ? darkTheme : lightTheme

  return (
    <Highlight theme={prismTheme} code={value.trim()} language={language}>
      {({ style, tokens, getLineProps, getTokenProps }) => (
        <pre style={{
          ...style,
          margin: 0,
          padding: '12px 0',
          fontSize: '0.8rem',
          lineHeight: 1.6,
          overflow: 'auto',
          height: '100%',
          fontFamily: 'monospace',
          ...extraStyle,
        }}>
          {tokens.map((line, i) => (
            <div key={i} {...getLineProps({ line })} style={{ display: 'flex' }}>
              {lineNumbers && <span style={{
                width: 40,
                flexShrink: 0,
                textAlign: 'right',
                paddingRight: 12,
                color: theme === 'dark' ? '#444' : '#bbb',
                userSelect: 'none',
              }}>
                {i + 1}
              </span>}
              {!lineNumbers && <span style={{ width: 16, flexShrink: 0 }} />}
              <span>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </span>
            </div>
          ))}
        </pre>
      )}
    </Highlight>
  )
}
