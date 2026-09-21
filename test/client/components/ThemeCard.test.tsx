import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { ThemeCard } from '@/client/components/ThemeCard'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('ThemeCard', () => {
  it('renders theme when data is available', async () => {
    const mockTheme = {
      success: true,
      data: { date: '2026-06-01', themeText: '梅雨入り', description: '雨の季節の始まり' },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTheme),
    })

    const wrapper = createWrapper()
    const { container } = render(<ThemeCard />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('梅雨入り')
    })
    expect(container.textContent).toContain('今日のお題')
    expect(container.textContent).toContain('雨の季節の始まり')
  })

  it('returns null when no theme data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    })

    const wrapper = createWrapper()
    const { container } = render(<ThemeCard />, { wrapper })

    await vi.waitFor(() => {
      expect(container.querySelector('.theme-card')).toBeNull()
    })
  })
})
