import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ShareImageModal } from '@/client/components/ShareImageModal'

describe('ShareImageModal', () => {
  it('renders modal with title', () => {
    const onClose = vi.fn()
    render(<ShareImageModal postId="p1" onClose={onClose} />)

    expect(screen.getByText('画像でシェア')).toBeTruthy()
    cleanup()
  })

  it('renders style option labels', () => {
    const onClose = vi.fn()
    render(<ShareImageModal postId="p1" onClose={onClose} />)

    expect(screen.getByText('和紙風')).toBeTruthy()
    expect(screen.getByText('モダン')).toBeTruthy()
    cleanup()
  })

  it('closes on overlay click', async () => {
    const onClose = vi.fn()
    const { container } = render(<ShareImageModal postId="p1" onClose={onClose} />)

    const overlay = container.querySelector('.modal-overlay') as HTMLElement
    const user = userEvent.setup()
    await user.click(overlay)

    expect(onClose).toHaveBeenCalled()
    cleanup()
  })

  it('does not close on content click', async () => {
    const onClose = vi.fn()
    const { container } = render(<ShareImageModal postId="p1" onClose={onClose} />)

    const content = container.querySelector('.modal-content') as HTMLElement
    const user = userEvent.setup()
    await user.click(content)

    expect(onClose).not.toHaveBeenCalled()
    cleanup()
  })

  it('closes on button click', async () => {
    const onClose = vi.fn()
    render(<ShareImageModal postId="p1" onClose={onClose} />)

    const user = userEvent.setup()
    await user.click(screen.getByText('閉じる'))

    expect(onClose).toHaveBeenCalled()
    cleanup()
  })

  it('switches style to modern on click', async () => {
    const onClose = vi.fn()
    render(<ShareImageModal postId="p1" onClose={onClose} />)

    const user = userEvent.setup()
    const modernBtn = screen.getByText('モダン').closest('button')!
    await user.click(modernBtn)

    expect(modernBtn.classList.contains('active')).toBe(true)
    cleanup()
  })

  it('renders download and close buttons', () => {
    const onClose = vi.fn()
    render(<ShareImageModal postId="p1" onClose={onClose} />)

    expect(screen.getByText('ダウンロード')).toBeTruthy()
    expect(screen.getByText('閉じる')).toBeTruthy()
    cleanup()
  })
})
