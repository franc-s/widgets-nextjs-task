import { TextWidget } from '@/types/widget'

const STORAGE_KEY = 'text-widgets'

// Storage interface that can easily be swapped for API calls
export interface StorageService {
  getWidgets(): Promise<TextWidget[]>
  saveWidgets(widgets: TextWidget[]): Promise<void>
  addWidget(widget: TextWidget): Promise<TextWidget>
  updateWidget(id: string, content: string): Promise<TextWidget | null>
  deleteWidget(id: string): Promise<boolean>
}

// LocalStorage implementation
class LocalStorageService implements StorageService {
  private parseStoredWidgets(stored: string | null): TextWidget[] {
    if (!stored) return []
    
    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) 
        ? parsed.map(widget => ({
            ...widget,
            createdAt: new Date(widget.createdAt),
            updatedAt: new Date(widget.updatedAt)
          }))
        : []
    } catch (error) {
      console.error('Failed to parse stored widgets:', error)
      return []
    }
  }

  async getWidgets(): Promise<TextWidget[]> {
    // Simulate async operation for API compatibility
    return new Promise((resolve) => {
      setTimeout(() => {
        const stored = localStorage.getItem(STORAGE_KEY)
        resolve(this.parseStoredWidgets(stored))
      }, 10)
    })
  }

  async saveWidgets(widgets: TextWidget[]): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets))
        resolve()
      }, 10)
    })
  }

  async addWidget(widget: TextWidget): Promise<TextWidget> {
    const widgets = await this.getWidgets()
    widgets.push(widget)
    await this.saveWidgets(widgets)
    return widget
  }

  async updateWidget(id: string, content: string): Promise<TextWidget | null> {
    const widgets = await this.getWidgets()
    const widgetIndex = widgets.findIndex(w => w.id === id)
    
    if (widgetIndex === -1) return null
    
    widgets[widgetIndex] = {
      ...widgets[widgetIndex],
      content,
      updatedAt: new Date()
    }
    
    await this.saveWidgets(widgets)
    return widgets[widgetIndex]
  }

  async deleteWidget(id: string): Promise<boolean> {
    const widgets = await this.getWidgets()
    const initialLength = widgets.length
    const filteredWidgets = widgets.filter(w => w.id !== id)
    
    if (filteredWidgets.length === initialLength) return false
    
    await this.saveWidgets(filteredWidgets)
    return true
  }
}

// Export singleton instance
export const storageService: StorageService = new LocalStorageService()

// Mock API service (for demonstration of how easy it would be to swap)
export class ApiStorageService implements StorageService {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  async getWidgets(): Promise<TextWidget[]> {
    const response = await fetch(`${this.baseUrl}/widgets`)
    return response.json()
  }

  async saveWidgets(widgets: TextWidget[]): Promise<void> {
    await fetch(`${this.baseUrl}/widgets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widgets)
    })
  }

  async addWidget(widget: TextWidget): Promise<TextWidget> {
    const response = await fetch(`${this.baseUrl}/widgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(widget)
    })
    return response.json()
  }

  async updateWidget(id: string, content: string): Promise<TextWidget | null> {
    const response = await fetch(`${this.baseUrl}/widgets/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    })
    return response.ok ? response.json() : null
  }

  async deleteWidget(id: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/widgets/${id}`, {
      method: 'DELETE'
    })
    return response.ok
  }
} 