# VISUAL Samco Client

React-based client application for Samco Machinery's VISUAL system, providing interfaces for Sales, Inventory, and Engineering modules.

## Tech Stack

- React 19
- Vite
- React Router
- TanStack Table
- Radix UI
- Tailwind CSS
- Lucide Icons

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint
```

## Project Structure

```
src/
  components/   # Shared UI components
    layout/     # App shell and layout components
    ui/         # Reusable UI primitives
  modules/      # Feature modules
    sales/      # Sales module
    inventory/  # Inventory module
    engineering/# Engineering module
  services/     # API services
  store/        # Application state management
  data/         # Static data and constants
  lib/          # Utility functions
```

## Docker

Build and run with Docker:

```bash
docker build -t visual-client .
docker run -p 80:80 visual-client
```
