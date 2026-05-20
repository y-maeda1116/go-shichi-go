import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import { PostForm } from '@/client/components/PostForm'

describe('PostForm', () => {
  it('shows toggle button initially', () => {
    const { container } = render(<PostForm onSubmit={vi.fn()} />)
    expect(container.querySelector('.post-form-toggle')?.textContent).toContain('投稿する')
  })

  it('expands form on toggle click', async () => {
    const { container } = render(<PostForm onSubmit={vi.fn()} />)
    const toggle = container.querySelector('.post-form-toggle')!
    fireEvent.click(toggle)
    expect(toggle.textContent).toContain('閉じる')
    expect(container.querySelector('.post-type-badge')?.textContent).toContain('俳句')
  })

  it('disables submit when required fields are empty', () => {
    const { container } = render(<PostForm onSubmit={vi.fn()} />)
    const toggle = container.querySelector('.post-form-toggle')!
    fireEvent.click(toggle)
    const submitBtn = container.querySelector('.btn-primary') as HTMLButtonElement
    expect(submitBtn.disabled).toBe(true)
  })

  it('calls onSubmit with valid haiku data', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<PostForm onSubmit={onSubmit} />)
    const toggle = container.querySelector('.post-form-toggle')!
    fireEvent.click(toggle)

    const inputs = container.querySelectorAll('.post-line-input input')
    fireEvent.change(inputs[0], { target: { value: '古池や' } })
    fireEvent.change(inputs[1], { target: { value: '蛙飛び込む' } })
    fireEvent.change(inputs[2], { target: { value: '水の音' } })

    const submitBtn = container.querySelector('.btn-primary')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        line1: '古池や',
        line2: '蛙飛び込む',
        line3: '水の音',
      })
    })
  })

  it('resets and collapses form after successful submit', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const { container } = render(<PostForm onSubmit={onSubmit} />)
    const toggle = container.querySelector('.post-form-toggle')!
    fireEvent.click(toggle)

    const inputs = container.querySelectorAll('.post-line-input input')
    fireEvent.change(inputs[0], { target: { value: '古池や' } })
    fireEvent.change(inputs[1], { target: { value: '蛙飛び込む' } })
    fireEvent.change(inputs[2], { target: { value: '水の音' } })

    const submitBtn = container.querySelector('.btn-primary')!
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(container.querySelector('.post-form-toggle')?.textContent).toContain('投稿する')
    })
  })
})
