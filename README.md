# My2Light Mobile

> 🎾 Ứng dụng iOS cho nền tảng ghi hình và tìm đối pickleball My2Light

[![Version](https://img.shields.io/badge/Version-2.3.0-green.svg)]()
[![Expo](https://img.shields.io/badge/Expo-54.0-blue.svg)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-blue.svg)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/Tests-85%2F89%20passing-green.svg)]()
[![Coverage](https://img.shields.io/badge/Coverage-25%25-yellow.svg)]()

## 📱 Features

- **📹 Video Recording** - Quay video trận đấu với camera iOS
- **🎬 Highlights Feed** - Feed video highlights giống TikTok
- **⚔️ Match Finding** - Tìm và tạo kèo đấu với người chơi khác
- **🔔 Notifications** - Thông báo realtime
- **� Offline Support** - Hoạt động kể cả khi mất mạng

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS) or **Android Emulator**
- **Git**

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

### Code Quality

```bash
npm run lint           # Run ESLint
npm run lint:fix       # Auto-fix ESLint issues
npm run format         # Format with Prettier
npm run type-check     # TypeScript compilation check
npm test               # Run Jest tests
npm test -- --coverage # Generate coverage report
```

## 📁 Project Structure

```
my2light-mobile/
├── app/                    # Expo Router screens (5 tabs)
├── src/
│   ├── features/           # Feature modules
│   │   ├── auth/           # Authentication
│   │   ├── highlights/     # Video highlights
│   │   ├── courts/         # Court locations
│   │   ├── bookings/       # Court bookings
│   │   └── recording/      # Video recording
│   ├── shared/             # Shared components
│   └── lib/                # Utilities (MMKV, network, etc.)
├── services/               # API services (7 modules)
├── components/ui/          # UI components
└── tests/                  # Jest tests
```

## 📚 Documentation

| File                           | Description                                        |
| ------------------------------ | -------------------------------------------------- |
| [DOCS.md](./DOCS.md)           | **📌 Main documentation** - Project context đầy đủ |
| [CHANGELOG.md](./CHANGELOG.md) | Version history                                    |
| [ROADMAP.md](./ROADMAP.md)     | Future plans (App Store)                           |

> ⚠️ **IMPORTANT:** Đọc [DOCS.md](./DOCS.md) trước mỗi phiên làm việc để có context đầy đủ.

## �️ Tech Stack

| Category      | Technology    |
| ------------- | ------------- |
| Framework     | Expo 54       |
| Navigation    | Expo Router 6 |
| Backend       | Supabase      |
| State         | Zustand       |
| Storage       | MMKV          |
| Data Fetching | React Query   |

## 📝 Version History

| Version | Date       | Summary                  |
| ------- | ---------- | ------------------------ |
| 2.2.1   | 2025-12-04 | Hotfix Expo Go crashes   |
| 2.2.0   | 2025-12-04 | Offline support (MMKV)   |
| 2.1.0   | 2025-12-04 | Performance (expo-image) |
| 2.0.0   | 2025-12-04 | Major refactor           |

## 🔐 Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## � Team

- **Development**: Decryptor Venture

## 📄 License

Private - © 2024-2025 My2Light
