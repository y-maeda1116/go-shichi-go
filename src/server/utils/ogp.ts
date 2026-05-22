export function generateOgSvg(input: {
  line1: string
  line2: string
  line3: string
  line4?: string | null
  line5?: string | null
  author: string
  type: 'haiku' | 'tanka'
}): string {
  const lines = [input.line1, input.line2, input.line3]
  if (input.line4) lines.push(input.line4)
  if (input.line5) lines.push(input.line5)

  const lineElements = lines
    .map((line, i) => {
      const x = 900 - i * 120
      return `<text x="${x}" y="160" font-family="serif" font-size="48" fill="#1a1a1a" writing-mode="tb" letter-spacing="8">${escapeXml(line)}</text>`
    })
    .join('\n')

  const typeLabel = input.type === 'haiku' ? '俳句' : '短歌'

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#faf8f5"/>
  <rect x="40" y="40" width="1120" height="550" rx="8" fill="#ffffff" stroke="#d4cdc4" stroke-width="1"/>
  <text x="100" y="100" font-family="serif" font-size="20" fill="#8b4513">${typeLabel}</text>
  ${lineElements}
  <text x="100" y="540" font-family="serif" font-size="18" fill="#666666">${escapeXml(input.author)}</text>
  <text x="1000" y="540" font-family="serif" font-size="18" fill="#8b4513">五七五</text>
</svg>`
}

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
