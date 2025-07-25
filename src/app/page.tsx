'use client'

import { Plus, FileText, Loader2 } from 'lucide-react'
import { useWidgets } from '@/hooks/useWidgets'
import { TextWidget } from '@/components/TextWidget'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const {
    widgets,
    isLoading,
    error,
    addWidget,
    updateWidget,
    deleteWidget,
    isAddingWidget,
    isDeletingWidget
  } = useWidgets()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-600">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <FileText className="h-12 w-12 mx-auto mb-2" />
            <h2 className="text-xl font-semibold">Error Loading Widgets</h2>
            <p className="text-gray-600 mt-2">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
          </div>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Simple Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Text Widgets</h1>
            <Button
              onClick={addWidget}
              disabled={isAddingWidget}
              className="flex items-center space-x-2"
              data-testid="add-widget-button"
            >
              {isAddingWidget ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Add Widget</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {widgets.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No widgets yet</h2>
            <p className="text-gray-500">Click &ldquo;Add Widget&rdquo; to get started</p>
          </div>
        ) : (
          <div className="space-y-6">
            {widgets.map((widget) => (
              <TextWidget
                key={widget.id}
                widget={widget}
                onUpdate={updateWidget}
                onDelete={deleteWidget}
                isDeleting={isDeletingWidget}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
