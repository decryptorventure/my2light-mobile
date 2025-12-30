# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] - 2025-12-05

### 🎬 TikTok-Style Video Feed & Bug Fixes

#### ✨ Video Features

- **TikTok-style Video Feed** (`/feed`): Vertical swipe navigation between videos
    - Full-screen video playback with auto-play/pause on scroll
    - Highlight markers on progress bar
    - Action buttons: Like, Comment, Share, Highlights
    - Back button (X) to exit
- **Tab Thư viện (Library)**: User's own video grid with swipe-only-your-videos feature
- **Tab Cộng đồng (Social)**: Real highlights feed from all users (no more mock data)

#### 🔧 Auth & Onboarding Fixes

- **Fixed onboarding detection**: Now uses `hasOnboarded` flag instead of checking name
- **Fixed account switching bug**: Query cache cleared on sign out
- **Fixed stale data issue**: Old user data no longer persists after logout

#### 🎨 UI Improvements

- Library tab redesigned with profile header, stats (videos, followers, following, likes)
- Social tab now shows real user activities with timestamps
- Profile page stats updated with real data (highlights, hours played, courts visited)
- Video player UI with play/pause overlay, user info, description

#### 🐛 Bug Fixes

- Fixed JSX syntax error in profile.tsx
- Fixed navigation to feed with proper index parameter
- Removed all mock data from social feed

#### 📦 Technical Changes

- Added `useUserHighlights` hook support in feed
- Added `hasOnboarded` field to User type
- Updated auth service to return `hasOnboarded` from database
- Feed now supports `userId` param for user-specific video feeds

---

## [2.2.1] - 2025-12-04

### 🔧 Hotfix - Dependency Issues

**Fixed app crashes on Expo Go:**

- Downgraded `react-native-reanimated` from 4.1.5 to 3.10.1
- Added missing `react-refresh` module
- Removed reanimated from AnimatedPressable, AnimatedCard, FadeInView, SlideInView
- Simplified animations to use native React Native components

**Impact:**

- ✅ App runs without crashes on Expo Go
- ✅ All functionality preserved
- ⚠️ Reduced animation effects (temporary)

## [2.2.0] - 2025-12-04

### 🎉 Major Architectural Refactor

This is a **major release** with significant architectural improvements for production scalability.

#### ✨ Added

- **Feature-Based Architecture**: Migrated to modular feature structure (`src/features/`)
    - Auth feature module
    - Highlights feature module
    - Courts feature module
    - Bookings feature module
    - Recording feature module
- **Testing Infrastructure**:
    - Jest test framework with expo preset
    - React Native Testing Library
    - Test setup with mocks for Supabase and Expo Router
    - Sample test file for auth service
- **TypeScript Path Aliases**: Clean imports using `@/features/*`, `@/shared/*`, `@/*`
- **Production Architecture Documentation**: Comprehensive plan for scaling to 1000+ concurrent users

#### 🔨 Changed

- **API Service Modularization**: Split monolithic `services/api.ts` (615 lines) into 7 separate services:
    - `auth.service.ts`
    - `court.service.ts`
    - `highlight.service.ts`
    - `booking.service.ts`
    - `notification.service.ts`
    - `match.service.ts`
    - `transaction.service.ts`
- **Directory Structure**: New `src/` directory with features and shared resources
- **Test Dependencies**: Added Jest, jest-expo, @testing-library/react-native

#### 🎯 Improved

- **Maintainability**: Each service now ~100 lines vs 615-line monolith
- **Scalability**: Feature-based structure allows parallel team development
- **Type Safety**: Enhanced TypeScript configuration with path mapping
- **Developer Experience**: Cleaner imports, better code organization

#### 📚 Documentation

- Project review and assessment
- Production architecture plan (based on Facebook, TikTok patterns)
- Migration guide
- Testing setup guide

### Technical Details

- **Node Modules**: 933 packages
- **Test Framework**: Jest 29.7.0 with jest-expo
- **TypeScript**: Enhanced with path aliases
- **Expo**: Compatible with Expo SDK 54

---

## [1.0.0] - 2024-XX-XX

### Initial Release

- Basic app structure with Expo Router
- Supabase integration
- Core features: Authentication, Highlights, Bookings, Courts
- Zustand state management
- React Query for data fetching
