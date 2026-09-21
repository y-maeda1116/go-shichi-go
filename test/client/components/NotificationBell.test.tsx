import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationBell } from '@/client/components/NotificationBell'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

beforeAll(() => {
  vi.stubGlobal('localStorage', localStorageMock)
})

describe('NotificationBell', () => {
  beforeEach(() => {
    localStorageMock.clear()
    cleanup()
  })

  it('renders bell button', () => {
    render(<NotificationBell />)
    expect(screen.getByText('🔔')).toBeTruthy()
  })

  it('shows unread badge count', () => {
    const notifications = [
      { id: '1', type: 'like' as const, fromUserName: '芭蕉', postId: 'p1', createdAt: '2026-01-01', read: false },
      { id: '2', type: 'follow' as const, fromUserName: '蕪村', createdAt: '2026-01-02', read: false },
    ]
    localStorageMock.setItem('notifications', JSON.stringify(notifications))

    render(<NotificationBell />)
    expect(screen.getByText('2')).toBeTruthy()
  })

  it('opens dropdown on click', async () => {
    const notifications = [
      { id: '1', type: 'like' as const, fromUserName: '芭蕉', postId: 'p1', createdAt: '2026-01-01', read: false },
    ]
    localStorageMock.setItem('notifications', JSON.stringify(notifications))

    render(<NotificationBell />)
    const user = userEvent.setup()
    await user.click(screen.getByText('🔔'))

    expect(screen.getByText(/芭蕉.*いいね/)).toBeTruthy()
  })

  it('shows follow notification', async () => {
    const notifications = [
      { id: '1', type: 'follow' as const, fromUserName: '蕪村', createdAt: '2026-01-01', read: false },
    ]
    localStorageMock.setItem('notifications', JSON.stringify(notifications))

    render(<NotificationBell />)
    const user = userEvent.setup()
    await user.click(screen.getByText('🔔'))

    expect(screen.getByText(/蕪村.*フォロー/)).toBeTruthy()
  })

  it('shows empty message when no notifications', async () => {
    render(<NotificationBell />)
    const user = userEvent.setup()
    await user.click(screen.getByText('🔔'))

    expect(screen.getByText('通知はありません')).toBeTruthy()
  })

  it('marks all as read on open', async () => {
    const notifications = [
      { id: '1', type: 'like' as const, fromUserName: '芭蕉', postId: 'p1', createdAt: '2026-01-01', read: false },
    ]
    localStorageMock.setItem('notifications', JSON.stringify(notifications))

    render(<NotificationBell />)
    const user = userEvent.setup()
    await user.click(screen.getByText('🔔'))

    const stored = JSON.parse(localStorageMock.getItem('notifications') ?? '[]')
    expect(stored[0].read).toBe(true)
  })
})
