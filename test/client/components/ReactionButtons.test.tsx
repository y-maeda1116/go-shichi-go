import { describe, it, expect, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ReactionButtons } from '@/client/components/ReactionButtons'

describe('ReactionButtons', () => {
  it('renders all reaction types', () => {
    const onReact = vi.fn()
    render(
      <ReactionButtons
        reactions={{}}
        myReaction={null}
        onReact={onReact}
      />,
    )

    expect(screen.getByText('♡')).toBeTruthy()
    expect(screen.getByText('あはれ')).toBeTruthy()
    expect(screen.getByText('をかし')).toBeTruthy()
    expect(screen.getByText('座布団')).toBeTruthy()
    expect(screen.getByText('拍手')).toBeTruthy()
    cleanup()
  })

  it('displays reaction counts', () => {
    const onReact = vi.fn()
    render(
      <ReactionButtons
        reactions={{ heart: 5, aware: 3 }}
        myReaction={null}
        onReact={onReact}
      />,
    )

    expect(screen.getByText('♡ 5')).toBeTruthy()
    expect(screen.getByText('あはれ 3')).toBeTruthy()
    cleanup()
  })

  it('marks active reaction', () => {
    const onReact = vi.fn()
    const { container } = render(
      <ReactionButtons
        reactions={{ heart: 1 }}
        myReaction="heart"
        onReact={onReact}
      />,
    )

    const activeBtn = container.querySelector('.reaction-btn.active')
    expect(activeBtn).toBeTruthy()
    expect(activeBtn?.textContent).toContain('♡')
    cleanup()
  })

  it('calls onReact when clicked', async () => {
    const onReact = vi.fn()
    const { container } = render(
      <ReactionButtons
        reactions={{}}
        myReaction={null}
        onReact={onReact}
      />,
    )

    const user = userEvent.setup()
    const heartBtn = container.querySelector('.reaction-btn') as HTMLElement
    await user.click(heartBtn)
    expect(onReact).toHaveBeenCalledWith('heart')
    cleanup()
  })
})
