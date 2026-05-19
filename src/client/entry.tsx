import { Component, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/client/components/Layout'
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
  const user = (window as unknown as Record<string, unknown>).__INITIAL_USER__ || null
  const page = (window as unknown as Record<string, unknown>).__INITIAL_PAGE__ || null

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
  }

  if (content) {
    createRoot(root).render(<ErrorBoundary>{content}</ErrorBoundary>)
  }
}
