import { z } from 'zod'
import { WidgetValidation } from '../types/widget'

// Validation schema
export const widgetContentSchema = z.string()
  .min(0, 'Content cannot be negative length')
  .max(5000, 'Content cannot exceed 5000 characters')

// Character limits
export const WIDGET_LIMITS = {
  MIN_CHARACTERS: 0,
  MAX_CHARACTERS: 5000,
  WARNING_THRESHOLD: 4500, // Show warning at 90%
} as const

export function validateWidgetContent(content: string): WidgetValidation {
  const characterCount = content.length
  const errors: string[] = []

  // Basic validation
  if (characterCount > WIDGET_LIMITS.MAX_CHARACTERS) {
    errors.push(`Content exceeds maximum length of ${WIDGET_LIMITS.MAX_CHARACTERS} characters`)
  }

  // Warning for approaching limit
  if (characterCount >= WIDGET_LIMITS.WARNING_THRESHOLD && characterCount < WIDGET_LIMITS.MAX_CHARACTERS) {
    errors.push(`Approaching character limit (${characterCount}/${WIDGET_LIMITS.MAX_CHARACTERS})`)
  }

  // Zod validation only if no custom errors
  if (errors.length === 0 || (errors.length === 1 && errors[0].includes('Approaching'))) {
    try {
      widgetContentSchema.parse(content)
    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.issues.map((issue) => issue.message))
      }
    }
  }

  return {
    isValid: errors.length === 0 || (errors.length === 1 && errors[0].includes('Approaching')),
    errors,
    characterCount
  }
}

export function getCharacterCountColor(count: number): string {
  if (count >= WIDGET_LIMITS.MAX_CHARACTERS) return 'text-red-600'
  if (count >= WIDGET_LIMITS.WARNING_THRESHOLD) return 'text-yellow-600'
  return 'text-gray-500'
}

export function getCharacterCountMessage(count: number): string {
  const remaining = WIDGET_LIMITS.MAX_CHARACTERS - count
  
  if (count >= WIDGET_LIMITS.MAX_CHARACTERS) {
    return `Exceeded by ${Math.abs(remaining)} characters`
  }
  
  if (count >= WIDGET_LIMITS.WARNING_THRESHOLD) {
    return `${remaining} characters remaining`
  }
  
  return `${count} / ${WIDGET_LIMITS.MAX_CHARACTERS} characters`
} 