# My2Light Mobile

> 🎾 Ứng dụng iOS cho nền tảng ghi hình và tìm đối cầu lông My2Light

[![Expo](https://img.shields.io/badge/Expo-54.0-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.79-blue.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org)

## 📱 Features

### Core Features
- **📹 Video Recording** - Quay video trận đấu với camera iOS
- **🎬 Video Preview** - Xem lại và upload video lên cloud
- **👥 Match Finding** - Tìm và tạo kèo đấu với người chơi khác
- **🔔 Notifications** - Thông báo realtime
- **💰 Wallet** - Quản lý số dư và giao dịch
- **📊 Profile** - Thống kê và thành tích cá nhân

### Tech Highlights
- **Expo Router** - File-based navigation
- **Supabase** - Backend & Authentication
- **React Query** - Data fetching & caching
- **Haptic Feedback** - Native tactile response

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo Go app on iOS device
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/decryptorventure/my2light-mobile.git
cd my2light-mobile

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npx expo start
```

### Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
my2light-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Authentication screens
│   ├── (tabs)/             # Main tab screens
│   │   ├── index.tsx       # Home - Highlights feed
│   │   ├── social.tsx      # Social - Community
│   │   ├── record.tsx      # Record button (opens modal)
│   │   ├── match.tsx       # Match - Find opponents
│   │   └── profile.tsx     # Profile - User stats
│   ├── record/             # Recording screens
│   │   ├── index.tsx       # Camera recording
│   │   └── preview.tsx     # Video preview/upload
│   ├── notifications/      # Notifications
│   ├── settings/           # Settings screens
│   ├── qr/                 # QR scanner
│   └── video/              # Video player
├── components/
│   └── ui/                 # Reusable UI components
├── constants/
│   └── theme.ts            # Design tokens
├── hooks/
│   └── useApi.ts           # React Query hooks
├── lib/
│   ├── supabase.ts         # Supabase client
│   └── haptics.ts          # Haptic feedback
├── services/
│   ├── api.ts              # API service
│   └── upload.ts           # Upload service
├── stores/
│   └── authStore.ts        # Zustand auth store
└── types/
    └── index.ts            # TypeScript types
```

## 🎨 Design System

### Colors
| Name | Hex | Usage |
|------|-----|-------|
| Background | `#0f172a` | Main background |
| Surface | `#1e293b` | Cards, inputs |
| Accent | `#a3e635` | Primary actions |
| Text | `#f1f5f9` | Primary text |

### Components
- `Button` - Primary, secondary, ghost variants
- `Input` - Text input with validation
- `Card` - Container component
- `Skeleton` - Loading states
- `States` - Error, empty, offline

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.25 | Core framework |
| expo-router | ~6.0.15 | Navigation |
| expo-camera | ~17.0.9 | Video recording |
| expo-av | ~16.0.7 | Video playback |
| @supabase/supabase-js | ^2.86.0 | Backend |
| @tanstack/react-query | ^5.90.11 | Data fetching |
| zustand | ^5.0.5 | State management |
| expo-haptics | ^14.1.1 | Tactile feedback |

## 🔐 Authentication

Uses Supabase Auth with:
- Email/Password login
- Session persistence via AsyncStorage
- Auth state management with Zustand

## 📝 Version History

### v1.0.0 (2024-12-04)
- ✅ Initial release
- ✅ Core screens implemented
- ✅ Camera recording functional
- ✅ Supabase integration
- ✅ Basic navigation complete

## 🛤️ Roadmap

See [ROADMAP.md](./ROADMAP.md) for future plans.

## 📄 License

Private - © 2024 My2Light

## 👥 Team

- **Development**: Decryptor Venture
