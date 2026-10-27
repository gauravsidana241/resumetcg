import type { ReactNode } from 'react'

const TS_KEYWORDS = new Set([
  'as', 'async', 'await', 'case', 'const', 'default', 'extends', 'function', 'if', 'in',
  'infer', 'interface', 'keyof', 'let', 'readonly', 'return', 'satisfies', 'switch', 'type', 'typeof',
])

// comments | strings | numbers | words
const TOKEN = /(\/\/.*$|--.*$)|('(?:[^'\\\n]|\\.)*'|`[^`\n]*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b/gm

// A tiny highlighter: good enough for short TypeScript and SQL snippets
function highlight(code: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  for (const m of code.matchAll(TOKEN)) {
    const [text, comment, string, number, word] = m
    if (m.index > last) out.push(code.slice(last, m.index))
    let cls: string | null = null
    if (comment) cls = 'tok-comment'
    else if (string) cls = 'tok-string'
    else if (number) cls = 'tok-number'
    // ALLCAPS words are SQL keywords; PascalCase words are TypeScript types
    else if (word && (TS_KEYWORDS.has(word) || (word.length > 1 && word === word.toUpperCase()))) cls = 'tok-keyword'
    else if (word && /^[A-Z][a-z]/.test(word)) cls = 'tok-type'
    out.push(cls ? <span key={m.index} className={cls}>{text}</span> : text)
    last = m.index + text.length
  }
  out.push(code.slice(last))
  return out
}

export function CodeBlock({ code }: { code: string }) {
  return <pre className="code-block">{highlight(code)}</pre>
}
