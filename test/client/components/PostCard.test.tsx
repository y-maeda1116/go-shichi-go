import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PostCard } from '@/client/components/PostCard'
import type { PostWithAuthor } from '@/types'

const mockHaiku: PostWithAuthor = {
  id: '1',
  userId: 'u1',
  type: 'haiku',
  line1: '古池や',
  line2: '蛙飛び込む',
  line3: '水の音',
  line4: null,
  line5: null,
  authorNote: null,
  imageUrl: null,
  seasonWord: null,
  createdAt: new Date('2026-01-01'),
  author: { id: 'u1', displayName: '芭蕉', iconUrl: null },
  likeCount: 5,
  likedByMe: false,
  reactions: { heart: 5 },
  myReaction: null,
}

describe('PostCard', () => {
  it('renders haiku lines vertically', () => {
    const { container } = render(<PostCard post={mockHaiku} onReact={() => {}} />)
    expect(container.textContent).toContain('古池や')
    expect(container.textContent).toContain('蛙飛び込む')
    expect(container.textContent).toContain('水の音')
  })

  it('renders author name', () => {
    const { container } = render(<PostCard post={mockHaiku} onReact={() => {}} />)
    expect(container.textContent).toContain('芭蕉')
  })

  it('renders like count', () => {
    const { container } = render(<PostCard post={mockHaiku} onReact={() => {}} />)
    expect(container.textContent).toContain('5')
  })

  it('renders tanka with 5 lines', () => {
    const tanka: PostWithAuthor = {
      ...mockHaiku,
      type: 'tanka',
      line4: '静けさや',
      line5: '岩にしみ入る',
    }
    const { container } = render(<PostCard post={tanka} onReact={() => {}} />)
    expect(container.textContent).toContain('静けさや')
    expect(container.textContent).toContain('岩にしみ入る')
  })
})
