import { vi, describe, it, beforeEach, expect } from 'vitest'
import { storageService } from '@/lib/storage'
import { TextWidget } from '@/types/widget'

// Create a simple mock for localStorage
const mockLocalStorage = (() => {
  let store: Record<string, string> = {}
  
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    // Helper to manually set store state
    _setStore: (newStore: Record<string, string>) => {
      store = newStore
    },
    _getStore: () => store,
  }
})()

// Replace global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('Storage', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
    vi.clearAllMocks()
  })

  describe('round-trip save + load', () => {
    it('saves and loads widgets correctly', async () => {
      const widgets: TextWidget[] = [
        {
          id: 'widget-1',
          content: 'First widget content',
          createdAt: new Date('2024-01-01T10:00:00Z'),
          updatedAt: new Date('2024-01-01T10:30:00Z'),
        },
        {
          id: 'widget-2',
          content: 'Second widget with special chars: 🎉 "quotes" & <tags>',
          createdAt: new Date('2024-01-02T15:45:00Z'),
          updatedAt: new Date('2024-01-02T16:00:00Z'),
        }
      ]

      // Save widgets
      await storageService.saveWidgets(widgets)

      // Verify localStorage was called
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'text-widgets',
        expect.stringContaining('widget-1')
      )

      // Load widgets back
      const loadedWidgets = await storageService.getWidgets()

      // Should have same content and IDs
      expect(loadedWidgets).toHaveLength(2)
      expect(loadedWidgets[0].id).toBe('widget-1')
      expect(loadedWidgets[0].content).toBe('First widget content')
      expect(loadedWidgets[1].id).toBe('widget-2')
      expect(loadedWidgets[1].content).toBe('Second widget with special chars: 🎉 "quotes" & <tags>')

      // Dates should be properly deserialized
      expect(loadedWidgets[0].createdAt).toBeInstanceOf(Date)
      expect(loadedWidgets[0].createdAt.toISOString()).toBe('2024-01-01T10:00:00.000Z')
      expect(loadedWidgets[0].updatedAt).toBeInstanceOf(Date)
      expect(loadedWidgets[1].updatedAt.toISOString()).toBe('2024-01-02T16:00:00.000Z')
    })

    it('handles empty widget list', async () => {
      await storageService.saveWidgets([])
      const loaded = await storageService.getWidgets()
      
      expect(loaded).toEqual([])
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('text-widgets', '[]')
    })

    it('handles large content', async () => {
      const largeContent = 'x'.repeat(4000) // Large but valid content
      const widget: TextWidget = {
        id: 'large-widget',
        content: largeContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageService.saveWidgets([widget])
      const loaded = await storageService.getWidgets()

      expect(loaded[0].content).toBe(largeContent)
      expect(loaded[0].content.length).toBe(4000)
    })
  })

  describe('corruption recovery', () => {
    it('returns empty array when localStorage contains invalid JSON', async () => {
      // Manually set corrupted data
      mockLocalStorage._setStore({ 'text-widgets': 'invalid json {[' })

      const widgets = await storageService.getWidgets()

      expect(widgets).toEqual([])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('text-widgets')
    })

    it('returns empty array when localStorage contains non-array JSON', async () => {
      mockLocalStorage._setStore({ 'text-widgets': '{"not": "an array"}' })

      const widgets = await storageService.getWidgets()

      expect(widgets).toEqual([])
    })

    it('handles partially corrupted widget data gracefully', async () => {
      const partiallyValidData = JSON.stringify([
        {
          id: 'valid-widget',
          content: 'Valid content',
          createdAt: '2024-01-01T10:00:00Z',
          updatedAt: '2024-01-01T10:00:00Z'
        },
        {
          id: 'invalid-widget',
          // Missing required fields
          content: 'Invalid widget'
        }
      ])

      mockLocalStorage._setStore({ 'text-widgets': partiallyValidData })

      const widgets = await storageService.getWidgets()

      // Should return the valid widget and handle the invalid one gracefully
      expect(widgets).toHaveLength(2)
      expect(widgets[0].id).toBe('valid-widget')
      expect(widgets[0].createdAt).toBeInstanceOf(Date)
      
      // Invalid widget should have Date objects created from undefined/null
      expect(widgets[1].id).toBe('invalid-widget')
      expect(widgets[1].createdAt).toBeInstanceOf(Date)
    })

    it('handles null/undefined values in localStorage', async () => {
      mockLocalStorage._setStore({})

      const widgets = await storageService.getWidgets()

      expect(widgets).toEqual([])
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('text-widgets')
    })
  })

  describe('individual widget operations', () => {
    it('returns null when updating non-existent widget', async () => {
      const result = await storageService.updateWidget('non-existent', 'new content')
      expect(result).toBeNull()
    })

    it('returns false when deleting non-existent widget', async () => {
      const result = await storageService.deleteWidget('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('handles special characters in content', async () => {
      const specialContent = '🎉\n\t"quotes"\n<script>alert("xss")</script>\u0000\uFFFF'
      const widget: TextWidget = {
        id: 'special-chars',
        content: specialContent,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      await storageService.saveWidgets([widget])
      const loaded = await storageService.getWidgets()

      expect(loaded[0].content).toBe(specialContent)
    })

    it('maintains widget order', async () => {
      const widgets: TextWidget[] = []
      for (let i = 0; i < 5; i++) {
        widgets.push({
          id: `widget-${i}`,
          content: `Content ${i}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      await storageService.saveWidgets(widgets)
      const loaded = await storageService.getWidgets()

      expect(loaded.map(w => w.id)).toEqual(widgets.map(w => w.id))
    })
  })
}) 