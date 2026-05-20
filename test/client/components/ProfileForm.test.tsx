import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { ProfileForm } from '@/client/components/ProfileForm'

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  describe('edit mode', () => {
    it('renders edit title', () => {
      const { container } = render(<ProfileForm mode="edit" initialData={{ displayName: 'テスト', bio: '', iconUrl: '' }} />)
      expect(container.textContent).toContain('プロフィール編集')
    })

    it('displays initial displayName', () => {
      const { container } = render(<ProfileForm mode="edit" initialData={{ displayName: '初期名', bio: '', iconUrl: '' }} />)
      expect(container.querySelector('input')?.value).toBe('初期名')
    })

    it('sends PUT request with credentials on save', async () => {
      const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
      globalThis.fetch = fetchSpy

      const { container } = render(<ProfileForm mode="edit" initialData={{ displayName: 'テスト', bio: '', iconUrl: '' }} />)

      const input = container.querySelector('input')!
      fireEvent.change(input, { target: { value: '新しい名前' } })

      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/users/me', expect.objectContaining({
          method: 'PUT',
          credentials: 'same-origin',
        }))
      })
    })

    it('redirects to home on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })

      const { container } = render(<ProfileForm mode="edit" initialData={{ displayName: 'テスト', bio: '', iconUrl: '' }} />)
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(window.location.href).toBe('/')
      })
    })

    it('shows error on failed save', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'エラー' }),
      })

      const { container } = render(<ProfileForm mode="edit" initialData={{ displayName: 'テスト', bio: '', iconUrl: '' }} />)
      const form = container.querySelector('form')!
      fireEvent.submit(form)

      await waitFor(() => {
        expect(container.textContent).toContain('エラー')
      })
    })
  })

  describe('register mode', () => {
    it('renders register title', () => {
      const { container } = render(<ProfileForm mode="register" />)
      expect(container.textContent).toContain('プロフィール登録')
    })
  })
})
