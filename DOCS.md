# My2Light Mobile - Project Documentation

> 📄 Document này là context chính cho các phiên làm việc. Cập nhật mỗi lần release.

**Last Updated:** 2025-12-05 | **Version:** 2.3.0 | **Status:** Feature Complete

---

## 🎯 Project Overview

**My2Light Mobile** là ứng dụng iOS cho nền tảng ghi hình và tìm đối pickleball.

### Tech Stack

| Category      | Technology         | Version |
| ------------- | ------------------ | ------- |
| Framework     | Expo               | 54.0    |
| Language      | TypeScript         | 5.9     |
| Navigation    | Expo Router        | 6.0     |
| Backend       | Supabase           | 2.86    |
| State         | Zustand            | 5.0     |
| Data Fetching | React Query        | 5.90    |
| Storage       | MMKV               | 4.1     |
| Network       | NetInfo            | 11.4    |
| Notifications | Expo Notifications | 0.29    |

---

## 📁 Architecture

### Directory Structure

```
my2light-mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Login, Register
│   ├── (tabs)/             # Main 5 tabs
│   ├── admin/              # Admin Dashboard & Management
│   ├── become-owner/       # Court Owner Registration
│   ├── record/             # Camera & Preview
│   ├── video/              # Video Player
│   ├── notifications/      # Notifications Screen
│   └── _layout.tsx         # Root layout
│
├── src/                    # Source code (Feature-based)
│   ├── features/
│   │   ├── auth/           # authStore.ts, screens
│   │   ├── highlights/     # components, hooks, types
│   │   ├── courts/         # useCourts hook
│   │   ├── bookings/       # useBookings hook
│   │   └── recording/      # recordingStore.ts
│   ├── shared/             # Shared components
│   └── lib/
│       ├── storage.ts      # MMKV wrapper
│       ├── network.ts      # Offline queue
│       ├── apiWrapper.ts   # Cache layer
│       ├── supabase.ts     # Client
│       └── haptics.ts      # Haptic feedback
│
├── services/               # API Services (8 modules)
│   ├── auth.service.ts
│   ├── admin.service.ts    # Court Owner & Admin features
│   ├── push.service.ts     # Push Notifications
│   ├── highlight.service.ts
│   ├── court.service.ts
│   ├── booking.service.ts
│   ├── match.service.ts
│   ├── notification.service.ts
│   └── transaction.service.ts
│
├── components/ui/          # UI Components
├── constants/theme.ts      # Design tokens
├── stores/                 # Zustand stores
├── hooks/                  # Custom hooks
├── tests/                  # Jest tests
└── assets/                 # Images & Fonts
```

### Path Aliases (tsconfig.json)

```json
{
    "@/*": ["./src/*"],
    "@/features/*": ["./src/features/*"],
    "@/shared/*": ["./src/shared/*"],
    "@/lib/*": ["./src/lib/*"]
}
```

---

## 🏠 Main Screens (5 Tabs)

| Tab        | Screen          | File                     | Description           |
| ---------- | --------------- | ------------------------ | --------------------- |
| 🏠 Home    | Highlights Feed | `app/(tabs)/index.tsx`   | Video highlights lướt |
| 💬 Social  | Community       | `app/(tabs)/social.tsx`  | Mạng xã hội           |
| 🔴 Record  | Camera Modal    | `app/record/index.tsx`   | Quay video            |
| ⚔️ Match   | Find/Create     | `app/(tabs)/match.tsx`   | Tìm đối thủ           |
| 👤 Profile | User Stats      | `app/(tabs)/profile.tsx` | Cá nhân & Quản lý sân |

### Admin & Court Owner Screens

- `app/admin/dashboard.tsx` - Dashboard tổng quan
- `app/admin/courts.tsx` - Quản lý danh sách sân
- `app/admin/bookings.tsx` - Quản lý lịch đặt sân
- `app/admin/agenda.tsx` - Lịch biểu (Calendar View)
- `app/admin/reports.tsx` - Báo cáo doanh thu
- `app/become-owner/index.tsx` - Đăng ký làm chủ sân

### Other Key Screens

- `app/record/preview.tsx` - Preview & upload video
- `app/video/[id].tsx` - Video player full screen
- `app/notifications/index.tsx` - Notifications list
- `app/create-match.tsx` - Create new match request

---

## 🔧 Key Features Implemented

### ✅ Core Features (v1.0)

- [x] Authentication (Email/Password)
- [x] Video Recording (expo-camera)
- [x] Video Preview & Upload
- [x] Highlights Feed
- [x] Match Finding System
- [x] User Profiles
- [x] Notifications

### ✅ Architecture (v2.0)

- [x] Feature-based folder structure
- [x] 7 modular API services
- [x] TypeScript path aliases
- [x] Jest testing infrastructure

### ✅ Performance (v2.1)

- [x] expo-image with caching
- [x] FlatList optimizations
- [x] Component memoization

### ✅ Offline Support (v2.2)

- [x] MMKV storage (~30x faster than AsyncStorage)
- [x] Network detection (NetInfo)
- [x] Offline action queue
- [x] Auth session persistence

### ✅ Admin & Court Management (v2.3)

- [x] Court Owner Registration Flow
- [x] Admin Dashboard (Stats, Charts)
- [x] Court CRUD (Create, Read, Update, Delete)
- [x] Booking Management (Approve/Cancel)
- [x] Revenue Reports & Export
- [x] Push Notifications (Expo Push API)

---

## ⚠️ Known Issues & Trade-offs

### Animation Simplified (v2.2.1)

**Problem:** react-native-reanimated v4.1.5 incompatible with Expo Go v54
**Solution:** Simplified all animated components to use basic React Native
**Affected Files:**

- `components/ui/AnimatedPressable.tsx` → TouchableOpacity
- `components/ui/AnimatedCard.tsx` → View
- FadeInView, SlideInView → View

**Future:** Re-enable animations khi chuyển sang Development Build

### Dependencies Fixed (v2.2.1)

- Downgraded `react-native-reanimated`: 4.1.5 → 3.10.1
- Added missing `react-refresh` module

---

## 📦 Key Dependencies

```json
{
    "expo": "~54.0.26",
    "expo-router": "~6.0.15",
    "expo-camera": "~17.0.9",
    "expo-av": "~16.0.7",
    "expo-image": "~3.0.10",
    "expo-notifications": "~0.29.11",
    "expo-device": "~7.0.2",
    "expo-constants": "~17.0.3",
    "@supabase/supabase-js": "^2.86.0",
    "@tanstack/react-query": "^5.90.11",
    "zustand": "^5.0.9",
    "react-native-mmkv": "^4.1.0",
    "@react-native-community/netinfo": "^11.4.1",
    "react-native-reanimated": "~3.10.1"
}
```

---

## 🗄️ Database Schema (Supabase)

### Core Tables

| Table            | Description         | Key Fields                                              |
| ---------------- | ------------------- | ------------------------------------------------------- |
| `profiles`       | User profiles       | id, username, avatar, rating, **role**                  |
| `court_owners`   | Court Owner Info    | id, user_id, business_name, **status**, **is_verified** |
| `highlights`     | Video highlights    | id, user_id, video_url, thumbnail                       |
| `courts`         | Court locations     | id, owner_id, name, address, lat, lng                   |
| `bookings`       | Court bookings      | id, user_id, court_id, date, status                     |
| `match_requests` | Match finding       | id, user_id, court_id, status                           |
| `notifications`  | User notifications  | id, user_id, type, message                              |
| `transactions`   | Wallet transactions | id, user_id, amount, type                               |

---

## 🔐 Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
EXPO_PUBLIC_PROJECT_ID=your-expo-project-id
```

---

## 🚀 Development Commands

```bash
# Start development
npx expo start

# Start with clear cache
npx expo start --clear

# Run tests
npm test

# Install dependencies (note: use --legacy-peer-deps)
npm install --legacy-peer-deps
```

---

## 📊 Version History

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 2.3.0   | 2025-12-05 | Admin Dashboard, Court Management, Push Notifications |
| 2.2.1   | 2025-12-04 | Hotfix Expo Go crashes                                |
| 2.2.0   | 2025-12-04 | Offline support, MMKV storage                         |
| 2.1.0   | 2025-12-04 | Performance (expo-image)                              |
| 2.0.0   | 2025-12-04 | Major refactor (features)                             |
| 1.0.0   | 2024-XX    | Initial release                                       |

See [CHANGELOG.md](./CHANGELOG.md) for details.

---

## 🎯 Next Steps (Priority Order)

### Immediate

1. [ ] Write unit tests (target 70%+ coverage)
2. [ ] Re-enable animations với Development Build
3. [ ] Add error boundaries

### Short-term

4. [ ] Sentry error tracking
5. [ ] Firebase Analytics
6. [ ] Performance benchmarking

### App Store

7. [ ] Apple Developer ($99)
8. [ ] EAS Build configuration
9. [ ] TestFlight beta testing

See [ROADMAP.md](./ROADMAP.md) for full roadmap.

---

## 👥 Conventions

### Code Style

- Feature-based folder structure
- TypeScript strict mode
- Path aliases for imports
- Service files: `<name>.service.ts`
- Hooks files: `use<Name>.ts`
- Store files: `<name>Store.ts`

### Git Commits

- 🎉 Feature: New functionality
- 🔧 Fix: Bug fixes
- ⚡ Perf: Performance
- 📝 Docs: Documentation
- 🔨 Refactor: Code changes

---

## 🔗 Links

- **GitHub:** github.com/decryptorventure/my2light-mobile
- **Supabase:** (private dashboard)
- **Design:** (Figma link if available)

---

_Cập nhật document này mỗi khi release version mới để đảm bảo context liên tục._
