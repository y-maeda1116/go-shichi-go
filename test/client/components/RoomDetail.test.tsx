import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { RoomDetail } from '@/client/components/RoomDetail'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('RoomDetail', () => {
  it('renders room with lines', async () => {
    const mockRoom = {
      success: true,
      data: {
        id: 'r1',
        status: 'active',
        lines: [
          { id: 'l1', lineNumber: 1, line: '古池や', author: { displayName: '芭蕉' } },
          { id: 'l2', lineNumber: 2, line: '蛙飛び込む', author: { displayName: '蕪村' } },
        ],
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    })

    const wrapper = createWrapper()
    const { container } = render(<RoomDetail roomId="r1" />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('古池や')
      expect(container.textContent).toContain('蛙飛び込む')
      expect(container.textContent).toContain('進行中')
    })
    cleanup()
  })

  it('shows add line form for active room with 1 line', async () => {
    const mockRoom = {
      success: true,
      data: {
        id: 'r1',
        status: 'active',
        lines: [
          { id: 'l1', lineNumber: 1, line: '古池や', author: { displayName: '芭蕉' } },
        ],
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    })

    const wrapper = createWrapper()
    render(<RoomDetail roomId="r1" />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText('追加')).toBeTruthy()
    })
    // 1 line → next line is 2
    expect(screen.getByText(/2行目/)).toBeTruthy()
    cleanup()
  })

  it('shows closed status for ended room', async () => {
    const mockRoom = {
      success: true,
      data: {
        id: 'r1',
        status: 'closed',
        lines: [
          { id: 'l1', lineNumber: 1, line: '古池や', author: { displayName: '芭蕉' } },
        ],
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockRoom),
    })

    const wrapper = createWrapper()
    const { container } = render(<RoomDetail roomId="r1" />, { wrapper })

    await vi.waitFor(() => {
      expect(container.textContent).toContain('終了')
    })
    cleanup()
  })

  it('submits a new line', async () => {
    const mockRoom = {
      success: true,
      data: {
        id: 'r1',
        status: 'active',
        lines: [
          { id: 'l1', lineNumber: 1, line: '古池や', author: { displayName: '芭蕉' } },
        ],
      },
    }

    globalThis.fetch = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
      if (opts?.method === 'POST') {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) })
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockRoom),
      })
    })

    const wrapper = createWrapper()
    render(<RoomDetail roomId="r1" />, { wrapper })

    await vi.waitFor(() => {
      expect(screen.getByText('追加')).toBeTruthy()
    })

    const user = userEvent.setup()
    const input = screen.getByPlaceholderText(/文字/)
    await user.type(input, '蛙飛び込む')
    await user.click(screen.getByText('追加'))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/rooms/r1/lines',
      expect.objectContaining({ method: 'POST' }),
    )
    cleanup()
  })
})
