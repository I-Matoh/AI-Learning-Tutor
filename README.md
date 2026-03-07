# AI-Learning-Tutor
Personalized AI tutor for anything!

## Setup
1. Install dependencies:
   `npm install`
2. Create your env file:
   `Copy-Item .env.example .env`
3. Open `.env` and set:
   `VITE_GROQ_API_KEY=...`
   `VITE_SUPABASE_URL=...`
   `VITE_SUPABASE_ANON_KEY=...`
   `VITE_API_BASE_URL=http://localhost:4000`
4. (Optional) choose one model for all tasks:
   `VITE_GROQ_MODEL=llama-3.3-70b-versatile`
5. (Optional) override models by task:
   `VITE_GROQ_MODEL_COURSE=...`
   `VITE_GROQ_MODEL_LESSON=...`
   `VITE_GROQ_MODEL_QUIZ=...`
6. Start the app:
   `npm run dev`

## Integrated Projects
This repository now includes:
- `web` app at root (Vite + React)
- `mobile/` app (Expo + React Native + Supabase Auth)
- `server/` API (Express + Supabase JWT verification)

## Mobile Setup (Expo)
1. Install mobile dependencies:
   `npm --prefix mobile install`
2. Create mobile env file:
   `Copy-Item mobile/.env.example mobile/.env`
3. Set:
   `EXPO_PUBLIC_SUPABASE_URL=...`
   `EXPO_PUBLIC_SUPABASE_ANON_KEY=...`
4. Run mobile app:
   `npm run mobile:start`

## Server Setup (Express)
1. Install server dependencies:
   `npm --prefix server install`
2. Create server env file:
   `Copy-Item server/.env.example server/.env`
3. Set:
   `SUPABASE_URL=...`
   `SUPABASE_SERVICE_ROLE_KEY=...`
   `SUPABASE_JWT_SECRET=...`
4. Run server:
   `npm run server:dev`

## Web Auth + Protected API
- The root web app now uses Supabase Auth (signup/login/logout) before loading the tutor UI.
- Web session is persisted by Supabase in browser storage.
- After login, use the `Profile` button (top-right) to call protected backend route:
  - `GET /api/profile`
  - Header: `Authorization: Bearer <supabase_access_token>`
