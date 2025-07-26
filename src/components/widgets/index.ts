/**
 * Widget Components Module
 * 
 * This module demonstrates clean component architecture with separation of concerns:
 * 
 * Architecture Pattern:
 * - Container/Presentation Pattern: Smart containers manage state, presentation components handle UI
 * - Composition over Inheritance: Components are composed of smaller, focused components
 * - Single Responsibility: Each component has one clear purpose
 * 
 * Component Hierarchy:
 * ├── WidgetContainer (Smart) - Orchestrates widget functionality
 * │   ├── WidgetHeader (Presentation) - Displays metadata and actions
 * │   ├── WidgetContent (Smart) - Manages content editing
 * │   │   ├── WidgetTextArea (Presentation) - Pure textarea component
 * │   │   └── WidgetValidationDisplay (Presentation) - Error messages
 * │   └── WidgetFooter (Presentation) - Character count and status
 * └── useWidgetState (Hook) - Encapsulates business logic
 * 
 * Benefits:
 * - Easy to test (presentation components are pure functions)
 * - Reusable (components can be used in different contexts)
 * - Maintainable (clear separation of concerns)
 * - Scalable (easy to add new features without affecting others)
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