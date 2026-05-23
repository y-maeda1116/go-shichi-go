import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PostDetail } from '@/client/components/PostDetail'
import type { PostWithAuthor } from '@/types'

const queryClient = new QueryClient()

function wrap(component: React.ReactElement) {
  return <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
}

const mockHaiku: PostWithAuthor = {
  id: 'p1',
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

describe('PostDetail', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all haiku lines', () => {
    const { container } = render(wrap(<PostDetail post={mockHaiku} />))
    expect(container.textContent).toContain('古池や')
    expect(container.textContent).toContain('蛙飛び込む')
    expect(container.textContent).toContain('水の音')
  })

  it('renders tanka with 5 lines', () => {
    const tanka: PostWithAuthor = {
      ...mockHaiku,
      type: 'tanka',
      line4: '静けさや',
      line5: '岩にしみ入る',
    }
    const { container } = render(wrap(<PostDetail post={tanka} />))
    expect(container.textContent).toContain('静けさや')
    expect(container.textContent).toContain('岩にしみ入る')
  })

  it('renders season word when present', () => {
    const { container } = render(wrap(<PostDetail post={{ ...mockHaiku, seasonWord: '春' }} />))
    expect(container.textContent).toContain('春')
  })

  it('renders author note when present', () => {
    const { container } = render(wrap(<PostDetail post={{ ...mockHaiku, authorNote: 'メモ' }} />))
    expect(container.textContent).toContain('メモ')
  })

  it('calls react API on reaction button click', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchSpy
    Object.defineProperty(window, 'location', { value: { reload: vi.fn() }, writable: true })

    const { container } = render(wrap(<PostDetail post={mockHaiku} />))
    const reactionBtn = container.querySelector('.reaction-btn') as HTMLElement
    await userEvent.click(reactionBtn)

    expect(fetchSpy).toHaveBeenCalledWith('/api/posts/p1/react', expect.objectContaining({ method: 'POST' }))
  })
})
