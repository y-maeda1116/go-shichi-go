import { useQuery } from '@tanstack/react-query'
import type { AuthUser } from '@/types'

declare global {
  interface Window {
    __INITIAL_USER__?: AuthUser | null
  }
}

export function useAuth() {
  const initialUser = typeof window !== 'undefined'
    ? window.__INITIAL_USER__
    : undefined

  return useQuery({
    queryKey: ['auth'],
    queryFn: () => Promise.resolve(initialUser ?? null),
    initialData: initialUser,
    staleTime: Infinity,
    enabled: false,
  })
}

export function useCurrentUser() {
  const { data } = useAuth()
  return data ?? null
}
