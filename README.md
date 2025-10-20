# NextLevel Coaching Platform

A comprehensive coaching platform with both web and mobile applications.

## Project Structure

```
nextLS/
├── src/                    # Next.js web application
│   ├── app/               # App Router pages and API routes
│   ├── components/        # React components
│   ├── lib/              # Utility functions and libraries
│   └── trpc/             # tRPC API setup
├── mobile/               # React Native mobile application
│   ├── App.tsx           # Main mobile app component
│   ├── package.json      # Mobile app dependencies
│   └── app.json          # Expo configuration
├── prisma/               # Database schema and migrations
├── public/               # Static assets
└── scripts/              # Utility scripts
```

## Getting Started

### Web Application

1. Install dependencies:

```bash
pnpm install
```

2. Start the development server:

```bash
pnpm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

### Mobile Application

1. Navigate to the mobile directory:

```bash
cd mobile
```

2. Install dependencies:

```bash
pnpm install
```

3. Start the development server:

```bash
pnpm start
```

4. Open the app on your device using Expo Go

## Features

### Web App

- Next.js 15 with App Router
- TypeScript
- Tailwind CSS
- tRPC for type-safe APIs
- Prisma ORM
- Kinde Auth
- Real-time messaging
- Video upload and processing
- Analytics dashboard

### Mobile App

- React Native with Expo
- Cross-platform (iOS & Android)
- Dark theme
- Native performance

## Development

- **Web**: `pnpm run dev`
- **Mobile**: `cd mobile && pnpm start`
- **Build**: `pnpm run build`
- **Test**: `pnpm run test`

## Deployment

- **Web**: Deploy to Vercel
- **Mobile**: Build with Expo Application Services (EAS)

## Documentation

See the individual README files in each directory for more detailed information.
