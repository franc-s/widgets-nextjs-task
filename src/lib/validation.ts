import { z } from 'zod'
import { WidgetValidation } from '@/types/widget'

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
  const errors: string[] = []
  
  // Handle null/undefined gracefully
  if (content == null) {
    content = ''
  }
  
  // Ensure content is a string
  if (typeof content !== 'string') {
    content = String(content)
  }

  // Use proper Unicode-aware character counting
  const characterCount = [...content].length // Handles emojis and unicode properly
  const byteSize = new TextEncoder().encode(content).length

  // Character limit validation
  if (characterCount > WIDGET_LIMITS.MAX_CHARACTERS) {
    errors.push(`Content exceeds maximum length of ${WIDGET_LIMITS.MAX_CHARACTERS} characters`)
  }

  // Byte size validation (for storage efficiency)
  if (byteSize > 50000) { // ~50KB limit for single widget
    errors.push('Content size is too large for storage')
  }

  // Warning for approaching limit
  if (characterCount >= WIDGET_LIMITS.WARNING_THRESHOLD && characterCount < WIDGET_LIMITS.MAX_CHARACTERS) {
    errors.push(`Approaching character limit (${characterCount}/${WIDGET_LIMITS.MAX_CHARACTERS})`)
  }

  // Additional content validation
  try {
    // Check for excessive line breaks
    const lineCount = content.split('\n').length
    if (lineCount > 1000) {
      errors.push('Too many line breaks (maximum 1000 lines)')
    }

    // Check for suspicious patterns that might indicate script injection
    const suspiciousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi
    ]
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        errors.push('Content contains potentially unsafe elements')
        break
      }
    }

    // Zod validation for basic structure
    if (errors.filter(e => !e.includes('Approaching')).length === 0) {
      widgetContentSchema.parse(content)
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      errors.push(...error.issues.map((issue) => issue.message))
    } else {
      errors.push('Content validation failed')
    }
  }

  return {
    isValid: errors.length === 0 || (errors.length === 1 && errors[0].includes('Approaching')),
    errors: errors.filter((error, index, self) => self.indexOf(error) === index), // Remove duplicates
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