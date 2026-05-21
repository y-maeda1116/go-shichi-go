import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/client/components/Layout'
import type { AuthUser } from '@/types'
import { Timeline } from '@/client/components/Timeline'
import { ProfileForm } from '@/client/components/ProfileForm'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null }
  static getDerivedStateFromError(e: Error) {
    return { error: e.message }
  }
  render() {
    if (this.state.error) {
      return <div style={{ padding: 20, color: 'red' }}>Error: {this.state.error}</div>
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000,
      refetchOnWindowFocus: true,
    },
  },
})

const root = document.getElementById('root')
if (root) {
  const user = (window as unknown as Record<string, AuthUser | undefined>).__INITIAL_USER__
  const page = (window as unknown as Record<string, string | undefined>).__INITIAL_PAGE__

  let content: ReactNode = null
  if (page === 'timeline') {
    content = (
      <QueryClientProvider client={queryClient}>
        <Layout user={user}>
          <Timeline />
        </Layout>
      </QueryClientProvider>
    )
  } else if (page === 'register') {
    content = (
      <Layout user={user}>
        <ProfileForm mode="register" />
      </Layout>
    )
  } else if (page === 'profile-edit') {
    content = (
      <Layout user={user}>
        <ProfileForm
          mode="edit"
          initialData={{
            displayName: user?.displayName ?? '',
            bio: user?.bio ?? '',
            iconUrl: user?.iconUrl ?? '',
          }}
        />
      </Layout>
    )
  }

  if (content) {
    createRoot(root).render(<ErrorBoundary>{content}</ErrorBoundary>)
  }
}
