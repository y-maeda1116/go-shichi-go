import { describe, it, expect } from 'vitest'
import { generateOgSvg } from '@/server/utils/ogp'

describe('generateOgSvg', () => {
  it('generates SVG for haiku (3 lines)', () => {
    const svg = generateOgSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: '芭蕉',
      type: 'haiku',
    })
    expect(svg).toContain('<?xml version="1.0"')
    expect(svg).toContain('<svg')
    expect(svg).toContain('古池や')
    expect(svg).toContain('蛙飛び込む')
    expect(svg).toContain('水の音')
    expect(svg).toContain('芭蕉')
    expect(svg).toContain('俳句')
  })

  it('generates SVG for tanka (5 lines)', () => {
    const svg = generateOgSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
      author: '芭蕉',
      type: 'tanka',
    })
    expect(svg).toContain('静けさや')
    expect(svg).toContain('岩にしみ入る')
    expect(svg).toContain('短歌')
  })

  it('escapes XML special characters', () => {
    const svg = generateOgSvg({
      line1: 'A<B&C"D\'E',
      line2: '蛙飛び込む',
      line3: '水の音',
      author: 'test<>&"user',
      type: 'haiku',
    })
    expect(svg).toContain('A&lt;B&amp;C&quot;D&apos;E')
    expect(svg).toContain('test&lt;&gt;&amp;&quot;user')
  })

  it('does not include line4/line5 when null', () => {
    const svg = generateOgSvg({
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: null,
      line5: null,
      author: '芭蕉',
      type: 'haiku',
    })
    expect(svg).toContain('古池や')
    expect(svg).toContain('俳句')
  })
})
