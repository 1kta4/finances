# Finance Tracker - React Native App

A personal finance tracking mobile application built with React Native, featuring local storage with SQLite and cloud backup with Supabase. The app uses a beautiful neomorphism design style with multiple theme options.

## Features

- **Authentication**: Email/password authentication with Supabase
- **Local-First Storage**: SQLite for fast, offline-capable data storage
- **Cloud Backup**: Sync your data to Supabase for backup and restore
- **Transaction Management**: Track earnings and spending with categories
- **Goals**: Set and track financial goals
- **Multiple Themes**: 4 color themes (Mint, Purple, Emerald, Light Blue) with light/dark mode
- **Neomorphism Design**: Beautiful, modern UI with soft shadows
- **Analytics**: View balance, trends, and category breakdowns

## Tech Stack

- **Framework**: React Native (Expo)
- **Language**: TypeScript
- **Local Storage**: expo-sqlite
- **Backend**: Supabase (authentication + cloud backup)
- **Navigation**: React Navigation (Bottom Tabs + Stack)
- **UI**: Custom neomorphic components
- **Charts**: react-native-chart-kit (coming soon)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Supabase account (free tier is sufficient)
- For Android: Android Studio or physical device
- For iOS: Xcode (macOS only) or physical device

**Note**: Expo CLI is NOT required - the project uses `npx expo` which comes automatically with npm.

## Setup Instructions

### 1. Supabase Setup

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Once your project is created, go to the SQL Editor
3. Copy the entire contents of `supabase-setup.sql` and paste it into the SQL Editor
4. Click "Run" to create all tables, policies, and triggers
5. Go to Settings > API to find your project URL and anon key

### 2. Environment Configuration

1. Copy the `.env.example` file to create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the App

#### Start the Development Server
```bash
npm start
```

#### Run on Android
```bash
npm run android
```

#### Run on iOS (macOS only)
```bash
npm run ios
```

#### Run on Web (for testing)
```bash
npm run web
```

## Project Structure

```
finances/
├── src/
│   ├── components/
│   │   ├── neomorphic/       # Reusable neomorphic UI components
│   │   ├── charts/            # Chart components (coming soon)
│   │   └── transactions/      # Transaction-related components
│   ├── screens/
│   │   ├── auth/             # Login and SignUp screens
│   │   ├── dashboard/        # Home screen with overview
│   │   ├── spending/         # Spending transactions list
│   │   ├── earning/          # Earning transactions list
│   │   └── settings/         # Settings and preferences
│   ├── services/
│   │   ├── supabase.ts       # Supabase client and API calls
│   │   └── storage.ts        # SQLite local database operations
│   ├── context/
│   │   ├── AuthContext.tsx   # Authentication state management
│   │   ├── ThemeContext.tsx  # Theme and styling management
│   │   └── DataContext.tsx   # Data and business logic
│   ├── utils/
│   │   ├── constants.ts      # App constants and configurations
│   │   └── helpers.ts        # Utility functions
│   ├── types/
│   │   └── index.ts          # TypeScript type definitions
│   └── navigation/
│       └── AppNavigator.tsx  # Navigation configuration
├── App.tsx                   # Main app entry point
├── supabase-setup.sql        # Database schema and setup
└── README.md                 # This file
```

## Usage Guide

### First-Time Setup

1. Launch the app
2. Create an account with your email and password
3. The app will automatically create default categories

### Adding Transactions

1. Navigate to the "Spending" or "Earning" tab
2. Tap the "+" button (FAB) at the bottom right (coming soon)
3. Fill in the transaction details:
   - Select a category
   - Enter the amount
   - Optionally add item name and description
   - Select payment method (Cash/Card)
   - Choose the date/time
4. Tap "Save"

### Setting Goals

1. Go to Settings
2. Tap on "Goals" section (coming soon)
3. Create a new goal with:
   - Title
   - Target amount
   - Current amount
   - Optional deadline
4. View your goal progress on the Dashboard

### Managing Categories

1. Go to Settings
2. Tap on "Categories"
3. Add custom categories or edit existing ones
4. Note: Default categories cannot be deleted

### Theme Customization

1. Go to Settings > Appearance
2. Toggle Dark Mode on/off
3. Select your preferred theme color (Mint, Purple, Emerald, or Light Blue)

### Backup and Restore

#### Backup to Cloud
1. Go to Settings > Data Management
2. Tap "Backup to Cloud"
3. Your data will be synced to Supabase

#### Restore from Cloud
1. Go to Settings > Data Management
2. Tap "Restore from Cloud"
3. Confirm the action (this will replace your local data)

## Default Categories

### Spending
- Food & Dining
- Transportation
- Shopping
- Bills & Utilities
- Entertainment
- Healthcare
- Education
- Other

### Earning
- Salary
- Freelance
- Investment
- Gift
- Refund
- Other

## Testing

### Testing on Android Emulator

1. Install Android Studio
2. Set up an Android Virtual Device (AVD)
3. Start the emulator
4. Run `npm run android`

### Testing on Physical Device

1. Install the Expo Go app on your device
2. Scan the QR code from `npm start`
3. The app will load on your device

## Building for Production

### Android APK

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build for Android
eas build --platform android --profile preview
```

The APK will be available for download once the build completes.

### iOS (requires Apple Developer account)

```bash
eas build --platform ios --profile preview
```

## Known Limitations / Coming Soon

- Transaction add/edit modal is not yet implemented
- Charts integration is planned but not yet complete
- Category management UI needs to be built
- Goal management UI needs to be built
- Quick re-add feature is in the data layer but not yet in UI
- Export to JSON feature is planned

## Troubleshooting

### "Module not found" errors
```bash
npm install
rm -rf node_modules
npm install
```

### SQLite errors
Make sure you're running on a physical device or emulator, not web.

### Supabase connection errors
- Check your `.env` file has the correct credentials
- Ensure your Supabase project is active
- Verify RLS policies are set up correctly

### App crashes on startup
- Clear the cache: `npm start -- --clear`
- Rebuild the app

## Contributing

This is a personal project, but suggestions and improvements are welcome!

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ using React Native and Expo**
