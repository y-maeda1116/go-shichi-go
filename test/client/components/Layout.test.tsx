import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layout } from '@/client/components/Layout'
import type { AuthUser } from '@/types'

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

describe('Layout', () => {
  beforeEach(() => {
    localStorageMock.clear()
    document.documentElement.classList.remove('dark')
    cleanup()
  })

  it('renders children', () => {
    const { container } = render(
      <Layout>
        <p>テストコンテンツ</p>
      </Layout>,
    )
    expect(container.textContent).toContain('テストコンテンツ')
  })

  it('renders logo link', () => {
    render(
      <Layout>
        <p>test</p>
      </Layout>,
    )
    const logo = screen.getByText('五七五')
    expect(logo.getAttribute('href')).toBe('/')
  })

  it('shows guest when no user', () => {
    render(
      <Layout>
        <p>test</p>
      </Layout>,
    )
    expect(screen.getByText('ゲスト')).toBeTruthy()
  })

  it('shows user display name when logged in', () => {
    const user: AuthUser = {
      id: 'u1',
      accessEmail: 'test@example.com',
      displayName: '芭蕉',
      bio: null,
      iconUrl: null,
    }
    render(
      <Layout user={user}>
        <p>test</p>
      </Layout>,
    )
    expect(screen.getByText('芭蕉')).toBeTruthy()
  })

  it('toggles dark mode', async () => {
    render(
      <Layout>
        <p>test</p>
      </Layout>,
    )

    const toggleBtn = screen.getByRole('button', { name: /☾|☀/ })
    const user = userEvent.setup()
    await user.click(toggleBtn)

    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorageMock.getItem('theme')).toBe('dark')
  })

  it('loads dark mode from localStorage', () => {
    localStorageMock.setItem('theme', 'dark')

    render(
      <Layout>
        <p>test</p>
      </Layout>,
    )

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('shows notification bell for logged-in user', () => {
    const user: AuthUser = {
      id: 'u1',
      accessEmail: 'test@example.com',
      displayName: '芭蕉',
      bio: null,
      iconUrl: null,
    }
    render(
      <Layout user={user}>
        <p>test</p>
      </Layout>,
    )
    expect(screen.getByText('🔔')).toBeTruthy()
  })
})
