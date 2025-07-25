'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: (failureCount, error) => {
          // Don't retry for certain error types
          if (error instanceof Error) {
            const message = error.message.toLowerCase()
            if (
              message.includes('storage_unavailable') ||
              message.includes('invalid_type') ||
              message.includes('quota_exceeded')
            ) {
              return false
            }
          }
          // Retry up to 2 times for other errors
          return failureCount < 2
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchOnReconnect: true,
      },
      mutations: {
        retry: (failureCount, error) => {
          // Don't retry mutations for unrecoverable errors
          if (error instanceof Error) {
            const message = error.message.toLowerCase()
            if (
              message.includes('invalid_') ||
              message.includes('quota_exceeded') ||
              message.includes('storage_unavailable')
            ) {
              return false
            }
          }
          return failureCount < 1
        },
        retryDelay: 1000,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
} 