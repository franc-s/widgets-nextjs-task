import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useDebouncedCallback } from 'use-debounce'
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

  // Mutation for updating widget content
  const updateWidgetMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      storageService.updateWidget(id, content),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
    }
  })

  // Mutation for deleting a widget
  const deleteWidgetMutation = useMutation({
    mutationFn: (id: string) => storageService.deleteWidget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WIDGETS_QUERY_KEY })
    }
  })

  // Debounced update function to prevent excessive API calls
  const debouncedUpdate = useDebouncedCallback(
    (id: string, content: string) => {
      updateWidgetMutation.mutate({ id, content })
    },
    500 // 500ms debounce
  )

  return {
    widgets,
    isLoading,
    error,
    addWidget: () => addWidgetMutation.mutate(),
    updateWidget: (id: string, content: string) => debouncedUpdate(id, content),
    deleteWidget: (id: string) => deleteWidgetMutation.mutate(id),
    isAddingWidget: addWidgetMutation.isPending,
    isUpdatingWidget: updateWidgetMutation.isPending,
    isDeletingWidget: deleteWidgetMutation.isPending
  }
} 