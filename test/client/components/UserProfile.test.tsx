import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { UserProfile } from '@/client/components/UserProfile'

const queryClient = new QueryClient()

function wrap(component: React.ReactElement) {
  return <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
}

const baseUser = {
  id: 'u1',
  displayName: 'テストユーザー',
  bio: '自己紹介文',
  iconUrl: null,
}

describe('UserProfile', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('renders displayName', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={true} />))
    expect(container.textContent).toContain('テストユーザー')
  })

  it('renders bio when present', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={true} />))
    expect(container.querySelector('.profile-bio')?.textContent).toBe('自己紹介文')
  })

  it('shows edit link for own profile', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={true} />))
    const editLink = container.querySelector('.btn-edit')
    expect(editLink).toBeDefined()
    expect(editLink?.getAttribute('href')).toBe('/profile/edit')
  })

  it('shows follow button for other profiles', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={false} />))
    const followBtn = container.querySelector('.btn-follow')
    expect(followBtn).toBeDefined()
    expect(followBtn?.textContent).toContain('フォロー')
  })

  it('shows following state when initialFollowing is true', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={false} initialFollowing={true} />))
    const followBtn = container.querySelector('.btn-follow')
    expect(followBtn?.textContent).toContain('フォロー中')
  })

  it('toggles follow state on click', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchSpy

    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={false} />))
    const followBtn = container.querySelector('.btn-follow')!
    fireEvent.click(followBtn)

    expect(fetchSpy).toHaveBeenCalledWith('/api/follow/u1', expect.objectContaining({ method: 'POST' }))
    await waitFor(() => {
      expect(container.querySelector('.btn-follow')?.textContent).toContain('フォロー中')
    })
  })

  it('unfollows on click when following', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true })
    globalThis.fetch = fetchSpy

    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={false} initialFollowing={true} followerCount={5} />))
    const followBtn = container.querySelector('.btn-follow')!
    fireEvent.click(followBtn)

    expect(fetchSpy).toHaveBeenCalledWith('/api/follow/u1', expect.objectContaining({ method: 'DELETE' }))
    await waitFor(() => {
      expect(container.querySelector('.btn-follow')?.textContent).toContain('フォロー')
    })
  })

  it('displays follower count', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={true} followerCount={10} />))
    expect(container.textContent).toContain('10')
    expect(container.textContent).toContain('フォロワー')
  })

  it('displays following count', () => {
    const { container } = render(wrap(<UserProfile user={baseUser} isOwn={true} followingCount={3} />))
    expect(container.textContent).toContain('3')
    expect(container.textContent).toContain('フォロー中')
  })
})
