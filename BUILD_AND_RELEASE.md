# Building and Releasing Finance Tracker APK

This guide will help you build an APK file and distribute it via GitHub Releases.

## Prerequisites

- Node.js and npm installed
- Expo account (create one at https://expo.dev)
- Git repository set up on GitHub

## Step-by-Step Instructions

### Step 1: Create an Expo Account

1. Go to https://expo.dev
2. Click "Sign up" and create a free account
3. Remember your credentials (you'll need them in Step 3)

### Step 2: Login to Expo via CLI

Run this command in your terminal:

```bash
npx eas login
```

Enter your Expo credentials when prompted.

### Step 3: Configure Your Project

Run this command to initialize EAS Build:

```bash
npx eas build:configure
```

This will:
- Create an `eas.json` file (already created)
- Link your project to your Expo account
- Generate a project ID in `app.json`

### Step 4: Build Your First APK

Run this command to start the build process:

```bash
npm run build:android
```

Or directly:

```bash
npx eas build --platform android --profile production
```

**What happens during the build:**
1. EAS will ask if you want to generate a new keystore - **Select "Yes"**
2. Your code will be uploaded to Expo's build servers
3. The build process will take 10-20 minutes
4. Once complete, you'll get a download link for the APK

### Step 5: Download Your APK

After the build completes:
1. You'll see a URL in the terminal - click it to download
2. Or visit https://expo.dev/accounts/[your-username]/projects/finance-tracker/builds
3. Download the APK file

### Step 6: Create a GitHub Release

1. Go to your GitHub repository
2. Click on "Releases" (right sidebar)
3. Click "Create a new release"
4. Fill in the details:
   - **Tag version**: `v1.0.0`
   - **Release title**: `Finance Tracker v1.0.0`
   - **Description**: Write release notes (features, bug fixes, etc.)
5. Upload your APK file by dragging it to the "Attach binaries" section
6. Click "Publish release"

### Step 7: Share the Download Link

Your APK is now publicly available! Share this URL:

```
https://github.com/[your-username]/finances/releases/latest
```

Users can:
1. Click the link
2. Download the APK file
3. Install it on their Android device (may need to enable "Install from Unknown Sources")

## For Future Releases

When you make changes and want to release a new version:

### 1. Update Version Numbers

Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "android": {
      "versionCode": 2   // Increment this (must be higher than previous)
    }
  }
}
```

### 2. Build New APK

```bash
npm run build:android
```

### 3. Create New GitHub Release

- Tag: `v1.0.1`
- Title: `Finance Tracker v1.0.1`
- Upload the new APK

## Troubleshooting

### App Crashes with "supabaseUrl is required"

**This was the crash you encountered!**

**Cause:** Environment variables from `.env` are not included in APK builds.

**Fix:** Environment variables are now configured in `eas.json` in the `env` section. The fix has been applied, so rebuilding will resolve this issue.

If you see this error again:
1. Check that `eas.json` has the `env` section with your Supabase credentials
2. Rebuild the APK: `npm run build:android`

### Build Failed

- Check the build logs on expo.dev
- Make sure all dependencies are installed: `npm install`
- Ensure `eas.json` contains your Supabase configuration

### APK Won't Install

- Enable "Install from Unknown Sources" in Android settings
- Make sure you downloaded the correct APK file
- Try uninstalling the old version first

### Environment Variables

**IMPORTANT:** Environment variables are configured in `eas.json` for builds, NOT from your `.env` file.

The `eas.json` file contains your Supabase configuration:
- EXPO_PUBLIC_SUPABASE_URL
- EXPO_PUBLIC_SUPABASE_ANON_KEY

**Note:** The Supabase ANON key is designed to be public (it's used in client apps), so it's safe to commit `eas.json` to your repository. This key only allows access based on your Row Level Security (RLS) policies in Supabase.

If you change your Supabase project, update these values in `eas.json`

## Build Profiles

Your `eas.json` has three build profiles:

- **development**: For testing with development client
- **preview**: Quick APK builds for testing (faster)
- **production**: Optimized APK for distribution (what we use)

To build a preview version (faster for testing):
```bash
npx eas build --platform android --profile preview
```

## Checking Build Status

You can check all your builds at:
```
https://expo.dev
```

Or run:
```bash
npx eas build:list
```

## Important Notes

- Keep your keystore safe! Expo stores it for you automatically
- Never commit your `.env` file to GitHub (it's in `.gitignore`)
- The first build takes longer; subsequent builds are faster
- Free Expo accounts have limited build minutes per month
- APK files are typically 40-60MB in size
