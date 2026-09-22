import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton, PostCardSkeleton, TimelineSkeleton } from '@/client/components/Skeleton'

describe('Skeleton', () => {
  it('renders with default width and height', () => {
    const { container } = render(<Skeleton />)
    const el = container.querySelector('.skeleton') as HTMLElement
    expect(el).toBeTruthy()
    expect(el.style.width).toBe('100%')
    expect(el.style.height).toBe('20px')
  })

  it('renders with custom width and height', () => {
    const { container } = render(<Skeleton width="200px" height="40px" />)
    const el = container.querySelector('.skeleton') as HTMLElement
    expect(el.style.width).toBe('200px')
    expect(el.style.height).toBe('40px')
  })
})

describe('PostCardSkeleton', () => {
  it('renders skeleton card structure', () => {
    const { container } = render(<PostCardSkeleton />)
    expect(container.querySelector('.skeleton-card')).toBeTruthy()
    expect(container.querySelector('.skeleton-lines')).toBeTruthy()
  })
})

describe('TimelineSkeleton', () => {
  it('renders 4 skeleton cards', () => {
    const { container } = render(<TimelineSkeleton />)
    const cards = container.querySelectorAll('.skeleton-card')
    expect(cards).toHaveLength(4)
  })
})
