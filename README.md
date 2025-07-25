# Text Widget Manager

A responsive text widget management app with auto-save, real-time validation, and persistent storage.

## Features

- **Multi-Widget Management**: Add/delete unlimited text widgets
- **Auto-Save**: Debounced saving (500ms) as you type
- **Real-time Validation**: Character count with visual feedback (5,000 char limit)
- **Persistent Storage**: localStorage with easy API swap capability
- **Responsive Design**: Mobile-friendly with full accessibility
- **Type Safety**: Built with TypeScript

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** with strict mode
- **Tailwind CSS** for styling
- **React Query** for state management
- **Zod** for validation
- **Jest + RTL** for testing

## Quick Start

```bash
# Install and run
npm install
npm run dev
# Open http://localhost:3000

# Docker (optional)
docker build -t text-widget-manager .
docker run -p 3000:3000 text-widget-manager

# Testing
npm test
npm run test:coverage
```

## Architecture

### Storage Abstraction
```typescript
// Current: localStorage
export const storageService = new LocalStorageService()

// Easy API swap:
// export const storageService = new ApiStorageService()
```

### Key Components
- **TextWidget**: Individual widget with validation and controls
- **useWidgets**: React Query hook for state management
- **StorageService**: Abstracted storage interface

## Project Structure

```
src/
├── app/                 # Next.js App Router
├── components/          # React components + tests
├── hooks/              # Custom hooks (useWidgets)
├── lib/                # Storage, validation, utils
└── types/              # TypeScript definitions
```

## Tradeoffs

### Chosen Approaches
- **localStorage over API**: Simpler for MVP, easy to swap later
- **React Query over Redux**: Better async handling, simpler setup
- **Debounced auto-save**: Balance between UX and performance
- **Character limit (5k)**: Prevents performance issues with large text

### Alternative Considerations
- **IndexedDB**: More storage but complex API for simple text
- **Real-time sync**: Overkill for single-user MVP
- **Rich text editor**: Would complicate validation and storage
- **Server-side storage**: Adds backend complexity for demo

## What I'd Do With More Time

- Rich text editing with markdown support
- Drag & drop widget reordering and templates
- Export/import functionality and search/filtering
- Real-time collaboration with WebSockets
- Offline support with service workers
- Full backend API with authentication
- Performance analytics and comprehensive monitoring

## Testing

- **Coverage**: 80% minimum requirement
- **Types**: Unit, integration, and component tests
- **Commands**: `npm test`, `npm run test:watch`, `npm run test:coverage`

## Browser Support

Modern browsers (Chrome 90+, Firefox 90+, Safari 14+, Edge 90+) with localStorage support.

---

**Built for the Trumpet Technical Challenge**
