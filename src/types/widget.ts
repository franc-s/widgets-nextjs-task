export interface TextWidget {
  id: string
  content: string
  createdAt: Date
  updatedAt: Date
}

export interface WidgetValidation {
  isValid: boolean
  errors: string[]
  characterCount: number
}

export type WidgetAction = 
  | { type: 'ADD_WIDGET' }
  | { type: 'UPDATE_WIDGET'; id: string; content: string }
  | { type: 'DELETE_WIDGET'; id: string }
  | { type: 'LOAD_WIDGETS'; widgets: TextWidget[] } 