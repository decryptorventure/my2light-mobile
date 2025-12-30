# EAS Build Configuration

## Build Profiles

### Preview (Internal Testing)

For testing on physical devices before App Store submission.

### Production (App Store)

For final App Store and Play Store builds.

---

## Setup Instructions

1. Install EAS CLI:

```bash
npm install -g eas-cli
```

2. Login to Expo:

```bash
eas login
```

3. Configure your project:

```bash
eas build:configure
```

4. Build for iOS:

```bash
# Internal testing
eas build --platform ios --profile preview

# Production (App Store)
eas build --platform ios --profile production
```

5. Submit to App Store:

```bash
eas submit --platform ios
```

---

## Required Setup

Before building, ensure you have:

- [ ] Apple Developer Account ($99/year)
- [ ] App Store Connect app created
- [ ] Update `projectId` in eas.json with your Expo project ID
- [ ] Update `appleId` with your Apple Developer email
- [ ] Update `ascAppId` with your App Store Connect App ID
