import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import { useEffect } from 'react'
import { TextWidget } from '@/types/widget'
import { storageService } from '@/lib/storage'
import { generateId } from '@/lib/utils'

const WIDGETS_QUERY_KEY = ['widgets']

export function useWidgets() {
  const queryClient = useQueryClient()

  // Query for fetching all widgets
  const {
    data: widgets = [],
    isLoading,
    error
  } = useQuery({
    queryKey: WIDGETS_QUERY_KEY,
    queryFn: () => storageService.getWidgets(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Mutation for adding a new widget
  const addWidgetMutation = useMutation({
    mutationFn: () => {
      const newWidget: TextWidget = {
        id: generateId(),
        content: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      return storageService.addWidget(newWidget)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
    }
  })

  // Mutation for updating widget content with optimistic updates
  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      storageService.updateWidget(id, content),
    onMutate: async ({ id, content }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: WIDGETS_QUERY_KEY })
      
      // Snapshot previous value for rollback
      const previousWidgets = queryClient.getQueryData<TextWidget[]>(WIDGETS_QUERY_KEY)
      
      // Optimistically update
      if (previousWidgets) {
        const updatedWidgets = previousWidgets.map(widget =>
          widget.id === id
            ? { ...widget, content, updatedAt: new Date() }
            : widget
        )
        queryClient.setQueryData(WIDGETS_QUERY_KEY, updatedWidgets)
      }
      
      return { previousWidgets }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousWidgets) {
        queryClient.setQueryData(WIDGETS_QUERY_KEY, context.previousWidgets)
      }
      console.error('Failed to update widget:', error)
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
    }
  })

  // Mutation for deleting a widget with optimistic updates
  const deleteWidgetMutation = useMutation({
    mutationFn: (id: string) => storageService.deleteWidget(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: WIDGETS_QUERY_KEY })
      
      // Snapshot previous value for rollback
      const previousWidgets = queryClient.getQueryData<TextWidget[]>(WIDGETS_QUERY_KEY)
      
      // Optimistically remove widget
      if (previousWidgets) {
        const updatedWidgets = previousWidgets.filter(widget => widget.id !== id)
        queryClient.setQueryData(WIDGETS_QUERY_KEY, updatedWidgets)
      }
      
      return { previousWidgets }
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousWidgets) {
        queryClient.setQueryData(WIDGETS_QUERY_KEY, context.previousWidgets)
      }
      console.error('Failed to delete widget:', error)
    },
    onSuccess: (result, id) => {
      if (!result) {
        console.warn(`Widget ${id} was not found for deletion`)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
    }
  })

  // Debounced update function to prevent excessive API calls
  const debouncedUpdate = useDebouncedCallback(
    (id: string, content: string) => {
      // Additional validation before mutation
      if (!id || typeof content !== 'string') {
        console.error('Invalid parameters for widget update:', { id, content })
        return
      }
      updateWidgetMutation.mutate({ id, content })
    },
    500 // 500ms debounce
  )

  // Cleanup debounced function on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel()
    }
  }, [debouncedUpdate])

  // Enhanced error information
  const enhancedError = error || updateWidgetMutation.error || deleteWidgetMutation.error || addWidgetMutation.error

  return {
    widgets,
    isLoading,
    error: enhancedError,
    addWidget: () => addWidgetMutation.mutate(),
    updateWidget: (id: string, content: string) => debouncedUpdate(id, content),
    deleteWidget: (id: string) => deleteWidgetMutation.mutate(id),
    isAddingWidget: addWidgetMutation.isPending,
    isUpdatingWidget: updateWidgetMutation.isPending,
    isDeletingWidget: deleteWidgetMutation.isPending,
    // Additional utility functions
    cancelPendingUpdates: () => debouncedUpdate.cancel(),
    retryFailedOperation: () => queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
  }
} 