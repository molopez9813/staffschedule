# Mobile App Setup Guide

Your Nurse Scheduler app is now configured as a **native iOS and Android app** using Capacitor!

## 📱 What's Been Set Up

- **iOS App**: Located in the `ios/` folder
- **Android App**: Located in the `android/` folder  
- **Capacitor**: Bridges your React web app to native mobile platforms
- **Splash Screen**: Configured for a professional app launch experience

## 🚀 Building the Mobile Apps

### For iOS (iPhone/iPad)

#### Prerequisites:
1. **Mac Computer** - iOS development requires macOS and Xcode
2. **Xcode** - Install from the Mac App Store (it's free and large ~10GB)
3. **Apple Developer Account** - For deploying to a device or the App Store ($99/year)

#### Steps to Build:

1. **Open the iOS project in Xcode**:
   ```bash
   npx cap open ios
   ```
   Or manually:
   ```bash
   open ios/App/App.xcworkspace
   ```

2. **In Xcode**:
   - Select a target device (iPhone simulator or your physical device)
   - Click the "Play" button to build and run
   - For first run, Xcode will need to download additional components

3. **To test on a physical device**:
   - Connect your iPhone via USB
   - In Xcode, select your device from the device menu
   - You may need to sign the app with your Apple ID (free for development)

#### Deploying to the App Store:
1. Configure signing in Xcode (requires paid Apple Developer account)
2. Archive your app (Product → Archive)
3. Upload to App Store Connect

---

### For Android

#### Prerequisites:
1. **Android Studio** - Download from [developer.android.com](https://developer.android.com/studio) (free)
2. **Java Development Kit (JDK)** - Android Studio will guide you through this

#### Steps to Build:

1. **Open the Android project in Android Studio**:
   ```bash
   npx cap open android
   ```
   Or manually open Android Studio and select `Open Existing Project` → choose the `android/` folder

2. **In Android Studio**:
   - Wait for Gradle sync to complete (first time takes a few minutes)
   - Click the green "Run" button (▶️)
   - Choose an emulator or connect a physical Android device

#### Testing on a Physical Android Device:
1. Enable Developer Options on your Android phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Go to Settings → Developer Options
   - Turn on "USB Debugging"
3. Connect via USB and run the app

#### Deploying to Google Play Store:
1. Build a release APK or AAB
2. Create a Google Play Developer account ($25 one-time fee)
3. Upload your app in the Play Console

---

## 🔄 Development Workflow

Every time you make changes to your React app:

1. **Build the web app**:
   ```bash
   npm run build
   ```

2. **Sync changes to mobile**:
   ```bash
   npx cap sync
   ```

3. **Open and run in the development environment**:
   ```bash
   # For iOS
   npx cap open ios
   
   # OR for Android
   npx cap open android
   ```

## 📝 Important Notes

### Storage
- Your app currently uses browser `localStorage` which works on mobile
- For production, consider upgrading to:
  - **SQLite** via `@capacitor-community/sqlite` for secure, persistent storage
  - **Cloud storage** with Firebase, AWS, or other backend services

### File Uploads
- The existing file upload functionality should work on mobile
- Consider adding `@capacitor/camera` for camera integration
- Add `@capacitor/filesystem` for better file handling

### Network Access
- Mobile apps need proper network permissions
- Already configured in the Android manifest
- iOS doesn't require special permissions for HTTPS

## 🛠️ Useful Commands

```bash
# Development
npm run dev          # Run web version
npm run build        # Build for production
npm run preview      # Preview production build

# Mobile
npx cap sync         # Sync code changes to mobile
npx cap open ios     # Open iOS project
npx cap open android # Open Android project

# Plugin management
npx cap sync         # Sync after adding/removing plugins
```

## 📦 Recommended Next Steps

1. **Add Mobile-Specific Features**:
   ```bash
   npm install @capacitor/camera @capacitor/geolocation @capacitor/push-notifications
   npx cap sync
   ```

2. **Add App Icons and Splash Screens**:
   - iOS: Replace images in `ios/App/App/Assets.xcassets`
   - Android: Replace images in `android/app/src/main/res`
   - Or use: `npx capacitor-assets generate` (install the plugin first)

3. **Enable Push Notifications**:
   - Configure Firebase for both platforms
   - Add notification handling for credential expirations

4. **Add Biometric Authentication**:
   - Install `@capacitor/local-authentication`
   - Add fingerprint/Face ID login

5. **Optimize for Offline Use**:
   - Implement service workers for offline caching
   - Use IndexedDB instead of localStorage for better mobile performance

## 🎨 Customizing Your App

### App Name & Icons
- **iOS**: Edit `ios/App/App/Info.plist`
- **Android**: Edit `android/app/src/main/res/values/strings.xml`
- Generate icons with: `npx capacitor-assets generate`

### Bundle ID / Package Name
- **iOS**: `com.nursescheduler.app` (in Xcode under Signing & Capabilities)
- **Android**: `com.nursescheduler.app` (in `android/app/build.gradle`)

## 🐛 Troubleshooting

### iOS Issues:
- **"Developer cannot be verified"**: Go to Settings → General → Device Management → Trust your developer
- **Build errors**: Clean build folder (Cmd+Shift+K) and rebuild
- **Xcode not opening**: Run `npx cap sync` again

### Android Issues:
- **Gradle sync failed**: Check that JDK is properly installed
- **App won't install**: Check device storage and Android version compatibility
- **USB debugging**: Make sure it's enabled in Developer Options

## 📚 Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [iOS Development Guide](https://capacitorjs.com/docs/ios)
- [Android Development Guide](https://capacitorjs.com/docs/android)
- [Apple Developer Portal](https://developer.apple.com)
- [Google Play Console](https://play.google.com/console)

---

## ✅ Quick Start

1. **For iOS**:
   ```bash
   npx cap open ios
   # Click Run in Xcode
   ```

2. **For Android**:
   ```bash
   npx cap open android
   # Click Run in Android Studio
   ```

Your app is ready to deploy! 🎉

