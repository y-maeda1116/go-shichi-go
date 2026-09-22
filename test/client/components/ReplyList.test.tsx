import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ReplyList } from '@/client/components/ReplyList'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ReplyList', () => {
  it('renders replies when data is available', async () => {
    const mockReplies = {
      success: true,
      data: [
        {
          id: 'r1',
          postId: 'p1',
          userId: 'u2',
          line1: '閑さや',
          line2: '岩にしみ入る',
          line3: '蝉の声',
          createdAt: new Date().toISOString(),
          author: { id: 'u2', displayName: '蕪村', iconUrl: null },
        },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockReplies),
    })

    const wrapper = createWrapper()
    const { container } = render(<ReplyList postId="p1" />, { wrapper })

    // Wait for data to load
    await vi.waitFor(() => {
      expect(container.textContent).toContain('閑さや')
    })
    expect(container.textContent).toContain('蕪村')
    expect(container.textContent).toContain('返句')
  })

  it('returns null when no replies', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    const { container } = render(<ReplyList postId="p1" />, { wrapper })

    await vi.waitFor(() => {
      expect(container.querySelector('.reply-list')).toBeNull()
    })
  })
})
