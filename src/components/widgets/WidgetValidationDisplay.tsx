import React from 'react'
import { AlertCircle } from 'lucide-react'
import { WidgetValidation } from '@/types/widget'
import { cn } from '@/lib/utils'

interface WidgetValidationDisplayProps {
  validation: WidgetValidation
  widgetId: string
}

/**
 * Pure presentation component for validation messages
 * Displays error states with proper accessibility
 */
export function WidgetValidationDisplay({
  validation,
  widgetId
}: WidgetValidationDisplayProps) {
  // Filter out warning messages for cleaner error display
  const errorMessages = validation.errors.filter(
    error => !error.includes('Approaching')
  )

  if (validation.isValid || errorMessages.length === 0) {
    return null
  }

  return (
    <div 
      id={`validation-${widgetId}`}
      className="flex items-start gap-2 text-red-600 text-sm"
      data-testid={`validation-${widgetId}`}
      role="alert"
      aria-live="polite"
    >
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="space-y-1">
        {errorMessages.map((error, index) => (
          <p key={index} className="leading-relaxed">
            {error}
          </p>
        ))}
      </div>
    </div>
  )
} 