/**
 * Analytics System
 * Tracks user behavior, errors, and business metrics
 */

type AnalyticsEvent = 
  | 'widget_created'
  | 'widget_updated' 
  | 'widget_deleted'
  | 'widget_validation_failed'
  | 'storage_error'
  | 'storage_recovery'
  | 'user_session_started'
  | 'performance_metric'
  | 'error_occurred'

interface AnalyticsContext {
  userId?: string | null
  sessionId?: string
  widgetId?: string
  errorType?: string
  errorMessage?: string
  recoveryAction?: string
  performanceMetric?: {
    name: string
    value: number
    unit: string
  }
  [key: string]: unknown
}

interface AnalyticsPayload {
  event: AnalyticsEvent
  context: AnalyticsContext
  timestamp: string
  environment: string
  userAgent: string
  url: string
}

class Analytics {
  private sessionId: string
  private userId: string | null
  private environment: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = this.getUserId()
    this.environment = process.env.NODE_ENV || 'development'
    
    // Track session start
    this.track('user_session_started', {
      sessionId: this.sessionId,
      timestamp: new Date().toISOString()
    })
  }

  private generateSessionId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private getUserId(): string | null {
    // In a real app, get from auth context or localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('userId') || `anonymous_${this.sessionId}`
    }
    return null
  }

  private createPayload(event: AnalyticsEvent, context: AnalyticsContext): AnalyticsPayload {
    return {
      event,
      context: {
        ...context,
        sessionId: this.sessionId,
        userId: this.userId
      },
      timestamp: new Date().toISOString(),
      environment: this.environment,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    }
  }

  private sendToAnalytics(payload: AnalyticsPayload): void {
    // In production, send to analytics platforms
    // e.g., Google Analytics, Mixpanel, Amplitude, PostHog
    if (this.environment === 'production') {
      // Example implementations:
      // - Google Analytics: gtag('event', payload.event, payload.context)
      // - Mixpanel: mixpanel.track(payload.event, payload.context)
      // - Custom API: fetch('/api/analytics', { method: 'POST', body: JSON.stringify(payload) })
    }

    // Development logging
    if (this.environment === 'development') {
      console.group('📊 Analytics Event')
      console.log('Event:', payload.event)
      console.log('Context:', payload.context)
      console.log('Timestamp:', payload.timestamp)
      console.groupEnd()
    }
  }

  track(event: AnalyticsEvent, context: AnalyticsContext = {}): void {
    const payload = this.createPayload(event, context)
    this.sendToAnalytics(payload)
  }

  // Business-specific tracking methods
  trackWidgetCreated(widgetId: string): void {
    this.track('widget_created', { widgetId })
  }

  trackWidgetUpdated(widgetId: string, contentLength: number): void {
    this.track('widget_updated', { 
      widgetId, 
      contentLength,
      category: 'user_interaction'
    })
  }

  trackWidgetDeleted(widgetId: string): void {
    this.track('widget_deleted', { widgetId })
  }

  trackValidationFailure(widgetId: string, validationErrors: string[]): void {
    this.track('widget_validation_failed', {
      widgetId,
      errorCount: validationErrors.length,
      errors: validationErrors
    })
  }

  trackStorageError(operation: string, errorMessage: string): void {
    this.track('storage_error', {
      operation,
      errorMessage,
      errorType: 'storage_failure'
    })
  }

  trackStorageRecovery(recoveryAction: string, success: boolean): void {
    this.track('storage_recovery', {
      recoveryAction,
      success,
      category: 'error_recovery'
    })
  }

  trackPerformance(metricName: string, value: number, unit: string = 'ms'): void {
    this.track('performance_metric', {
      performanceMetric: {
        name: metricName,
        value,
        unit
      }
    })
  }

  trackError(error: Error, context: Record<string, unknown> = {}): void {
    this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: error.name,
      ...context
    })
  }
}

// Export singleton instance
export const analytics = new Analytics()

// Convenience functions
export const trackBug = (error: Error, context?: Record<string, unknown>) => {
  analytics.trackError(error, { ...context, severity: 'bug' })
}

export const trackUserAction = (action: string, details?: Record<string, unknown>) => {
  analytics.track('user_session_started', { 
    action, 
    ...details, 
    category: 'user_behavior' 
  })
}

export const trackBusinessMetric = (metricName: string, value: number) => {
  analytics.trackPerformance(metricName, value, 'count')
}

// Performance tracking utilities
export const measurePerformance = async <T>(
  operation: string, 
  asyncFn: () => Promise<T>
): Promise<T> => {
  const start = performance.now()
  try {
    const result = await asyncFn()
    const duration = performance.now() - start
    analytics.trackPerformance(operation, duration)
    return result
  } catch (error) {
    const duration = performance.now() - start
    analytics.trackPerformance(`${operation}_failed`, duration)
    analytics.trackError(error instanceof Error ? error : new Error(String(error)), { operation })
    throw error
  }
} 