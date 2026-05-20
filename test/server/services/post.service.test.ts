import { describe, it, expect } from 'vitest'
import { createPostWithValidation, deletePostWithAuth } from '@/server/services/post.service'
import type { Post } from '@/types'

const mockPost: Post = {
  id: 'p1',
  userId: 'u1',
  type: 'haiku',
  line1: '古池や',
  line2: '蛙飛び込む',
  line3: '水の音',
  line4: null,
  line5: null,
  authorNote: null,
  imageUrl: null,
  seasonWord: null,
  createdAt: new Date(),
}

function createMockQueries(overrides?: {
  createPost?: () => Promise<Post>
  deletePost?: () => Promise<boolean>
}) {
  return {
    createPost: overrides?.createPost ?? (() => Promise.resolve(mockPost)),
    deletePost: overrides?.deletePost ?? (() => Promise.resolve(true)),
  }
}

describe('createPostWithValidation', () => {
  it('creates a haiku with valid input', async () => {
    const queries = createMockQueries()
    const result = await createPostWithValidation(queries, {
      userId: 'u1',
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('creates a tanka with valid input', async () => {
    const queries = createMockQueries()
    const result = await createPostWithValidation(queries, {
      userId: 'u1',
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
      line5: '岩にしみ入る',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid input (empty line1)', async () => {
    const queries = createMockQueries()
    const result = await createPostWithValidation(queries, {
      userId: 'u1',
      line1: '',
      line2: '蛙飛び込む',
      line3: '水の音',
    })
    expect(result.success).toBe(false)
    expect(result.error).toContain('上を入力してください')
  })

  it('rejects partial tanka (line4 without line5)', async () => {
    const queries = createMockQueries()
    const result = await createPostWithValidation(queries, {
      userId: 'u1',
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      line4: '静けさや',
    })
    expect(result.success).toBe(false)
  })

  it('converts empty optional fields to undefined', async () => {
    let createdData: Record<string, unknown> | null = null
    const queries = createMockQueries({
      createPost: (data) => {
        createdData = data as Record<string, unknown>
        return Promise.resolve(mockPost)
      },
    })
    await createPostWithValidation(queries, {
      userId: 'u1',
      line1: '古池や',
      line2: '蛙飛び込む',
      line3: '水の音',
      authorNote: '',
      imageUrl: '',
      seasonWord: '',
    })
    expect(createdData?.authorNote).toBeUndefined()
    expect(createdData?.imageUrl).toBeUndefined()
    expect(createdData?.seasonWord).toBeUndefined()
  })
})

describe('deletePostWithAuth', () => {
  it('deletes a post successfully', async () => {
    const queries = createMockQueries()
    const result = await deletePostWithAuth(queries, 'p1', 'u1')
    expect(result.success).toBe(true)
    expect(result.data).toBe(true)
  })

  it('returns error when post not found', async () => {
    const queries = createMockQueries({
      deletePost: () => Promise.resolve(false),
    })
    const result = await deletePostWithAuth(queries, 'p1', 'u1')
    expect(result.success).toBe(false)
    expect(result.error).toBe('投稿が見つかりません')
  })
})
