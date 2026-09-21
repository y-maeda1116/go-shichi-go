import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReplyForm } from '@/client/components/ReplyForm'

describe('ReplyForm', () => {
  beforeEach(() => {
    cleanup()
  })

  it('renders button when closed', () => {
    const onSubmitted = vi.fn()
    render(<ReplyForm postId="p1" onSubmitted={onSubmitted} />)
    expect(screen.getByText('返句する')).toBeTruthy()
  })

  it('opens form on button click', async () => {
    const onSubmitted = vi.fn()
    render(<ReplyForm postId="p1" onSubmitted={onSubmitted} />)

    const user = userEvent.setup()
    await user.click(screen.getByText('返句する'))

    expect(screen.getByPlaceholderText('上の句（五）')).toBeTruthy()
    expect(screen.getByPlaceholderText('中の句（七）')).toBeTruthy()
    expect(screen.getByPlaceholderText('下の句（五）')).toBeTruthy()
    expect(screen.getByText('返句')).toBeTruthy()
    expect(screen.getByText('やめる')).toBeTruthy()
  })

  it('closes form on cancel click', async () => {
    const onSubmitted = vi.fn()
    render(<ReplyForm postId="p1" onSubmitted={onSubmitted} />)

    const user = userEvent.setup()
    await user.click(screen.getByText('返句する'))
    await user.click(screen.getByText('やめる'))

    expect(screen.getByText('返句する')).toBeTruthy()
  })

  it('submits reply with valid input', async () => {
    const onSubmitted = vi.fn()
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: true })
    render(<ReplyForm postId="p1" onSubmitted={onSubmitted} />)

    const user = userEvent.setup()
    await user.click(screen.getByText('返句する'))

    await user.type(screen.getByPlaceholderText('上の句（五）'), '古池や')
    await user.type(screen.getByPlaceholderText('中の句（七）'), '蛙飛び込む')
    await user.type(screen.getByPlaceholderText('下の句（五）'), '水の音')
    await user.click(screen.getByText('返句'))

    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/api/replies/p1/replies',
      expect.objectContaining({ method: 'POST' }),
    )
  })

  it('shows character count', async () => {
    const onSubmitted = vi.fn()
    render(<ReplyForm postId="p1" onSubmitted={onSubmitted} />)

    const user = userEvent.setup()
    await user.click(screen.getByText('返句する'))

    const input = screen.getByPlaceholderText('上の句（五）')
    await user.type(input, 'abc')

    const counts = screen.getAllByText('3')
    expect(counts.length).toBeGreaterThanOrEqual(1)
  })
})
