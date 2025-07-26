import React from 'react'
import { WidgetValidation } from '@/types/widget'
import { getCharacterCountColor, getCharacterCountMessage } from '@/lib/validation'
import { cn } from '@/lib/utils'

interface WidgetFooterProps {
  validation: WidgetValidation
  widgetId: string
}

/**
 * Pure presentation component for widget footer
 * Displays character count and status information
 */
export function WidgetFooter({
  validation,
  widgetId
}: WidgetFooterProps) {
  const characterCountColor = getCharacterCountColor(validation.characterCount)
  const characterCountMessage = getCharacterCountMessage(validation.characterCount)

  return (
    <footer className="flex items-center justify-between text-sm mt-2">
      <div 
        id={`char-count-${widgetId}`}
        className={cn('font-medium', characterCountColor)}
        data-testid={`char-count-${widgetId}`}
        aria-label={`Character count: ${characterCountMessage}`}
      >
        {characterCountMessage}
      </div>

      {/* Show approaching limit warning */}
      {validation.errors.some(error => error.includes('Approaching')) && (
        <div className="text-yellow-600 text-xs font-medium">
          Approaching limit
        </div>
      )}
    </footer>
  )
} 