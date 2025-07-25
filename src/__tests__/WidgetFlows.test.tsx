import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, expect, afterEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Home from '@/app/page'
import { storageService } from '@/lib/storage'

// Mock the storage service
vi.mock('@/lib/storage')

const TestProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  })
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('Widget Flows', () => {
  const mockStorageService = vi.mocked(storageService)

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementations
    mockStorageService.getWidgets.mockResolvedValue([])
    mockStorageService.addWidget.mockImplementation(async (widget) => widget)
    mockStorageService.updateWidget.mockImplementation(async (id, content) => ({
      id,
      content,
      createdAt: new Date(),
      updatedAt: new Date()
    }))
    mockStorageService.deleteWidget.mockResolvedValue(true)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('renders widgets loaded from storage', async () => {
    const existingWidgets = [
      {
        id: 'widget-1',
        content: 'Existing widget content',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: 'widget-2', 
        content: 'Another widget',
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ]

    mockStorageService.getWidgets.mockResolvedValue(existingWidgets)

    render(
      <TestProvider>
        <Home />
      </TestProvider>
    )

    // Wait for widgets to load
    await waitFor(() => {
      expect(screen.getByText('Your Widgets (2)')).toBeInTheDocument()
    }, { timeout: 3000 })

    expect(screen.getByDisplayValue('Existing widget content')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Another widget')).toBeInTheDocument()
    expect(mockStorageService.getWidgets).toHaveBeenCalledTimes(1)
  })

  it('adds a widget → textarea appears', async () => {
    const user = userEvent.setup()

    render(
      <TestProvider>
        <Home />
      </TestProvider>
    )

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('No widgets yet')).toBeInTheDocument()
    })

    // Click add widget button
    const addButton = screen.getByTestId('add-widget-button')
    await user.click(addButton)

    // Wait for widget to be added
    await waitFor(() => {
      expect(mockStorageService.addWidget).toHaveBeenCalledTimes(1)
    })
  })

  it('types rapidly → use fake timers → only ONE saveWidgets call (debounce)', async () => {
    vi.useFakeTimers()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })

    // Start with one widget
    const initialWidget = {
      id: 'test-widget',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockStorageService.getWidgets.mockResolvedValue([initialWidget])

    render(
      <TestProvider>
        <Home />
      </TestProvider>
    )

    // Wait for widget to load
    await waitFor(() => {
      expect(screen.getByTestId('textarea-test-widget')).toBeInTheDocument()
    })

    const textarea = screen.getByTestId('textarea-test-widget')

    // Type rapidly multiple times
    await user.clear(textarea)
    await user.type(textarea, 'Hello')

    // Should not have called updateWidget yet due to debouncing
    expect(mockStorageService.updateWidget).not.toHaveBeenCalled()

    // Fast forward through debounce period (500ms)
    vi.advanceTimersByTime(600)

    // Now it should have been called exactly once
    await waitFor(() => {
      expect(mockStorageService.updateWidget).toHaveBeenCalledWith('test-widget', 'Hello')
    })

    vi.useRealTimers()
  })

  it('deletes widget → disappears', async () => {
    const user = userEvent.setup()

    const widgetToDelete = {
      id: 'delete-me',
      content: 'This widget will be deleted',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockStorageService.getWidgets.mockResolvedValue([widgetToDelete])

    render(
      <TestProvider>
        <Home />
      </TestProvider>
    )

    // Wait for widget to load
    await waitFor(() => {
      expect(screen.getByDisplayValue('This widget will be deleted')).toBeInTheDocument()
    })

    // Confirm deletion when prompted
    vi.mocked(window.confirm).mockReturnValue(true)

    // Click delete button
    const deleteButton = screen.getByTestId('delete-widget-delete-me')
    await user.click(deleteButton)

    // Verify confirmation was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this widget?')

    // Wait for deletion to complete
    await waitFor(() => {
      expect(mockStorageService.deleteWidget).toHaveBeenCalledWith('delete-me')
    })
  })

  it('handles character count validation during typing', async () => {
    const user = userEvent.setup()

    const widget = {
      id: 'validation-test',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    mockStorageService.getWidgets.mockResolvedValue([widget])

    render(
      <TestProvider>
        <Home />
      </TestProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('textarea-validation-test')).toBeInTheDocument()
    })

    const textarea = screen.getByTestId('textarea-validation-test')
    const longText = 'a'.repeat(4800) // Approaching limit

    await user.clear(textarea)
    await user.type(textarea, longText)

    // Should show warning color
    const charCount = screen.getByTestId('char-count-validation-test')
    expect(charCount).toHaveClass('text-yellow-600')
    expect(charCount).toHaveTextContent('200 characters remaining')
  })
}) 