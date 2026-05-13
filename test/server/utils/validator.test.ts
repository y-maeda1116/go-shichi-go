import { describe, it, expect } from 'vitest'
import { validateHaiku, validateTanka, validatePost } from '@/server/utils/validator'

describe('validateHaiku', () => {
  it('accepts valid 5-7-5', () => {
    const result = validateHaiku({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects line1 not 5 chars', () => {
    const result = validateHaiku({
      line1: 'ふるい',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の上（5文字）が5文字ではありません')
  })

  it('rejects line2 not 7 chars', () => {
    const result = validateHaiku({
      line1: 'ふるいけや',
      line2: 'かわずとび',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の中（7文字）が7文字ではありません')
  })

  it('rejects line3 not 5 chars', () => {
    const result = validateHaiku({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずの',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('上句の下（5文字）が5文字ではありません')
  })

  it('rejects empty lines', () => {
    const result = validateHaiku({
      line1: '',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(false)
  })
})

describe('validateTanka', () => {
  it('accepts valid 5-7-5-7-7', () => {
    const result = validateTanka({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
      line5: 'いわにしみいる',
    })
    expect(result.valid).toBe(true)
  })

  it('rejects line4 not 7 chars', () => {
    const result = validateTanka({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさ',
      line5: 'いわにしみいる',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の上（7文字）が7文字ではありません')
  })

  it('rejects line5 not 7 chars', () => {
    const result = validateTanka({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
      line5: 'いわにしみ',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('下句の下（7文字）が7文字ではありません')
  })
})

describe('validatePost', () => {
  it('detects haiku when only 3 lines', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
    })
    expect(result.valid).toBe(true)
    expect(result.type).toBe('haiku')
  })

  it('detects tanka when 5 lines', () => {
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

  it('rejects partial tanka (only line4)', () => {
    const result = validatePost({
      line1: 'ふるいけや',
      line2: 'かわずとびこむ',
      line3: 'みずのおと',
      line4: 'しずけさのやま',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('短歌の場合は下句の下（7文字）も入力してください')
  })
})
