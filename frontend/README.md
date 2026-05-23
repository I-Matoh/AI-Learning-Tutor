# AI Learning Tutor - Frontend

Web application built with React, TypeScript, and Vite.

## Features

- AI-powered course generation through authenticated backend APIs
- Progressive lesson unlocking with quiz-based assessments
- Responsive design with Tailwind CSS
- Light/Dark theme support
- DB-primary course persistence with browser cache fallback

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_API_BASE_URL

# Start development server
npm run dev
```

## Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # Run TypeScript type checking
```

## Project Structure

```text
frontend/
|-- src/
|   |-- components/     # React components
|   |   |-- AuthShell.tsx
|   |   |-- MarkdownRenderer.tsx
|   |   |-- SyncStatus.tsx
|   |   `-- icons.tsx
|   |-- services/       # API and persistence services
|   |   |-- apiService.ts
|   |   `-- progressService.ts
|   |-- lib/            # Utilities
|   |   `-- supabaseClient.ts
|   |-- types/          # TypeScript types
|   |   `-- index.ts
|   |-- App.tsx         # Main application (to be further modularized)
|   `-- index.tsx       # Entry point
|-- public/             # Static assets
|-- index.html          # HTML template
|-- vite.config.ts      # Vite configuration
|-- tsconfig.json       # TypeScript configuration
`-- package.json
```

## Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_API_BASE_URL` - Backend API origin

## Security Notes

- Model-provider keys are server-only and never shipped to the browser.
- Frontend calls backend generation endpoints with user auth tokens.
- Supabase anon key is public and safe to expose.
