import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { RoomList } from '@/client/components/RoomList'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('RoomList', () => {
  it('renders title and create button', () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    render(<RoomList />, { wrapper })

    expect(screen.getByText('連句の座')).toBeTruthy()
    expect(screen.getByText('新しい座を立てる')).toBeTruthy()
    cleanup()
  })

  it('renders rooms list', async () => {
    const mockRooms = {
      success: true,
      data: [
        { id: 'r1', status: 'active', creator: { displayName: '芭蕉' }, lineCount: 3 },
      ],
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRooms),
    })

    const wrapper = createWrapper()
    const { container } = render(<RoomList />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('芭蕉')
      expect(container.textContent).toContain('3/5 行')
      expect(container.textContent).toContain('進行中')
    })
    cleanup()
  })

  it('shows empty message when no rooms', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] }),
    })

    const wrapper = createWrapper()
    render(<RoomList />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText('アクティブな座はありません')).toBeTruthy()
    })
    cleanup()
  })

  it('calls create room API on button click', async () => {
    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true, data: { id: 'new' } }) })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] }),
      })
    })

    const wrapper = createWrapper()
    render(<RoomList />, { wrapper })

    const user = userEvent.setup()
    await user.click(screen.getByText('新しい座を立てる'))

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/rooms', { method: 'POST' })
    cleanup()
  })
})
