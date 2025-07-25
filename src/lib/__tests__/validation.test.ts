import { vi, describe, it, expect } from 'vitest'
import { 
  validateWidgetContent, 
  getCharacterCountColor, 
  getCharacterCountMessage,
  WIDGET_LIMITS 
} from '../validation'

describe('validateWidgetContent', () => {
  it('validates empty content as valid', () => {
    const result = validateWidgetContent('')
    expect(result.isValid).toBe(true)
    expect(result.characterCount).toBe(0)
    expect(result.errors).toHaveLength(0)
  })

  it('validates normal content as valid', () => {
    const content = 'This is normal content'
    const result = validateWidgetContent(content)
    
    expect(result.isValid).toBe(true)
    expect(result.characterCount).toBe(content.length)
    expect(result.errors).toHaveLength(0)
  })

  it('shows warning when approaching character limit', () => {
    const content = 'a'.repeat(WIDGET_LIMITS.WARNING_THRESHOLD)
    const result = validateWidgetContent(content)
    
    expect(result.isValid).toBe(true) // Still valid but with warning
    expect(result.characterCount).toBe(WIDGET_LIMITS.WARNING_THRESHOLD)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Approaching character limit')
  })

  it('invalidates content exceeding maximum length', () => {
    const content = 'a'.repeat(WIDGET_LIMITS.MAX_CHARACTERS + 1)
    const result = validateWidgetContent(content)
    
    expect(result.isValid).toBe(false)
    expect(result.characterCount).toBe(WIDGET_LIMITS.MAX_CHARACTERS + 1)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toContain('Content exceeds maximum length')
  })
})

describe('getCharacterCountColor', () => {
  it('returns gray for normal count', () => {
    expect(getCharacterCountColor(100)).toBe('text-gray-500')
  })

  it('returns yellow for warning threshold', () => {
    expect(getCharacterCountColor(WIDGET_LIMITS.WARNING_THRESHOLD)).toBe('text-yellow-600')
  })

  it('returns red for exceeding limit', () => {
    expect(getCharacterCountColor(WIDGET_LIMITS.MAX_CHARACTERS + 1)).toBe('text-red-600')
  })
})

describe('getCharacterCountMessage', () => {
  it('shows character count for normal usage', () => {
    const count = 100
    const message = getCharacterCountMessage(count)
    expect(message).toBe(`${count} / ${WIDGET_LIMITS.MAX_CHARACTERS} characters`)
  })

  it('shows remaining characters when approaching limit', () => {
    const count = WIDGET_LIMITS.WARNING_THRESHOLD
    const remaining = WIDGET_LIMITS.MAX_CHARACTERS - count
    const message = getCharacterCountMessage(count)
    expect(message).toBe(`${remaining} characters remaining`)
  })

  it('shows exceeded count when over limit', () => {
    const count = WIDGET_LIMITS.MAX_CHARACTERS + 10
    const exceeded = count - WIDGET_LIMITS.MAX_CHARACTERS
    const message = getCharacterCountMessage(count)
    expect(message).toBe(`Exceeded by ${exceeded} characters`)
  })
}) 