import { useInfiniteQuery } from '@tanstack/react-query'
import type { PostWithAuthor, PaginatedResponse } from '@/types'

async function fetchPosts(cursor?: string, season?: string): Promise<PaginatedResponse<PostWithAuthor>> {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (season) params.set('season', season)

  const res = await fetch('/api/posts?' + params.toString())
  if (!res.ok) throw new Error('投稿の取得に失敗しました')

  const json = await res.json() as { data: PaginatedResponse<PostWithAuthor> }
  return json.data
}

export function usePosts(season?: string) {
  return useInfiniteQuery({
    queryKey: ['posts', season],
    queryFn: ({ pageParam }) => fetchPosts(pageParam, season),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 60000,
    refetchOnWindowFocus: true,
  })
}
