import { useState, useEffect, useCallback } from 'react'
import { TextWidget, WidgetValidation } from '@/types/widget'
import { validateWidgetContent } from '@/lib/validation'

interface UseWidgetStateProps {
  widget: TextWidget
  onUpdate: (id: string, content: string) => void
}

interface UseWidgetStateReturn {
  content: string
  isFocused: boolean
  validation: WidgetValidation
  handleContentChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleFocus: () => void
  handleBlur: () => void
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
}

/**
 * Custom hook that encapsulates widget state management
 * Demonstrates separation of business logic from UI components
 */
export function useWidgetState({ 
  widget, 
  onUpdate 
}: UseWidgetStateProps): UseWidgetStateReturn {
  const [content, setContent] = useState(widget.content)
  const [isFocused, setIsFocused] = useState(false)

  // Sync with prop changes (important for external updates)
  useEffect(() => {
    setContent(widget.content)
  }, [widget.content])

  // Memoized validation to prevent unnecessary recalculations
  const validation = validateWidgetContent(content)

  // Handle content changes with immediate local state update
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onUpdate(widget.id, newContent)
  }, [widget.id, onUpdate])

  // Focus management for better UX
  const handleFocus = useCallback(() => {
    setIsFocused(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  // Enhanced keyboard handling for better UX
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for better UX (insert spaces instead of losing focus)
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      
      setContent(newContent)
      onUpdate(widget.id, newContent)
      
      // Reset cursor position after state update
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }, [content, widget.id, onUpdate])

  return {
    content,
    isFocused,
    validation,
    handleContentChange,
    handleFocus,
    handleBlur,
    handleKeyDown
  }
} 