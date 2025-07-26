
type LogLevel = 'debug' | 'info' | 'warn' | 'error'
type LogContext = Record<string, unknown>

interface LogEvent {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: string
  sessionId: string
  environment: string
}

class Logger {
  private sessionId: string
  private environment: string

  constructor() {
    this.sessionId = this.generateSessionId()
    this.environment = process.env.NODE_ENV || 'development'
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private createLogEvent(level: LogLevel, message: string, context?: LogContext): LogEvent {
    return {
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      environment: this.environment
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    }

    const minLevel = this.environment === 'production' ? 1 : 0
    return levels[level] >= minLevel
  }

  private sendToObservability(_logEvent: LogEvent): void {
    // In production, send to observability platforms
    // e.g., DataDog, New Relic, Sentry, CloudWatch
    if (this.environment === 'production') {
      // Example: send to external service
      // fetch('/api/logs', { method: 'POST', body: JSON.stringify(logEvent) })
    }
  }

  private formatForConsole(logEvent: LogEvent): void {
    const { level, message, context } = logEvent
    const prefix = `[${level.toUpperCase()}] ${logEvent.timestamp}`

    switch (level) {
      case 'debug':
        console.debug(prefix, message, context || '')
        break
      case 'info':
        console.info(prefix, message, context || '')
        break
      case 'warn':
        console.warn(prefix, message, context || '')
        break
      case 'error':
        console.error(prefix, message, context || '')
        break
    }
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog('debug')) return
    
    const logEvent = this.createLogEvent('debug', message, context)
    this.formatForConsole(logEvent)
    this.sendToObservability(logEvent)
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog('info')) return
    
    const logEvent = this.createLogEvent('info', message, context)
    this.formatForConsole(logEvent)
    this.sendToObservability(logEvent)
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog('warn')) return
    
    const logEvent = this.createLogEvent('warn', message, context)
    this.formatForConsole(logEvent)
    this.sendToObservability(logEvent)
  }

  error(message: string, context?: LogContext): void {
    if (!this.shouldLog('error')) return
    
    const logEvent = this.createLogEvent('error', message, context)
    this.formatForConsole(logEvent)
    this.sendToObservability(logEvent)
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience functions
export const logStorageOperation = (operation: string, success: boolean, context?: LogContext) => {
  if (success) {
    logger.info(`Storage operation successful: ${operation}`, context)
  } else {
    logger.error(`Storage operation failed: ${operation}`, context)
  }
}

export const logWidgetAction = (action: string, widgetId: string, context?: LogContext) => {
  logger.info(`Widget action: ${action}`, { widgetId, ...context })
}

export const logValidationIssue = (issue: string, context?: LogContext) => {
  logger.warn(`Validation issue: ${issue}`, context)
}

export const logRecoveryAction = (action: string, context?: LogContext) => {
  logger.warn(`Recovery action taken: ${action}`, context)
} 