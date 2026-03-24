# AI Learning Tutor

Personalized AI-powered learning platform that generates custom curriculums, lessons, and quizzes based on user learning goals.

## Project Structure

```
AI-Learning-Tutor/
├── frontend/              # Web application (React + TypeScript + Vite)
├── server/               # Backend API (Express.js)
├── mobile/               # Mobile app (Expo + React Native)
└── docs/                 # Documentation
    └── SECURITY.md       # Security documentation
```

## Quick Start

### 1. Frontend (Web App)

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 2. Backend API (Optional)

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

### 3. Mobile App

```bash
cd mobile
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                    (React + TypeScript)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐│
│  │  Onboarding  │  │  Dashboard   │  │      QuizModal        ││
│  └──────────────┘  └──────────────┘  └───────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Groq API (AI Content)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│               Supabase (Auth + Session Management)                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Backend API                                │
│            (Express.js + JWT + Security Headers)                 │
└─────────────────────────────────────────────────────────────────┘
```

## Features

| Feature | Frontend | Backend | Mobile |
|---------|----------|---------|--------|
| AI Course Generation | ✓ | - | - |
| AI Lesson Content | ✓ | - | - |
| AI Quiz Generation | ✓ | - | - |
| Supabase Auth | ✓ | ✓ | ✓ |
| JWT Verification | - | ✓ | - |
| Rate Limiting | ✓ (client) | ✓ | - |
| Security Headers | - | ✓ | - |
| Responsive Design | ✓ | - | - |

## Documentation

- [Frontend README](frontend/README.md)
- [Server README](server/README.md)
- [Mobile README](mobile/README.md)
- [Security Documentation](docs/SECURITY.md)

## Environment Variables

### Frontend (`.env`)

```bash
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GROQ_API_KEY=gsk_xxx
VITE_API_BASE_URL=http://localhost:4000
```

### Server (`.env`)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_JWT_SECRET=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
PORT=4000
NODE_ENV=development
```

### Mobile (`.env`)

```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

## Scripts

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
npm run typecheck    # TypeScript checking
```

### Backend
```bash
npm run dev         # Start with nodemon
npm start           # Production start
```

### Mobile
```bash
npm start           # Start Expo
npm run android     # Android build
npm run ios         # iOS build
```

## License

MIT
