# Detailed Setup Guide for Finance Tracker

This guide will walk you through setting up the Finance Tracker app from scratch.

## Part 1: Supabase Setup (Cloud Database)

### Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub, Google, or email

### Step 2: Create a New Project

1. After logging in, click "New Project"
2. Fill in the project details:
   - **Name**: `finance-tracker` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest region to you
   - **Pricing Plan**: Free tier is sufficient
3. Click "Create new project"
4. Wait 2-3 minutes for your project to be set up

### Step 3: Run the Database Setup SQL

1. In your Supabase dashboard, click on the **SQL Editor** icon in the left sidebar (looks like `</>`)
2. Click "New query"
3. Open the `supabase-setup.sql` file from this project
4. Copy the entire contents (all ~300+ lines)
5. Paste it into the Supabase SQL Editor
6. Click "Run" or press Ctrl+Enter (Cmd+Enter on Mac)
7. You should see "Success. No rows returned" - this is correct!

### Step 4: Verify Tables Were Created

1. Click on the **Table Editor** icon in the left sidebar (looks like a table grid)
2. You should see the following tables:
   - categories
   - transactions
   - goals
   - user_settings
3. If you see these tables, the setup was successful!

### Step 5: Get Your API Credentials

1. Click on the **Settings** icon (gear) in the left sidebar
2. Click on **API** in the settings menu
3. You'll see two important values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public** key: A long string starting with `eyJ...`
4. Copy these values - you'll need them in the next step

## Part 2: App Configuration

### Step 1: Clone/Download the Project

If you haven't already:
```bash
git clone <your-repo-url>
cd finances
```

### Step 2: Install Node.js Dependencies

```bash
npm install
```

This will install all required packages. It may take a few minutes.

### Step 3: Create Environment File

1. In the project root, you'll see a file called `.env.example`
2. Create a copy and name it `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in a text editor
4. Replace the placeholder values with your Supabase credentials:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJxxxxx...your-key-here
   ```
5. Save the file

## Part 3: Running the App

### Option A: Run on Android

#### Method 1: Using Android Emulator

1. Install [Android Studio](https://developer.android.com/studio)
2. Open Android Studio
3. Go to Tools > Device Manager
4. Click "Create Device"
5. Choose a device (e.g., Pixel 5)
6. Select a system image (e.g., Android 13 / API 33)
7. Click Finish
8. Start the emulator
9. In your project terminal, run:
   ```bash
   npm run android
   ```

#### Method 2: Using Physical Android Device

1. Enable Developer Mode on your Android device:
   - Go to Settings > About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Go to Settings > Developer Options
   - Turn on "USB Debugging"
3. Connect your device via USB
4. Run:
   ```bash
   npm run android
   ```

### Option B: Run on iOS (macOS only)

#### Method 1: Using iOS Simulator

1. Install [Xcode](https://apps.apple.com/us/app/xcode/id497799835) from the Mac App Store
2. Open Xcode and install additional components if prompted
3. Run:
   ```bash
   npm run ios
   ```

#### Method 2: Using Physical iPhone

1. Install the Expo Go app from the App Store
2. Make sure your phone and computer are on the same WiFi network
3. Run:
   ```bash
   npm start
   ```
4. Scan the QR code with your iPhone camera
5. The app will open in Expo Go

### Option C: Testing Basics (Any Platform)

Use Expo Go app for quick testing:

1. Install Expo Go on your phone:
   - [Android](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - [iOS](https://apps.apple.com/app/expo-go/id982107779)
2. Run:
   ```bash
   npm start
   ```
3. Scan the QR code:
   - Android: Use the Expo Go app
   - iOS: Use the Camera app, it will prompt to open in Expo Go

## Part 4: First-Time App Usage

### Step 1: Create an Account

1. Launch the app
2. You'll see the login screen
3. Tap "Sign Up"
4. Enter your email and password
5. Tap "Sign Up"
6. You should see a success message

### Step 2: Automatic Setup

When you create an account:
- Default categories are automatically created (spending & earning)
- Default settings are initialized
- You're ready to start tracking!

### Step 3: Test the App

1. Go to the Dashboard - you should see:
   - Balance cards (all zeros initially)
   - Time range selector
   - Goal widget (empty initially)

2. Go to Spending tab:
   - Currently empty
   - FAB button is visible (add functionality coming soon)

3. Go to Settings:
   - Try switching themes
   - Toggle dark mode
   - Check your email is displayed

## Troubleshooting

### Problem: "Network error" when signing up

**Solution:**
- Check your `.env` file has the correct Supabase credentials
- Make sure your device has internet access
- Verify your Supabase project is active (not paused)

### Problem: "Failed to open database"

**Solution:**
- You might be running on web, which doesn't support SQLite
- Use Android emulator or physical device instead

### Problem: "Module not found" errors

**Solution:**
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Problem: App shows blank white screen

**Solution:**
- Check the terminal for error messages
- Make sure all dependencies installed correctly
- Try clearing the cache:
  ```bash
  npm start -- --clear
  ```

### Problem: TypeScript errors

**Solution:**
- These are usually just warnings and the app should still run
- If the app doesn't start, check the specific error in the terminal

## Verifying Everything Works

### Checklist:

- [ ] Supabase project is created
- [ ] All 4 tables exist in Supabase (categories, transactions, goals, user_settings)
- [ ] `.env` file is configured with correct credentials
- [ ] `npm install` completed successfully
- [ ] App launches on device/emulator
- [ ] Can create a new account
- [ ] Can see the Dashboard screen
- [ ] Can navigate between tabs
- [ ] Theme switching works
- [ ] Dark mode toggle works

## Next Steps

Once everything is set up and working:

1. **Add Transaction Functionality** (coming soon)
   - Currently, transaction list views work
   - Add/Edit modals need to be implemented

2. **Category Management UI** (coming soon)
   - Backend is ready
   - UI screens need to be built

3. **Goal Management UI** (coming soon)
   - Backend is ready
   - UI screens need to be built

4. **Charts Integration**
   - Dashboard has placeholders
   - Charts will show spending trends

## Need Help?

If you're still having issues:

1. Check the main README.md for additional info
2. Review the error messages carefully
3. Search for the error on Stack Overflow or Expo forums
4. Open an issue on GitHub with:
   - The error message
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

---

**Happy tracking!** 📊💰
