import { describe, it, expect } from 'vitest'
import { escapeHtml, toJsonForScript } from '@/server/utils/html'

describe('escapeHtml', () => {
  it('escapes all HTML special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;')
  })

  it('renders plain text unchanged', () => {
    expect(escapeHtml('古池や蛙飛び込む水の音')).toBe('古池や蛙飛び込む水の音')
  })

  it('neutralizes script injection in text context', () => {
    const out = escapeHtml('<script>alert(1)</script>')
    expect(out).not.toContain('<script>')
    expect(out).toBe('&lt;script&gt;alert(1)&lt;/script&gt;')
  })

  it('neutralizes attribute breakout', () => {
    const out = escapeHtml('"><img src=x onerror=alert(1)>')
    expect(out).not.toContain('">')
    expect(out).toBe('&quot;&gt;&lt;img src=x onerror=alert(1)&gt;')
  })
})

describe('toJsonForScript', () => {
  it('returns valid JSON', () => {
    expect(JSON.parse(toJsonForScript({ a: 1 }))).toEqual({ a: 1 })
  })

  it('does not allow </script> to break out of the script tag', () => {
    const payload = { displayName: '</script><script>alert(1)</script>' }
    const out = toJsonForScript(payload)
    expect(out).not.toContain('</script>')
    // デシリアライズすれば元の値に戻る
    expect(JSON.parse(out)).toEqual(payload)
  })
})
