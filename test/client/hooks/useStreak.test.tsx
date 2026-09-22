import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useStreak } from '@/client/hooks/useStreak'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useStreak', () => {
  it('returns default when userId is undefined', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useStreak(undefined), { wrapper })

    // When userId is undefined, enabled is false so query never runs
    expect(result.current.fetchStatus).toBe('idle')
    expect(result.current.data).toBeUndefined()
  })

  it('fetches streak data for a user', async () => {
    const mockData = { success: true, data: { currentStreak: 5, maxStreak: 12 } }
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useStreak('user-1'), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.currentStreak).toBe(5)
    expect(result.current.data?.maxStreak).toBe(12)
  })

  it('handles fetch error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ success: false }),
    })

    const wrapper = createWrapper()
    const { result } = renderHook(() => useStreak('user-1'), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })

  it('does not fetch when userId is empty string', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useStreak(''), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
  })
})
