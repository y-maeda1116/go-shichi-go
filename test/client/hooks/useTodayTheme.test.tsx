import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useTodayTheme } from '@/client/hooks/useTodayTheme'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTodayTheme', () => {
  it('fetches today theme', async () => {
    const mockTheme = {
      success: true,
      data: { date: '2026-06-01', themeText: '梅雨入り', description: '雨の季節' },
    }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTheme),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useTodayTheme(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.themeText).toBe('梅雨入り')
    expect(result.current.data?.description).toBe('雨の季節')
  })

  it('handles null theme data', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: null }),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useTodayTheme(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toBeNull()
  })

  it('handles fetch error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useTodayTheme(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
