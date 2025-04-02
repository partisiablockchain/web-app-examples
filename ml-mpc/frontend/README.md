# ML-MPC Frontend

A modern Next.js application that provides a user interface for interacting with the privacy-preserving machine learning system.

## Overview

The frontend application:

- Provides a secure interface for model interaction
- Handles data encryption and MPC protocol communication
- Displays results in a user-friendly manner
- Manages user authentication and authorization

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- Zod for validation
- React Context for state management
- Server Actions for API communication

## Project Structure

```
frontend/
├── app/              # Next.js app directory
│   ├── actions/     # Server actions
│   ├── components/  # React components
│   ├── hooks/      # Custom hooks
│   └── lib/        # Utilities
├── components/      # Shared components
├── styles/         # Global styles
└── public/         # Static assets
```

## Prerequisites

- Node.js 18+
- npm or yarn
- Partisia Blockchain credentials

## Setup

1. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

2. Configure environment variables:

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

## Key Features

### Privacy-First Design

- Client-side data encryption
- Secure communication with smart contracts
- No sensitive data storage

### User Interface

- Modern, responsive design
- Real-time feedback
- Error handling and validation
- Loading states and animations

### State Management

- React Context for global state
- Custom hooks for business logic
- Server Actions for API calls

## Integration with MPC System

1. **Data Input**

   - Secure form handling
   - Input validation with Zod
   - Client-side encryption

2. **MPC Communication**

   - Integration with smart contracts
   - Protocol coordination
   - Result handling

3. **Result Display**
   - Secure result rendering
   - Visualization components
   - Export functionality

## Development Guidelines

1. **Component Structure**

   - Keep components small and focused
   - Use TypeScript for type safety
   - Follow shadcn/ui patterns

2. **State Management**

   - Use Context for global state
   - Implement custom hooks for logic
   - Keep state updates atomic

3. **API Integration**
   - Use Server Actions for API calls
   - Implement proper error handling
   - Cache responses when appropriate

## Testing

1. Run unit tests:

   ```bash
   npm run test
   ```

2. Run type checking:
   ```bash
   npm run type-check
   ```

## Deployment

1. Build the application:

   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm run start
   ```

## Security Considerations

- Implement proper authentication
- Use HTTPS for all communications
- Follow security best practices
- Regular security audits

## Troubleshooting

Common issues and solutions:

1. Build errors: Check TypeScript types
2. Runtime errors: Verify environment variables
3. Performance issues: Optimize bundle size
4. Integration errors: Check contract connection

## Contributing

Please refer to the main project README for contribution guidelines.
