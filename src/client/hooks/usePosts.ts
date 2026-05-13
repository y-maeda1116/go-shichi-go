import { useInfiniteQuery } from '@tanstack/react-query'
import type { PostWithAuthor, PaginatedResponse } from '@/types'

async function fetchPosts(cursor?: string): Promise<PaginatedResponse<PostWithAuthor>> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)

  const res = await fetch('/api/posts?' + params.toString())
  if (!res.ok) throw new Error('投稿の取得に失敗しました')

  const json = await res.json() as { data: PaginatedResponse<PostWithAuthor> }
  return json.data
}

export function usePosts() {
  return useInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  })
}
