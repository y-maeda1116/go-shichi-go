import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { Rankings } from '@/client/components/Rankings'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Rankings', () => {
  it('renders period filter buttons', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    render(<Rankings />, { wrapper })

    expect(screen.getByText('週間')).toBeTruthy()
    expect(screen.getByText('月間')).toBeTruthy()
    expect(screen.getByText('秀句ランキング')).toBeTruthy()
    cleanup()
  })

  it('renders ranked posts', async () => {
    const mockRankings = {
      success: true,
      data: [
        { id: 'p1', line1: '古池や', line2: '蛙飛び込む', line3: '水の音', likeCount: 10, author: { displayName: '芭蕉' } },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRankings),
    })

    const wrapper = createWrapper()
    const { container } = render(<Rankings />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('古池や')
      expect(container.textContent).toContain('10♡')
      expect(container.textContent).toContain('芭蕉')
    })
    cleanup()
  })

  it('shows empty message when no posts', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    render(<Rankings />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText('まだ投稿がありません')).toBeTruthy()
    })
    cleanup()
  })

  it('switches to monthly on click', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    render(<Rankings />, { wrapper })

    const user = userEvent.setup()
    await user.click(screen.getByText('月間'))

    const monthlyBtn = screen.getByText('月間')
    expect(monthlyBtn.classList.contains('active')).toBe(true)
    cleanup()
  })
})
