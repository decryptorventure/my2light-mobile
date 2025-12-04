# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2024-12-04

### Added
- **Authentication**: Email/password login with Supabase Auth
- **Home Screen**: Highlights feed with horizontal scroll, action cards
- **Social Screen**: Community tabs (Feed, Explore, Friends, Ranking)
- **Match Screen**: Find opponents with filter support
- **Profile Screen**: User stats, achievements, wallet preview
- **Recording**: Camera recording with timer, front/back flip
- **Video Preview**: Review recorded video, save to device, upload
- **Notifications**: List with read/unread status
- **Wallet**: Balance display and transaction history
- **QR Scanner**: Camera-based QR code scanning
- **Create Match**: Form for creating match requests

### Technical
- Expo Router for file-based navigation
- React Query for data fetching and caching
- Supabase integration for backend
- Zustand for auth state management
- Expo Haptics for tactile feedback
- Custom theme system with design tokens
- Skeleton loading components
- Error/empty state components

### Dependencies
- expo ~54.0.25
- expo-router ~6.0.15
- expo-camera ~17.0.9
- expo-av ~16.0.7
- @supabase/supabase-js ^2.86.0
- @tanstack/react-query ^5.90.11
- zustand ^5.0.5
- expo-haptics ^14.1.1
