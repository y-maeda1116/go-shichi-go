import { describe, it, expect } from 'vitest'
import { generateShareSvg } from '@/server/utils/share-image'

describe('generateShareSvg', () => {
  it('generates washi-style SVG', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: '芭蕉',
      type: 'haiku',
      style: 'washi',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('古池や')
    expect(svg).toContain('芭蕉')
    expect(svg).toContain('#faf8f5')
  })

  it('generates modern-style SVG', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: '芭蕉',
      type: 'haiku',
      style: 'modern',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('#1a1a2e')
    expect(svg).toContain('#e8e0d8')
  })

  it('includes tanka lines when present', () => {
    const svg = generateShareSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
      author: '芭蕉',
      type: 'tanka',
      style: 'washi',
    })
    expect(svg).toContain('静けさや')
    expect(svg).toContain('岩にしみ入る')
  })

  it('escapes special XML characters', () => {
    const svg = generateShareSvg({
      line1: 'a<b&c>',
      line2: 'test',
      line3: 'line',
      author: 'author',
      type: 'haiku',
      style: 'washi',
    })
    expect(svg).toContain('a&lt;b&amp;c&gt;')
    expect(svg).not.toContain('a<b&c>')
  })
})
