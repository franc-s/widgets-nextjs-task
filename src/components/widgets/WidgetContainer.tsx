'use client'

import React from 'react'
import { TextWidget as TextWidgetType } from '@/types/widget'
import { WidgetHeader } from './WidgetHeader'
import { WidgetContent } from './WidgetContent'
import { WidgetFooter } from './WidgetFooter'
import { useWidgetState } from './hooks/useWidgetState'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { cn } from '@/lib/utils'

interface WidgetContainerProps {
  widget: TextWidgetType
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

/**
 * Smart container component that orchestrates widget functionality
 * Demonstrates separation of concerns and component composition
 */
export function WidgetContainer({ 
  widget, 
  onUpdate, 
  onDelete, 
  isDeleting = false 
}: WidgetContainerProps) {
  const {
    content,
    isFocused,
    validation,
    handleContentChange,
    handleFocus,
    handleBlur,
    handleKeyDown
  } = useWidgetState({
    widget,
    onUpdate
  })

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      onDelete(widget.id)
    }
  }

  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-700">Widget failed to load</p>
        </div>
      }
    >
      <article 
        className={cn(
          'border border-gray-200 rounded-lg p-4 bg-white shadow-sm transition-all duration-200',
          isFocused && 'border-blue-500 shadow-md',
          !validation.isValid && 'border-red-300',
          isDeleting && 'opacity-50 pointer-events-none'
        )}
        data-testid={`widget-${widget.id}`}
        role="region"
        aria-label={`Text widget ${widget.id}`}
      >
        <WidgetHeader
          widget={widget}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
        
        <WidgetContent
          content={content}
          validation={validation}
          isFocused={isFocused}
          onChange={handleContentChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          widgetId={widget.id}
        />
        
        <WidgetFooter
          validation={validation}
          widgetId={widget.id}
        />
      </article>
    </ErrorBoundary>
  )
} 