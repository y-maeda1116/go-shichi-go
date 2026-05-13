import { validatePost } from '@/server/utils/validator'
import type { CreatePostInput, ApiResponse, Post } from '@/types'

interface PostQueries {
  createPost: (data: {
    userId: string
    type: 'haiku' | 'tanka'
    line1: string
    line2: string
    line3: string
    line4?: string
    line5?: string
    authorNote?: string
    imageUrl?: string
    seasonWord?: string
  }) => Promise<Post>
  deletePost: (postId: string, userId: string) => Promise<boolean>
}

export async function createPostWithValidation(
  queries: PostQueries,
  input: CreatePostInput & { userId: string },
): Promise<ApiResponse<Post>> {
  const validation = validatePost(input)

  if (!validation.valid) {
    return { success: false, error: validation.errors.join(', ') }
  }

  const post = await queries.createPost({
    userId: input.userId,
    type: validation.type,
    line1: input.line1,
    line2: input.line2,
    line3: input.line3,
    line4: input.line4 || undefined,
    line5: input.line5 || undefined,
    authorNote: input.authorNote || undefined,
    imageUrl: input.imageUrl || undefined,
    seasonWord: input.seasonWord || undefined,
  })

  return { success: true, data: post }
}

export async function deletePostWithAuth(
  queries: PostQueries,
  postId: string,
  userId: string,
): Promise<ApiResponse<boolean>> {
  const deleted = await queries.deletePost(postId, userId)

  if (!deleted) {
    return { success: false, error: '投稿が見つかりません' }
  }

  return { success: true, data: true }
}
