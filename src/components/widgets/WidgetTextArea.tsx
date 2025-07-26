import React, { useRef, useEffect } from 'react'
import { WidgetValidation } from '@/types/widget'
import { cn } from '@/lib/utils'

interface WidgetTextAreaProps {
  content: string
  validation: WidgetValidation
  isFocused: boolean
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onFocus: () => void
  onBlur: () => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  widgetId: string
}

/**
 * Pure presentation component for text input
 * Handles textarea rendering with accessibility and auto-resize
 */
export function WidgetTextArea({
  content,
  validation,
  isFocused,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  widgetId
}: WidgetTextAreaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
  }, [content])

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={onChange}
      onFocus={onFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder="Enter your text here..."
      className={cn(
        'w-full p-3 border border-gray-300 rounded-md resize-none min-h-[100px]',
        'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
        'transition-colors duration-200',
        !validation.isValid && 'border-red-300 focus:ring-red-500'
      )}
      data-testid={`textarea-${widgetId}`}
      aria-describedby={`char-count-${widgetId} validation-${widgetId}`}
      aria-invalid={!validation.isValid}
      rows={4}
    />
  )
} 