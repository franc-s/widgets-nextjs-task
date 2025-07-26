import React from 'react'
import { WidgetValidation } from '@/types/widget'
import { WidgetTextArea } from './WidgetTextArea'
import { WidgetValidationDisplay } from './WidgetValidationDisplay'

interface WidgetContentProps {
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
 * Smart content component that manages text editing logic
 * Composes smaller presentation components for better separation of concerns
 */
export function WidgetContent({
  content,
  validation,
  isFocused,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  widgetId
}: WidgetContentProps) {
  return (
    <div className="space-y-2">
      <WidgetTextArea
        content={content}
        validation={validation}
        isFocused={isFocused}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        widgetId={widgetId}
      />
      
      <WidgetValidationDisplay
        validation={validation}
        widgetId={widgetId}
      />
    </div>
  )
} 