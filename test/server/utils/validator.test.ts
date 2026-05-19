import { describe, it, expect } from 'vitest'
import { validatePost } from '@/server/utils/validator'

describe('validatePost', () => {
  it('accepts valid haiku (3 lines)', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('haiku')
  })

  it('accepts valid tanka (5 lines)', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
      line5: 'いわにしみいる',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('tanka')
  })

  it('rejects empty line1', () => {
    const result = validatePost({
      line1: '',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上を入力してください')
  })

  it('rejects empty line2', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: '',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('中を入力してください')
  })

  it('rejects empty line3', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: '',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下を入力してください')
  })

  it('rejects partial tanka (only line4)', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の下も入力してください')
  })

  it('rejects partial tanka (only line5)', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line5: 'いわにしみいる',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の上も入力してください')
  })

  it('rejects empty line4 in tanka', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: '',
      line5: 'いわにしみいる',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の上も入力してください')
  })

  it('rejects empty line5 in tanka', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
      line5: '',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の下も入力してください')
  })
})
