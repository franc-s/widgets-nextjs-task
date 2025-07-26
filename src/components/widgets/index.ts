/**
 * Widget Components Module
 * 
 * Component Hierarchy:
 * ├── WidgetContainer - Main widget component
 * │   ├── WidgetHeader - Displays metadata and actions
 * │   ├── WidgetContent - Manages content editing
 * │   │   ├── WidgetTextArea - Text input component
 * │   │   └── WidgetValidationDisplay - Error messages
 * │   └── WidgetFooter - Character count and status
 * └── useWidgetState - Widget state management
 */

// Main container component
export { WidgetContainer } from './WidgetContainer'

// Presentation components
export { WidgetHeader } from './WidgetHeader'
export { WidgetContent } from './WidgetContent'
export { WidgetTextArea } from './WidgetTextArea'
export { WidgetValidationDisplay } from './WidgetValidationDisplay'
export { WidgetFooter } from './WidgetFooter'

// Custom hooks
export { useWidgetState } from './hooks/useWidgetState'

// Re-export for backward compatibility and convenience
export { WidgetContainer as TextWidget } from './WidgetContainer' 