# AI Learning Tutor - Frontend

Web application built with React, TypeScript, and Vite.

## Features

- AI-powered course generation using Groq API
- Progressive lesson unlocking with quiz-based assessments
- Responsive design with Tailwind CSS
- Light/Dark theme support
- Course persistence in browser storage

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env:
# - VITE_SUPABASE_URL
# - VITE_SUPABASE_ANON_KEY
# - VITE_GROQ_API_KEY

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

```
frontend/
├── src/
│   ├── components/     # React components
│   │   ├── AuthShell.tsx
│   │   ├── MarkdownRenderer.tsx
│   │   └── icons.tsx
│   ├── services/       # API services
│   │   └── groqService.ts
│   ├── lib/            # Utilities
│   │   └── supabaseClient.ts
│   ├── types/          # TypeScript types
│   │   └── index.ts
│   ├── App.tsx         # Main application
│   └── index.tsx       # Entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tsconfig.json       # TypeScript configuration
└── package.json
```

## Environment Variables

See `.env.example` for all configuration options.

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_GROQ_API_KEY` - Groq API key

**Optional:**
- `VITE_GROQ_MODEL` - Default AI model
- `VITE_GROQ_DAILY_LIMIT` - Daily generation limit (default: 5)

## Security Notes

- API keys in frontend are visible to users (acceptable for Groq with client-side rate limiting)
- For production, consider calling AI APIs from your backend server
- Supabase anon key is public and safe to expose
