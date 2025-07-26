import React from 'react'
import { Trash2, Clock } from 'lucide-react'
import { TextWidget } from '@/types/widget'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface WidgetHeaderProps {
  widget: TextWidget
  onDelete: () => void
  isDeleting?: boolean
}

/**
 * Presentation component for widget header
 * Displays metadata and actions - pure UI component with no business logic
 */
export function WidgetHeader({ 
  widget, 
  onDelete, 
  isDeleting = false 
}: WidgetHeaderProps) {
  return (
    <header className="flex items-start justify-between mb-3">
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-700 mb-1">
          Text Widget
        </h3>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <time 
            dateTime={widget.createdAt.toISOString()}
            className="flex items-center gap-1"
          >
            <Clock className="h-3 w-3" />
            Created: {formatDate(widget.createdAt)}
          </time>
          {widget.updatedAt > widget.createdAt && (
            <time 
              dateTime={widget.updatedAt.toISOString()}
              className="flex items-center gap-1"
            >
              <Clock className="h-3 w-3" />
              Updated: {formatDate(widget.updatedAt)}
            </time>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onDelete}
        disabled={isDeleting}
        className="text-gray-400 hover:text-red-600 h-8 w-8 flex-shrink-0"
        aria-label={`Delete widget ${widget.id}`}
        data-testid={`delete-widget-${widget.id}`}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </header>
  )
} 