import { escapeXml } from './ogp'

type ShareStyle = 'washi' | 'modern'

interface ShareImageInput {
  line1: string
  line2: string
  line3: string
  line4?: string | null
  line5?: string | null
  author: string
  type: 'haiku' | 'tanka'
  style: ShareStyle
}

const STYLES = {
  washi: {
    bg: '#faf8f5',
    surface: '#ffffff',
    border: '#d4cdc4',
    text: '#1a1a1a',
    accent: '#8b4513',
    label: '#8b4513',
    author: '#666666',
  },
  modern: {
    bg: 'url(#modernGrad)',
    surface: 'transparent',
    border: 'transparent',
    text: '#e8e0d8',
    accent: '#c4956a',
    label: '#c4956a',
    author: '#999999',
  },
}

export function generateShareSvg(input: ShareImageInput): string {
  const lines = [input.line1, input.line2, input.line3]
  if (input.line4) lines.push(input.line4)
  if (input.line5) lines.push(input.line5)

  const s = STYLES[input.style]
  const typeLabel = input.type === 'haiku' ? '俳句' : '短歌'

  const lineElements = lines
    .map((line, i) => {
      const x = 900 - i * 120
      return `<text x="${x}" y="160" font-family="serif" font-size="48" fill="${s.text}" writing-mode="tb" letter-spacing="8">${escapeXml(line)}</text>`
    })
    .join('\n')

  const gradientDef = input.style === 'modern'
    ? `<defs><linearGradient id="modernGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1a1a2e"/><stop offset="100%" stop-color="#16213e"/></linearGradient></defs>`
    : ''

  const rect = input.style === 'washi'
    ? `<rect width="1200" height="630" fill="${s.bg}"/>
  <rect x="40" y="40" width="1120" height="550" rx="8" fill="${s.surface}" stroke="${s.border}" stroke-width="1"/>`
    : `<rect width="1200" height="630" fill="${s.bg}"/>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  ${gradientDef}
  ${rect}
  <text x="100" y="100" font-family="serif" font-size="20" fill="${s.label}">${typeLabel}</text>
  ${lineElements}
  <text x="100" y="540" font-family="serif" font-size="18" fill="${s.author}">${escapeXml(input.author)}</text>
  <text x="1000" y="540" font-family="serif" font-size="18" fill="${s.accent}">五七五</text>
</svg>`
}
