export interface MermaidBlock {
  type: 'text' | 'mermaid'
  content: string
}

export function encodeMermaidDiagram(code: string): string {
  const encoder = new TextEncoder()
  const bytes = encoder.encode(code)
  let binary = ''
  bytes.forEach((byte) => (binary += String.fromCharCode(byte)))
  const base64 = btoa(binary)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function getMermaidImageUrl(
  code: string,
  theme?: 'default' | 'dark',
): string {
  const encoded = encodeMermaidDiagram(code)
  const baseUrl = `https://mermaid.ink/img/${encoded}`
  if (theme === 'dark') {
    return `${baseUrl}?theme=dark`
  }
  return baseUrl
}

export function parseMermaidBlocks(text: string): MermaidBlock[] {
  if (typeof text !== 'string') {
    return [{ type: 'text', content: '' }]
  }

  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const mermaidPattern = /```mermaid\n([\s\S]*?)\n```/g
  const blocks: MermaidBlock[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = mermaidPattern.exec(normalizedText)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({
        type: 'text',
        content: normalizedText.slice(lastIndex, match.index),
      })
    }
    blocks.push({ type: 'mermaid', content: match[1] })
    lastIndex = match.index + match[0].length
  }

  if (blocks.length === 0) {
    blocks.push({ type: 'text', content: normalizedText })
  } else {
    blocks.push({ type: 'text', content: normalizedText.slice(lastIndex) })
  }

  return blocks
}
