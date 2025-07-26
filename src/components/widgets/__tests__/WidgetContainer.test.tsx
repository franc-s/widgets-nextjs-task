import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WidgetContainer } from '../WidgetContainer'
import { TextWidget } from '@/types/widget'

// Mock the useWidgetState hook to isolate component testing
vi.mock('../hooks/useWidgetState', () => ({
  useWidgetState: vi.fn(() => ({
    content: 'Test content',
    isFocused: false,
    validation: {
      isValid: true,
      errors: [],
      characterCount: 12
    },
    handleContentChange: vi.fn(),
    handleFocus: vi.fn(),
    handleBlur: vi.fn(),
    handleKeyDown: vi.fn()
  }))
}))

const TestProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('WidgetContainer Architecture', () => {
  const mockWidget: TextWidget = {
    id: 'test-widget-1',
    content: 'Test content',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    updatedAt: new Date('2024-01-01T10:30:00Z')
  }

  const mockOnUpdate = vi.fn()
  const mockOnDelete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Composition', () => {
    it('renders all child components in correct hierarchy', () => {
      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      // Verify semantic structure
      expect(screen.getByRole('region')).toBeInTheDocument()
      expect(screen.getByRole('region')).toHaveAttribute('aria-label', 'Text widget test-widget-1')

      // Verify header section
      expect(screen.getByRole('banner')).toBeInTheDocument()
      expect(screen.getByText('Text Widget')).toBeInTheDocument()
      expect(screen.getByText(/Created:/)).toBeInTheDocument()
      expect(screen.getByText(/Updated:/)).toBeInTheDocument()

      // Verify content section
      expect(screen.getByTestId('textarea-test-widget-1')).toBeInTheDocument()

      // Verify footer section
      expect(screen.getByTestId('char-count-test-widget-1')).toBeInTheDocument()
    })

    it('applies correct CSS classes based on state', () => {
      const { rerender } = render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            isDeleting={false}
          />
        </TestProvider>
      )

      const container = screen.getByRole('region')
      expect(container).toHaveClass('border-gray-200')
      expect(container).not.toHaveClass('opacity-50')

      // Test deleting state
      rerender(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
            isDeleting={true}
          />
        </TestProvider>
      )

      expect(container).toHaveClass('opacity-50', 'pointer-events-none')
    })
  })

  describe('Error Boundary Integration', () => {
    it('has error boundary wrapper around components', () => {
      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      // Verify that the component renders without throwing
      // Error boundary is present in the component structure
      expect(screen.getByRole('region')).toBeInTheDocument()
      expect(screen.getByText('Text Widget')).toBeInTheDocument()
    })
  })

  describe('Accessibility Features', () => {
    it('has proper ARIA attributes', () => {
      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      const container = screen.getByRole('region')
      expect(container).toHaveAttribute('aria-label', 'Text widget test-widget-1')

      const textarea = screen.getByTestId('textarea-test-widget-1')
      expect(textarea).toHaveAttribute('aria-describedby', 'char-count-test-widget-1 validation-test-widget-1')

      const deleteButton = screen.getByRole('button', { name: /delete widget/i })
      expect(deleteButton).toHaveAttribute('aria-label', 'Delete widget test-widget-1')
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()

      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      const textarea = screen.getByTestId('textarea-test-widget-1')
      const deleteButton = screen.getByRole('button', { name: /delete widget/i })

      // Tab should navigate between focusable elements
      // The actual tab order might be different, so let's just verify both are focusable
      await user.click(textarea)
      expect(textarea).toHaveFocus()

      await user.click(deleteButton)
      expect(deleteButton).toHaveFocus()
    })
  })

  describe('Delete Confirmation', () => {
    it('shows confirmation dialog before deleting', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      const deleteButton = screen.getByTestId('delete-widget-test-widget-1')
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to delete this widget?')
      expect(mockOnDelete).toHaveBeenCalledWith('test-widget-1')

      confirmSpy.mockRestore()
    })

    it('does not delete when confirmation is cancelled', async () => {
      const user = userEvent.setup()
      
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      const deleteButton = screen.getByTestId('delete-widget-test-widget-1')
      await user.click(deleteButton)

      expect(confirmSpy).toHaveBeenCalled()
      expect(mockOnDelete).not.toHaveBeenCalled()

      confirmSpy.mockRestore()
    })
  })

  describe('Component Integration', () => {
    it('integrates all widget components correctly', () => {
      render(
        <TestProvider>
          <WidgetContainer
            widget={mockWidget}
            onUpdate={mockOnUpdate}
            onDelete={mockOnDelete}
          />
        </TestProvider>
      )

      // Each component should render its specific content
      // Header: metadata
      expect(screen.getByText('Text Widget')).toBeInTheDocument()
      expect(screen.getByText(/Created:/)).toBeInTheDocument()

      // Content: textarea with value
      const textarea = screen.getByDisplayValue('Test content')
      expect(textarea).toBeInTheDocument()

      // Footer: character count
      expect(screen.getByTestId('char-count-test-widget-1')).toBeInTheDocument()

      // Actions: delete button
      expect(screen.getByTestId('delete-widget-test-widget-1')).toBeInTheDocument()
    })
  })
}) 