import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useAuth, useCurrentUser } from '@/client/hooks/useAuth'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAuth', () => {
  beforeEach(() => {
    window.__INITIAL_USER__ = undefined
  })

  afterEach(() => {
    window.__INITIAL_USER__ = undefined
  })

  it('returns null when no initial user', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.data).toBeUndefined()
  })

  it('returns user when __INITIAL_USER__ is set', async () => {
    const mockUser = {
      id: 'u1',
      accessEmail: 'test@example.com',
      displayName: 'テスト',
      bio: null,
      iconUrl: null,
    }
    window.__INITIAL_USER__ = mockUser

    const wrapper = createWrapper()
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.data).toEqual(mockUser)
  })
})

describe('useCurrentUser', () => {
  beforeEach(() => {
    window.__INITIAL_USER__ = undefined
  })

  afterEach(() => {
    window.__INITIAL_USER__ = undefined
  })

  it('returns null when no user', async () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useCurrentUser(), { wrapper })

    await waitFor(() => expect(result.current).toBeNull())
  })

  it('returns user data when available', async () => {
    const mockUser = {
      id: 'u1',
      accessEmail: 'test@example.com',
      displayName: 'テスト',
      bio: null,
      iconUrl: null,
    }
    window.__INITIAL_USER__ = mockUser

    const wrapper = createWrapper()
    const { result } = renderHook(() => useCurrentUser(), { wrapper })

    await waitFor(() => expect(result.current).toEqual(mockUser))
  })
})
