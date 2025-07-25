import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect } from 'vitest'
import { TextWidget } from '../TextWidget'
import { TextWidget as TextWidgetType } from '@/types/widget'

describe('TextWidget', () => {
  const mockWidget: TextWidgetType = {
    id: 'test-widget-1',
    content: 'Initial content',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:00:00Z'),
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(window.confirm).mockReturnValue(true)
  })

  it('renders widget with initial content', () => {
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId('widget-test-widget-1')).toBeInTheDocument()
    expect(screen.getByTestId('textarea-test-widget-1')).toHaveValue('Initial content')
    expect(screen.getByText('Text Widget')).toBeInTheDocument()
  })

  it('displays character count correctly', () => {
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId('char-count-test-widget-1')).toHaveTextContent('15 / 5000 characters')
  })

  it('calls onUpdate when content changes', async () => {
    const user = userEvent.setup()
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByTestId('textarea-test-widget-1')
    await user.clear(textarea)
    await user.type(textarea, 'New content')

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('test-widget-1', 'New content')
    })
  })

  it('shows validation error for content exceeding limit', () => {
    const longContent = 'a'.repeat(5001)
    const widgetWithLongContent = { ...mockWidget, content: longContent }

    render(
      <TextWidget
        widget={widgetWithLongContent}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    expect(screen.getByTestId('validation-test-widget-1')).toBeInTheDocument()
    expect(screen.getByText(/Content exceeds maximum length/)).toBeInTheDocument()
  })

  it('shows warning when approaching character limit', () => {
    const nearLimitContent = 'a'.repeat(4800)
    const widgetNearLimit = { ...mockWidget, content: nearLimitContent }

    render(
      <TextWidget
        widget={widgetNearLimit}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const charCount = screen.getByTestId('char-count-test-widget-1')
    expect(charCount).toHaveClass('text-yellow-600')
    expect(charCount).toHaveTextContent('200 characters remaining')
  })

  it('handles delete confirmation', async () => {
    const user = userEvent.setup()
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByTestId('delete-widget-test-widget-1')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this widget?')
    expect(mockOnDelete).toHaveBeenCalledWith('test-widget-1')
  })

  it('cancels delete when user rejects confirmation', async () => {
    vi.mocked(window.confirm).mockReturnValue(false)
    const user = userEvent.setup()

    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const deleteButton = screen.getByTestId('delete-widget-test-widget-1')
    await user.click(deleteButton)

    expect(window.confirm).toHaveBeenCalled()
    expect(mockOnDelete).not.toHaveBeenCalled()
  })

  it('handles tab key for indentation', async () => {
    const user = userEvent.setup()
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByTestId('textarea-test-widget-1') as HTMLTextAreaElement
    await user.click(textarea)
    // Move cursor to beginning
    textarea.setSelectionRange(0, 0)
    await user.keyboard('{Tab}')

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith('test-widget-1', '  Initial content')
    })
  })

  it('shows disabled state when deleting', () => {
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
        isDeleting={true}
      />
    )

    const widget = screen.getByTestId('widget-test-widget-1')
    expect(widget).toHaveClass('opacity-50', 'pointer-events-none')
  })

  it('shows focus state when textarea is focused', async () => {
    const user = userEvent.setup()
    render(
      <TextWidget
        widget={mockWidget}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />
    )

    const textarea = screen.getByTestId('textarea-test-widget-1')
    await user.click(textarea)

    const widget = screen.getByTestId('widget-test-widget-1')
    expect(widget).toHaveClass('border-blue-500')
  })
}) 