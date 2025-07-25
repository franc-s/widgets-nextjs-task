import { TextWidget } from '@/types/widget'

const STORAGE_KEY = 'text-widgets'
const STORAGE_BACKUP_KEY = 'text-widgets-backup'
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB limit

// Storage error types
export class StorageError extends Error {
  constructor(message: string, public code: string, public recoverable: boolean = true) {
    super(message)
    this.name = 'StorageError'
  }
}

// Input sanitization
function sanitizeContent(content: string): string {
  if (typeof content !== 'string') {
    throw new StorageError('Content must be a string', 'INVALID_TYPE', false)
  }
  
  // Remove potentially dangerous characters and normalize
  return content
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 5000) // Enforce character limit
}

// Check if localStorage is available and functional
function isStorageAvailable(): boolean {
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

// Check storage quota
function checkStorageQuota(dataSize: number): boolean {
  try {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      // Modern storage API (if available)
      navigator.storage.estimate().then(estimate => {
        const used = estimate.usage || 0
        const quota = estimate.quota || 0
        console.debug('Storage usage:', { used, quota, available: quota - used })
      })
    }
    
    // Fallback: Check against our defined limit
    return dataSize < MAX_STORAGE_SIZE
  } catch {
    return dataSize < MAX_STORAGE_SIZE
  }
}

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private validateWidget(widget: any): widget is TextWidget {
    return (
      widget &&
      typeof widget === 'object' &&
      typeof widget.id === 'string' &&
      typeof widget.content === 'string' &&
      widget.createdAt &&
      widget.updatedAt
    )
  }

  private createBackup(widgets: TextWidget[]): void {
    try {
      if (isStorageAvailable()) {
        localStorage.setItem(STORAGE_BACKUP_KEY, JSON.stringify({
          widgets,
          timestamp: new Date().toISOString(),
          version: '1.0'
        }))
      }
    } catch (error) {
      console.warn('Failed to create backup:', error)
      // Backup failure is not critical, continue operation
    }
  }

  private attemptRecovery(): TextWidget[] {
    try {
      const backup = localStorage.getItem(STORAGE_BACKUP_KEY)
      if (backup) {
        const parsed = JSON.parse(backup)
        if (parsed.widgets && Array.isArray(parsed.widgets)) {
          console.info('Recovered widgets from backup:', parsed.timestamp)
          return this.parseStoredWidgets(JSON.stringify(parsed.widgets))
        }
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error)
    }
    return []
  }

  private parseStoredWidgets(stored: string | null): TextWidget[] {
    if (!stored) return []
    
    try {
      const parsed = JSON.parse(stored)
      
      if (!Array.isArray(parsed)) {
        throw new StorageError('Stored data is not an array', 'INVALID_FORMAT')
      }
      
      const validWidgets: TextWidget[] = []
      const invalidCount = parsed.length
      
      for (const widget of parsed) {
        if (this.validateWidget(widget)) {
          validWidgets.push({
            ...widget,
            content: sanitizeContent(widget.content),
            createdAt: new Date(widget.createdAt),
            updatedAt: new Date(widget.updatedAt)
          })
        } else {
          console.warn('Invalid widget found and skipped:', widget)
        }
      }
      
      if (validWidgets.length < invalidCount) {
        console.warn(`Recovered ${validWidgets.length}/${invalidCount} widgets`)
      }
      
      return validWidgets
    } catch (error) {
      console.error('Failed to parse stored widgets:', error)
      
      // Attempt recovery from backup
      const recovered = this.attemptRecovery()
      if (recovered.length > 0) {
        return recovered
      }
      
      throw new StorageError(
        'Failed to parse stored data and no backup available',
        'PARSE_ERROR',
        false
      )
    }
  }

  async getWidgets(): Promise<TextWidget[]> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!isStorageAvailable()) {
            throw new StorageError('localStorage is not available', 'STORAGE_UNAVAILABLE')
          }
          
          const stored = localStorage.getItem(STORAGE_KEY)
          const widgets = this.parseStoredWidgets(stored)
          resolve(widgets)
        } catch (error) {
          if (error instanceof StorageError && !error.recoverable) {
            reject(error)
          } else {
            // Return empty array for recoverable errors
            console.warn('Failed to load widgets, returning empty array:', error)
            resolve([])
          }
        }
      }, 10)
    })
  }

  async saveWidgets(widgets: TextWidget[]): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!isStorageAvailable()) {
            throw new StorageError('localStorage is not available', 'STORAGE_UNAVAILABLE', false)
          }

          if (!Array.isArray(widgets)) {
            throw new StorageError('Widgets must be an array', 'INVALID_INPUT', false)
          }

          // Validate each widget before saving
          const validatedWidgets = widgets.map(widget => {
            if (!this.validateWidget(widget)) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const widgetId = (widget as any)?.id || 'unknown'
              throw new StorageError(`Invalid widget: ${widgetId}`, 'INVALID_WIDGET', false)
            }
            return {
              ...widget,
              content: sanitizeContent(widget.content)
            }
          })

          const dataStr = JSON.stringify(validatedWidgets)
          const dataSize = new Blob([dataStr]).size

          if (!checkStorageQuota(dataSize)) {
            throw new StorageError('Storage quota exceeded', 'QUOTA_EXCEEDED')
          }

          // Create backup before saving
          this.createBackup(validatedWidgets)

          // Save to localStorage
          localStorage.setItem(STORAGE_KEY, dataStr)
          resolve()
        } catch (error) {
          if (error instanceof StorageError) {
            reject(error)
          } else {
            reject(new StorageError(`Failed to save widgets: ${error}`, 'SAVE_ERROR'))
          }
        }
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
    try {
      if (!id || typeof id !== 'string') {
        throw new StorageError('Widget ID must be a non-empty string', 'INVALID_ID', false)
      }

      if (typeof content !== 'string') {
        throw new StorageError('Content must be a string', 'INVALID_CONTENT', false)
      }

      const sanitizedContent = sanitizeContent(content)
      const widgets = await this.getWidgets()
      const widgetIndex = widgets.findIndex(w => w.id === id)
      
      if (widgetIndex === -1) {
        console.warn(`Widget not found for update: ${id}`)
        return null
      }
      
      widgets[widgetIndex] = {
        ...widgets[widgetIndex],
        content: sanitizedContent,
        updatedAt: new Date()
      }
      
      await this.saveWidgets(widgets)
      return widgets[widgetIndex]
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(`Failed to update widget: ${error}`, 'UPDATE_ERROR')
    }
  }

  async deleteWidget(id: string): Promise<boolean> {
    try {
      if (!id || typeof id !== 'string') {
        throw new StorageError('Widget ID must be a non-empty string', 'INVALID_ID', false)
      }

      const widgets = await this.getWidgets()
      const initialLength = widgets.length
      const widgetToDelete = widgets.find(w => w.id === id)
      
      if (!widgetToDelete) {
        console.warn(`Widget not found for deletion: ${id}`)
        return false
      }

      const filteredWidgets = widgets.filter(w => w.id !== id)
      
      if (filteredWidgets.length === initialLength) {
        return false
      }
      
      await this.saveWidgets(filteredWidgets)
      console.info(`Widget deleted: ${id}`)
      return true
    } catch (error) {
      if (error instanceof StorageError) {
        throw error
      }
      throw new StorageError(`Failed to delete widget: ${error}`, 'DELETE_ERROR')
    }
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