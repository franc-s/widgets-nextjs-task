'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Trash2, AlertCircle } from 'lucide-react'
import { TextWidget as TextWidgetType } from '@/types/widget'
import { validateWidgetContent, getCharacterCountColor, getCharacterCountMessage } from '@/lib/validation'
import { formatDate, cn } from '@/lib/utils'
import { Button } from './ui/Button'

interface TextWidgetProps {
  widget: TextWidgetType
  onUpdate: (id: string, content: string) => void
  onDelete: (id: string) => void
  isDeleting?: boolean
}

export function TextWidget({ widget, onUpdate, onDelete, isDeleting = false }: TextWidgetProps) {
  const [content, setContent] = useState(widget.content)
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const validation = validateWidgetContent(content)
  const characterCountColor = getCharacterCountColor(validation.characterCount)
  const characterCountMessage = getCharacterCountMessage(validation.characterCount)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [content])

  // Sync with prop changes
  useEffect(() => {
    setContent(widget.content)
  }, [widget.content])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onUpdate(widget.id, newContent)
  }

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this widget?')) {
      onDelete(widget.id)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle Tab key for better UX
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newContent = content.substring(0, start) + '  ' + content.substring(end)
      setContent(newContent)
      onUpdate(widget.id, newContent)
      
      // Reset cursor position
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div 
      className={cn(
        'border border-gray-200 rounded-lg p-4 bg-white shadow-sm transition-all duration-200',
        isFocused && 'border-blue-500 shadow-md',
        !validation.isValid && 'border-red-300',
        isDeleting && 'opacity-50 pointer-events-none'
      )}
      data-testid={`widget-${widget.id}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-700 mb-1">
            Text Widget
          </h3>
          <p className="text-xs text-gray-500">
            Created: {formatDate(widget.createdAt)}
            {widget.updatedAt > widget.createdAt && (
              <span className="ml-2">
                • Updated: {formatDate(widget.updatedAt)}
              </span>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-gray-400 hover:text-red-600 h-8 w-8"
          aria-label="Delete widget"
          data-testid={`delete-widget-${widget.id}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Enter your text here..."
          className={cn(
            'w-full p-3 border border-gray-300 rounded-md resize-none min-h-[100px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors',
            !validation.isValid && 'border-red-300 focus:ring-red-500'
          )}
          data-testid={`textarea-${widget.id}`}
          aria-describedby={`char-count-${widget.id} validation-${widget.id}`}
        />

        <div className="flex items-center justify-between text-sm">
          <div 
            id={`char-count-${widget.id}`}
            className={cn('font-medium', characterCountColor)}
            data-testid={`char-count-${widget.id}`}
          >
            {characterCountMessage}
          </div>

          {!validation.isValid && validation.errors.length > 0 && (
            <div 
              id={`validation-${widget.id}`}
              className="flex items-center text-red-600"
              data-testid={`validation-${widget.id}`}
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              <span className="text-xs">
                {validation.errors.filter(error => !error.includes('Approaching')).join(', ')}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 