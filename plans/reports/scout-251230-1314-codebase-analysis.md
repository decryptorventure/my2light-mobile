# My2Light Mobile - Comprehensive Codebase Analysis

**Generated:** 2025-12-30 14:14
**Project Version:** 2.3.0
**Branch:** master
**Platform:** React Native (Expo 54)

---

## Executive Summary

My2Light Mobile is a pickleball/badminton social platform with TikTok-style video feed, court booking, match-making, and video recording capabilities. Built with Expo 54, React Native 0.81, TypeScript 5.9, Supabase backend, Zustand state management, and React Query for data fetching.

**Health Status:** 🟡 Moderate - Functional but with technical debt and low test coverage (17.69%)

---

## 1. Project Structure & Architecture

### Directory Organization

```
my2light-mobile/
├── app/                        # Expo Router screens (file-based routing)
│   ├── (auth)/                # Auth flow
│   ├── (tabs)/                # Main 5-tab navigation
│   ├── admin/                 # Admin dashboard (3 tabs)
│   ├── record/, feed/, video/ # Full-screen modals
│   └── [dynamic routes]       # court/[id], match/[id], booking/[id]
│
├── src/
│   ├── features/              # Domain-driven feature modules
│   │   ├── auth/              # Authentication
│   │   ├── bookings/          # Court bookings
│   │   ├── courts/            # Court management
│   │   ├── highlights/        # Video highlights
│   │   └── recording/         # Video recording
│   ├── lib/                   # Core utilities
│   │   ├── supabase.ts        # DB client
│   │   ├── storage.ts         # MMKV storage
│   │   ├── network.ts         # Offline queue
│   │   └── apiWrapper.ts      # API caching
│   └── shared/                # Shared components/utils
│
├── components/ui/             # Reusable UI components
├── lib/                       # Root utilities (backgroundUpload, logger)
├── hooks/                     # Custom React hooks
├── constants/                 # Theme, colors, config
├── tests/                     # Jest test suites
└── migrations/                # DB migrations
```

### Architecture Pattern

**Feature-Driven Design** with clear separation:
- Services (API layer) → Hooks (React Query) → Stores (Zustand) → UI
- Each feature self-contained with services, types, hooks, components
- Centralized theme and shared components

---

## 2. Tech Stack Analysis

### Core Dependencies

| Layer | Technology | Version | Status |
|-------|-----------|---------|--------|
| **Framework** | Expo | 54.0.0 | ✓ Latest |
| **React Native** | - | 0.81.1 | ✓ Current |
| **React** | - | 19.0.0 | ✓ Latest |
| **TypeScript** | - | 5.9.0 | ✓ Current |
| **Router** | Expo Router | 6.0.15 | ✓ Latest |
| **State** | Zustand | 5.0.9 | ✓ Current |
| **Storage** | MMKV | 4.1.0 | ✓ Fast |
| **Data Fetching** | React Query | 5.90.11 | ✓ Latest |
| **Backend** | Supabase | 2.86.1 | ✓ Current |
| **UI** | NativeWind | - | ✓ Active |
| **Animation** | Reanimated | ~3.10.1 | ✓ Current |
| **Testing** | Jest | 29.7.0 | ✓ Current |

### Key Libraries

- **Media:** expo-camera, expo-av, expo-media-library, expo-image
- **Notifications:** expo-notifications
- **Network:** @react-native-community/netinfo
- **Video:** expo-video-thumbnails, expo-image-manipulator
- **Icons:** @expo/vector-icons (Ionicons)

---

## 3. Feature Modules Deep Dive

### 3.1 Authentication (`src/features/auth/`)

**Components:**
- `auth.service.ts` - getCurrentUser(), updateUserProfile()
- `authStore.ts` - Zustand store with MMKV persistence
- `login.tsx` - Email/password auth screen

**Flow:**
1. Supabase auth → Session persisted to AsyncStorage
2. Zustand authStore syncs with session
3. Auto-creates user profiles with DiceBear avatars
4. Initial credits: 200K per user

**Coverage:** 18.96% ⚠️

---

### 3.2 Highlights (`src/features/highlights/`)

**Components:**
- `highlight.service.ts` - CRUD operations, like toggle
- `recordingStore.ts` - Session recording state
- `useHighlights.ts` - React Query hooks
- `HighlightCard.tsx` - Optimized video card
- `LibraryScreen.tsx` - User profile with tabs

**Features:**
- TikTok-style feed with pagination
- Like/view tracking
- Event markers (spike, block, ace) with timestamps
- Thumbnail generation with fallbacks

**Coverage:** 80.82% ✓

---

### 3.3 Bookings (`src/features/bookings/`)

**Components:**
- `booking.service.ts` - History + active booking queries
- `useBookings.ts` - React Query hooks

**Features:**
- Court reservation system
- Active booking detection (15-min buffer)
- Package mapping (full match, practice, etc.)
- Join queries for court + package details

**Coverage:** 26.81% ⚠️

---

### 3.4 Courts (`src/features/courts/`)

**Components:**
- `court.service.ts` - getCourts(), getCourtById()
- `useCourts.ts` - React Query hooks

**Features:**
- Court listing with filters
- Facilities, images, hours, ratings
- Fallback thumbnails (Unsplash)

**Coverage:** 86.2% ✓

---

### 3.5 Recording (`src/features/recording/`)

**Components:**
- `recordingStore.ts` - Session state (non-persistent)
- `camera.tsx` - Camera interface
- `preview.tsx` - Video playback + highlight review
- `upload.tsx` - Metadata + court selection

**Features:**
- Real-time recording with timer
- Highlight markers during recording
- Retroactive highlight duration (0-60s)
- Voice command support
- Confetti animation on highlight
- Merge highlights capability

**Coverage:** Not measured (in-memory state)

---

## 4. Navigation Architecture

### Router Structure

**Expo Router v6** with file-based routing + animations

```
Root Stack
├── (auth) - Auth flow [headers hidden]
├── (tabs) - Main navigation [5 tabs]
│   ├── index (Home/Feed)
│   ├── social
│   ├── match
│   ├── library
│   └── profile
├── admin - Admin dashboard [3 tabs]
│   ├── dashboard
│   ├── courts
│   └── bookings
└── Modals [full-screen/slide animations]
    ├── /record [full-screen modal]
    ├── /video [fade animation]
    ├── /feed [full-screen modal]
    ├── /qr [full-screen modal]
    ├── /notifications [slide-right]
    ├── /settings [slide-right]
    └── Dynamic: /court/[id], /match/[id]
```

### Auth Flow Logic

```
User State → Navigation Destination
──────────────────────────────────
Not Auth → /(auth)/login
Auth + No Onboarding → /onboarding
Auth + Onboarded → /(tabs)
```

### Tab Navigation

| Tab | Icon | Label (Vietnamese) | Route |
|-----|------|-------------------|-------|
| Home | home | Trang chủ | index |
| Social | people | Cộng đồng | social |
| Match | tennisball | Tìm kèo | match |
| Library | play-circle | Thư viện | library |
| Profile | person-circle | Cá nhân | profile |

---

## 5. Services Architecture

### Service Layer Pattern

**Location:** `src/features/*/[feature].service.ts`

**Standard Response:**
```typescript
ApiResponse<T> = {
  success: boolean
  data: T
  error?: string
  message?: string
}
```

### Core Services

| Service | Methods | Coverage |
|---------|---------|----------|
| **Auth** | getCurrentUser, updateUserProfile | 18.96% ⚠️ |
| **Highlight** | getHighlights, createHighlight, toggleLike | 80.82% ✓ |
| **Booking** | getBookingHistory, getActiveBooking | 26.81% ⚠️ |
| **Court** | getCourts, getCourtById | 86.2% ✓ |
| **Upload** | (background upload service) | 81.9% ✓ |
| **Admin** | (court management operations) | 29.94% ⚠️ |

**Untested Services (0% coverage):**
- Match, Notification, Push, Realtime, Review, Transaction

---

## 6. State Management Strategy

### Zustand Stores (Client State)

**1. AuthStore** (`authStore.ts`)
- **Persisted:** MMKV encrypted storage
- **State:** user, session, loading, initialized
- **Actions:** initialize(), signIn(), signUp(), signOut()
- **Listeners:** onAuthStateChange from Supabase

**2. RecordingStore** (`recordingStore.ts`)
- **Ephemeral:** In-memory only (session-scoped)
- **State:** isRecording, elapsedTime, highlights[], videoUri, settings
- **Actions:** startRecording(), stopRecording(), addHighlight(), toggleSelection()

### React Query (Server State)

**Query Organization:**

| Hook | Query Key | Stale Time | Purpose |
|------|-----------|------------|---------|
| useHighlights | `['highlights', 'list', {limit}]` | 60s | Feed pagination |
| useUserHighlights | `['highlights', 'user', userId]` | 60s | User profile |
| useCourts | `['courts', 'list']` | 5min | Court listings |
| useActiveBooking | `['bookings', 'active']` | 30s | Real-time polling |
| useBookingHistory | `['bookings', 'history']` | 60s | User bookings |

**Query Client Config:**
- Stale time: 60s default
- Retry: 2 attempts
- Refetch on focus: disabled

---

## 7. Storage & Caching

### MMKV (Local Storage)

**Location:** `src/lib/storage.ts`

```typescript
storage = new MMKV({
  id: 'my2light-storage',
  encryptionKey: 'my2light-encryption-key'
})
```

**Features:**
- Encrypted storage
- Zustand adapter for persistence
- Cache wrapper with TTL support (default 5min)
- Pattern-based cache clearing

### Offline Queue

**Location:** `src/lib/network.ts`

**Capabilities:**
- Queue failed API calls when offline
- Auto-retry on connection restore (max 3 retries)
- NetInfo integration for connectivity detection
- Manual queue clearing

### API Wrapper

**Location:** `src/lib/apiWrapper.ts`

**Features:**
- TTL-aware caching (default 5min)
- Offline queue integration
- Network status checks
- Cache-first strategy

---

## 8. UI Component Library

### Shared Components (`components/ui/`)

**Exported Components:**

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Button** | Primary action | 5 variants, 3 sizes, loading state, icons |
| **Input** | Text input | Labels, icons, validation errors |
| **Card** | Container | 3 variants (default, elevated, outlined) |
| **AnimatedPressable** | Interactive touch | Reanimated scale + haptics |
| **HapticTouchable** | Simple touch | TouchableOpacity + haptics |
| **HighlightCard** | Video card | Memoized, 9:16 aspect, overlays |
| **Skeleton** | Loading states | Pulse animation, 4 prebuilt layouts |
| **States** | UI states | ErrorState, EmptyState, OfflineIndicator |

### Theme System

**Location:** `constants/theme.ts`

**Color Scheme:** Dark mode (slate-based)
- Background: #0f172a (slate-900)
- Surface: #1e293b (slate-800)
- Primary: #0866FF (Facebook blue)
- Accent: #a3e635 (lime-400)

**Design Tokens:**
- Spacing: xs(4) → xxl(48)
- Border Radius: sm(6) → full(9999)
- Font Size: xs(10) → xxxl(32)
- Font Weight: 400 → 700

**Styling Method:** StyleSheet.create() (React Native native)

**Issues:**
- Theme duplicated in `constants/theme.ts` and `src/shared/constants/theme.ts`
- AnimatedPressable + HapticTouchable duplicated in `components/ui/` and `src/shared/components/`

---

## 9. Testing Status

### Overall Coverage: 17.69% ⚠️

**Test Suites:** 10 total (2 failed, 8 passed)
**Tests:** 89 total (6 failed, 83 passed)
**Execution Time:** 13.224s

### Coverage by Module

| Module | Coverage | Status |
|--------|----------|--------|
| **services/** | 25.09% | ⚠️ Moderate |
| highlight.service.ts | 80.82% | ✓ Good |
| court.service.ts | 86.2% | ✓ Good |
| upload.ts | 81.9% | ✓ Good |
| admin.service.ts | 29.94% | ✗ Low |
| booking.service.ts | 26.81% | ✗ Low |
| auth.service.ts | 18.96% | ✗ Low |
| **lib/** | 12.08% | ✗ Low |
| logger.ts | 55.76% | ⚠️ Partial |
| **hooks/** | 0% | ✗ Untested |
| **stores/** | 0% | ✗ Untested |

### Test Failures

**booking.service.test.ts:** Supabase mock `.eq()` chaining returns undefined
**admin.service.test.ts:** Mock implementation gaps (3 failures)

### Code Quality Tools

- **ESLint:** ✗ Not configured
- **Prettier:** ✗ Not configured
- **TypeScript:** ✓ Strict mode enabled

---

## 10. Technical Debt & Issues

### Critical Issues

1. **Low Test Coverage (17.69%)**
   - Hooks layer completely untested (0%)
   - Auth service critical but only 18.96% coverage
   - High-risk services untested (notifications, match, review)

2. **Supabase Mock Failures**
   - Mock chaining incomplete in test setup
   - Causes failures in booking/admin service tests

3. **Code Quality Tooling Missing**
   - No ESLint configuration
   - No Prettier configuration
   - Inconsistent code style possible

### Moderate Issues

4. **Component/Theme Duplication**
   - Theme files in two locations (constants/ vs src/shared/constants/)
   - AnimatedPressable duplicated
   - Risk of drift between versions

5. **Coverage Gaps**
   - Background upload (0%)
   - Security utilities (0%)
   - Video compression (0%)
   - Network utilities (partial)
   - All custom hooks untested

6. **Hardcoded Values**
   - Encryption key in storage.ts should use env variable
   - Some colors hardcoded vs theme constants

### Low Priority

7. **AnimatedCard Simplified**
   - Marked as "temporary fix without reanimated"
   - Intent unclear

8. **Missing Documentation**
   - API service documentation
   - State flow diagrams
   - Deployment guides

---

## 11. Strengths

✓ **Modern Tech Stack** - Latest Expo, React, TypeScript
✓ **Clean Architecture** - Domain-driven feature modules
✓ **Type Safety** - TypeScript strict mode + centralized types
✓ **Offline Support** - MMKV + offline queue + network monitoring
✓ **Performance** - React Query caching, MMKV fast storage, memoization
✓ **Good Service Coverage** - Court (86%), Highlight (80%), Upload (81%)
✓ **Integration Tests** - Booking flow covered
✓ **Haptic Feedback** - Enhanced UX throughout
✓ **Responsive Animations** - Reanimated for smooth interactions
✓ **Modular Components** - Reusable UI library with variants

---

## 12. Recommendations

### Immediate Priority

1. **Fix Test Failures**
   - Repair Supabase mock chaining in test setup
   - Get all tests passing

2. **Increase Hook Coverage**
   - Test all React Query hooks (useHighlights, useCourts, etc.)
   - Target 80%+ coverage

3. **Consolidate Duplicates**
   - Single source for theme (remove duplicate)
   - Single location for AnimatedPressable/HapticTouchable

### High Priority

4. **Improve Critical Service Coverage**
   - Auth service: 18.96% → 70%+
   - Booking service: 26.81% → 70%+
   - Admin service: 29.94% → 70%+

5. **Add Code Quality Tools**
   - ESLint with React Native config
   - Prettier for consistent formatting
   - Pre-commit hooks

6. **Test Untested Services**
   - Notification/push services
   - Match services
   - Review services

### Medium Priority

7. **Security Hardening**
   - Move encryption key to environment variable
   - Review API key exposure
   - Add rate limiting

8. **Documentation**
   - API documentation
   - Architecture decision records
   - Setup/deployment guides

---

## 13. Unresolved Questions

1. **Testing:**
   - Should E2E tests be added (Detox/Maestro)?
   - Target coverage threshold for CI/CD?
   - Integration test strategy for navigation flows?

2. **Architecture:**
   - Why is recordingStore ephemeral vs persisted?
   - How is video upload to Supabase storage handled beyond service layer?
   - What is highlight event detection mechanism (spike/block/ace)?

3. **Infrastructure:**
   - CI/CD pipeline configuration?
   - Staging vs production environment setup?
   - Crash reporting/monitoring tools?

4. **Security:**
   - Permission fallback flows if camera/mic denied?
   - Rate limiting on API calls?
   - Error logging strategy (PII handling)?

5. **Performance:**
   - Video compression settings optimized?
   - Background upload queue size limits?
   - Image caching eviction policy?

---

## Summary Score Card

| Category | Score | Notes |
|----------|-------|-------|
| **Architecture** | 8/10 | Clean feature-driven design |
| **Code Quality** | 6/10 | No linting/formatting tools |
| **Test Coverage** | 3/10 | 17.69% overall, critical gaps |
| **Documentation** | 4/10 | Basic, needs expansion |
| **Performance** | 8/10 | Good caching, optimizations |
| **Type Safety** | 9/10 | Strict TypeScript throughout |
| **Maintainability** | 7/10 | Good structure, some tech debt |
| **Security** | 6/10 | Basic measures, hardcoded keys |

**Overall Health:** 🟡 **6.4/10 - Moderate**

Project is functional with solid architecture but needs test coverage improvements, code quality tooling, and technical debt cleanup before production-ready.

---

**Report End** | Generated by ClaudeKit Scout | 2025-12-30 14:14
