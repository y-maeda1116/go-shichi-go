import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { StreakBadge } from '@/client/components/StreakBadge'

describe('StreakBadge', () => {
  it('shows current streak when > 0', () => {
    const { container } = render(<StreakBadge currentStreak={5} maxStreak={5} />)
    expect(container.textContent).toContain('5日連続')
  })

  it('hides current streak when 0', () => {
    const { container } = render(<StreakBadge currentStreak={0} maxStreak={0} />)
    expect(container.textContent).not.toContain('日連続')
  })

  it('shows 名人 badge for maxStreak >= 100', () => {
    const { container } = render(<StreakBadge currentStreak={0} maxStreak={100} />)
    expect(container.textContent).toContain('名人')
  })

  it('shows 皆伝 badge for maxStreak >= 30', () => {
    const { container } = render(<StreakBadge currentStreak={0} maxStreak={30} />)
    expect(container.textContent).toContain('皆伝')
  })

  it('shows 初心者 badge for maxStreak >= 7', () => {
    const { container } = render(<StreakBadge currentStreak={0} maxStreak={7} />)
    expect(container.textContent).toContain('初心者')
  })

  it('shows no badge for maxStreak < 7', () => {
    const { container } = render(<StreakBadge currentStreak={3} maxStreak={6} />)
    expect(container.textContent).toContain('3日連続')
    expect(container.textContent).not.toContain('名人')
    expect(container.textContent).not.toContain('皆伝')
    expect(container.textContent).not.toContain('初心者')
  })

  it('shows streak title with maxStreak info', () => {
    const { container } = render(<StreakBadge currentStreak={0} maxStreak={100} />)
    const rankEl = container.querySelector('.streak-rank')
    expect(rankEl?.getAttribute('title')).toContain('最高100日連続')
  })
})
