import { hydrateRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Timeline } from '@/client/components/Timeline'

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
  hydrateRoot(
    root,
    <QueryClientProvider client={queryClient}>
      <Timeline />
    </QueryClientProvider>,
  )
}
