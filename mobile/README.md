# AI Learning Tutor - Mobile App

React Native mobile application built with Expo.

## Features

- Supabase authentication (login/signup)
- Native mobile experience
- Cross-platform support (iOS & Android)

## Setup

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your credentials in .env:
# - EXPO_PUBLIC_SUPABASE_URL
# - EXPO_PUBLIC_SUPABASE_ANON_KEY

# Start development server
npm start
```

## Scripts

```bash
npm start         # Start Expo development server
npm run android   # Open Android build
npm run ios       # Open iOS build
npm run web       # Run as web app
```

## Project Structure

```
mobile/
├── App.js                 # App entry point
├── package.json
├── .env.example          # Environment template
├── components/
│   └── AuthForm.js      # Reusable auth form
├── lib/
│   └── supabaseClient.js # Supabase client
├── navigation/
│   ├── AppNavigator.js   # Main app stack
│   └── AuthNavigator.js  # Auth flow stack
└── screens/
    ├── HomeScreen.js    # Home after login
    ├── LoginScreen.js   # Login page
    └── SignupScreen.js  # Signup page
```

## Environment Variables

**Required:**
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Building

```bash
# Generate native Android project
npx expo prebuild --platform android

# Generate native iOS project
npx expo prebuild --platform ios

# Build APK (Android)
eas build -p android

# Build iOS (requires Apple Developer account)
eas build -p ios
```

## Notes

- Uses AsyncStorage for session persistence
- Authentication state syncs with Supabase
- Navigation handled by React Navigation
