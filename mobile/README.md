# NextLevel Coaching Mobile App

This is the mobile application for NextLevel Coaching, built with React Native and Expo.

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Expo CLI (`npm install -g @expo/cli`)

### Installation

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm start
```

3. Open the app on your device:
   - Install Expo Go app on your phone
   - Scan the QR code from the terminal
   - Or use an emulator (iOS Simulator/Android Studio)

## Project Structure

```
mobile/
├── App.tsx          # Main app component
├── app.json         # Expo configuration
├── package.json     # Dependencies and scripts
└── README.md        # This file
```

## Features

- Dark theme matching the web app
- Cross-platform (iOS & Android)
- Built with Expo for easy deployment

## Development

- `pnpm start` - Start the development server
- `pnpm android` - Run on Android
- `pnpm ios` - Run on iOS
- `pnpm web` - Run on web

## Building for Production

- `pnpm build:android` - Build Android APK
- `pnpm build:ios` - Build iOS app


