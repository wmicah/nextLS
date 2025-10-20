# NextLevel Coaching Mobile App Setup

This mobile app integrates with your existing NextLevel Coaching web application using Kinde authentication.

## Prerequisites

1. **Expo CLI**: Install globally with `npm install -g @expo/cli`
2. **Expo Go App**: Install on your phone from App Store/Google Play
3. **Kinde Account**: Your existing Kinde setup from the web app

## Configuration

### 1. Update Kinde Configuration

Edit `src/config/kinde.ts` with your actual Kinde settings:

```typescript
export const KINDE_CONFIG = {
  domain: "https://nextlevelsoftball.kinde.com",
  clientId: "8d0e263fd6854a39925924234f7f6766",
  redirectUri: "https://nxlvlcoach.com/auth/mobile-callback", // Redirects through your domain
  scopes: ["openid", "profile", "email"],
};
```

✅ **Already configured with your actual Kinde settings!**

### 2. Configure Kinde Dashboard

In your Kinde dashboard:

1. Go to **Settings > Applications > [Your App] > View details**
2. Add these callback URLs:

   - **Allowed callback URLs**: `https://nxlvlcoach.com/auth/mobile-callback`
   - **Allowed logout redirect URLs**: `https://nxlvlcoach.com/auth/mobile-callback`

### 3. For Production

When ready for production:

1. Update `redirectUri` in `src/config/kinde.ts` to your app's custom scheme:

   ```typescript
   redirectUri: 'yourapp://auth/callback',
   ```

2. Configure deep linking in your app:
   - **iOS**: Update `Info.plist` with your custom scheme
   - **Android**: Update `AndroidManifest.xml` with your custom scheme

## Running the App

### Development

1. **Start the development server**:

   ```bash
   pnpm start
   ```

2. **Scan the QR code** with Expo Go app on your phone

3. **Test authentication**:
   - Tap "Sign In with Kinde"
   - You'll be redirected to your browser
   - Sign in with your existing Kinde account
   - You'll be redirected back to the app

### Features

- ✅ **Kinde Authentication**: Uses your existing web app's authentication
- ✅ **Responsive Design**: Matches your web app's mobile views
- ✅ **Navigation**: Bottom tab navigation like your web app
- ✅ **User Profile**: Shows authenticated user information
- ✅ **Logout**: Properly signs out from Kinde

## App Structure

```
mobile/
├── src/
│   ├── config/
│   │   └── kinde.ts          # Kinde configuration
│   ├── contexts/
│   │   └── AuthContext.tsx    # Authentication context
│   ├── services/
│   │   └── AuthService.ts     # Kinde authentication service
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation setup
│   └── screens/
│       ├── auth/
│       │   └── LoginScreen.tsx # Kinde login screen
│       ├── dashboard/
│       ├── programs/
│       ├── videos/
│       ├── messages/
│       └── profile/
```

## Next Steps

1. **Connect to your API**: Add tRPC client to connect to your web app's API
2. **Add real data**: Replace mock data with actual API calls
3. **Customize UI**: Adapt the screens to match your web app's mobile components
4. **Add features**: Implement specific mobile features like push notifications

## Troubleshooting

### Authentication Issues

- **Check Kinde configuration**: Ensure domain and client ID are correct
- **Check callback URLs**: Make sure they match in Kinde dashboard
- **Check network**: Ensure your phone can access the internet

### Development Issues

- **Clear Expo cache**: Run `expo start --clear`
- **Restart Metro**: Press `r` in the terminal
- **Check logs**: Look at the terminal output for errors

## Support

For issues with:

- **Kinde**: Check [Kinde documentation](https://docs.kinde.com)
- **Expo**: Check [Expo documentation](https://docs.expo.dev)
- **React Native**: Check [React Native documentation](https://reactnative.dev)
