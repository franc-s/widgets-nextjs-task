import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
import { useEffect } from 'react'
import { TextWidget } from '@/types/widget'
import { storageService } from '@/lib/storage'
import { generateId } from '@/lib/utils'
import { logger } from '@/lib/logger'
import { analytics, trackBug, measurePerformance } from '@/lib/analytics'

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
    mutationFn: async () => {
      const newWidget: TextWidget = {
        id: generateId(),
        content: '',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const result = await measurePerformance('widget_creation', () =>
        storageService.addWidget(newWidget)
      )
      
      analytics.trackWidgetCreated(newWidget.id)
      return result
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Widget update operation failed', { 
        error: errorMessage,
        widgetId: variables.id 
      })
      trackBug(error instanceof Error ? error : new Error(errorMessage), { 
        operation: 'widget_update',
        widgetId: variables.id 
      })
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
      const errorMessage = error instanceof Error ? error.message : String(error)
      logger.error('Widget deletion operation failed', { 
        error: errorMessage,
        widgetId: variables 
      })
      trackBug(error instanceof Error ? error : new Error(errorMessage), { 
        operation: 'widget_delete',
        widgetId: variables 
      })
    },
    onSuccess: (result, id) => {
      if (!result) {
        logger.warn('Widget deletion attempted but widget not found', { widgetId: id })
      } else {
        analytics.trackWidgetDeleted(id)
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
        logger.error('Invalid parameters provided for widget update', { 
          providedId: id, 
          contentType: typeof content, 
          hasId: !!id,
          hasContent: !!content 
        })
        analytics.trackValidationFailure(id || 'unknown', ['Invalid update parameters'])
        return
      }
      updateWidgetMutation.mutate({ id, content })
      analytics.trackWidgetUpdated(id, content.length)
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