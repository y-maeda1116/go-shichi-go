import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { Timeline } from '@/client/components/Timeline'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Timeline', () => {
  it('renders season filter buttons', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { data: [], nextCursor: null } }),
    })

    const wrapper = createWrapper()
    render(<Timeline />, { wrapper })

    expect(screen.getByText('すべて')).toBeTruthy()
    expect(screen.getByText('春')).toBeTruthy()
    expect(screen.getByText('夏')).toBeTruthy()
    expect(screen.getByText('秋')).toBeTruthy()
    expect(screen.getByText('冬')).toBeTruthy()
    expect(screen.getByText('新年')).toBeTruthy()
    cleanup()
  })

  it('renders posts when data is available', async () => {
    const mockPosts = {
      success: true,
      data: {
        data: [{
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
          createdAt: new Date(),
          author: { id: 'u1', displayName: '芭蕉', iconUrl: null },
          likeCount: 5,
          likedByMe: false,
          reactions: {},
          myReaction: null,
        }],
        nextCursor: null,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    })

    const wrapper = createWrapper()
    const { container } = render(<Timeline />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('古池や')
    })
    cleanup()
  })

  it('changes active season on button click', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { data: [], nextCursor: null } }),
    })

    const wrapper = createWrapper()
    render(<Timeline />, { wrapper })

    const user = userEvent.setup()
    await user.click(screen.getByText('春'))

    const springBtn = screen.getByText('春')
    expect(springBtn.classList.contains('active')).toBe(true)
    cleanup()
  })
})
