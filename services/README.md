# /services - API & Business Logic Layer

## Overview
This folder contains all API services and business logic for the My2Light mobile app, organized by domain.

## Structure
```
services/
├── api.ts           # Main API service with all endpoints
├── upload.ts        # File upload utilities (Supabase Storage)
└── README.md        # This file
```

## API Service (`api.ts`)

### Architecture
- All methods are async and return `ApiResponse<T>` for consistent error handling
- Uses Supabase client for all database operations
- Row Level Security (RLS) enforced on all queries

### Available Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `getCurrentUser()` | Get authenticated user profile | `User` |
| `updateUserProfile(updates)` | Update user profile | `boolean` |
| `getHighlights(limit)` | Get public highlights feed | `Highlight[]` |
| `getUserHighlights(userId)` | Get user's highlights | `Highlight[]` |
| `createHighlight(...)` | Create new highlight | `Highlight` |
| `toggleLike(...)` | Like/unlike highlight | `boolean` |
| `getCourts()` | Get all active courts | `Court[]` |
| `getCourtById(id)` | Get court details | `Court` |
| `getBookingHistory()` | Get user's bookings | `Booking[]` |
| `getActiveBooking()` | Get current active booking | `Booking` |
| `getMatchRequests()` | Get open match requests | `MatchRequest[]` |
| `createMatchRequest(...)` | Create match request | `MatchRequest` |
| `getNotifications(limit)` | Get user notifications | `Notification[]` |
| `markNotificationRead(id)` | Mark notification as read | `boolean` |
| `getTransactions(limit)` | Get transaction history | `Transaction[]` |
| `getUserCredits()` | Get user's credit balance | `number` |

### Usage Example
```typescript
import { ApiService } from '@/services/api';

// Fetch user data
const { data: user, success, error } = await ApiService.getCurrentUser();

if (success) {
  console.log('User:', user.name);
} else {
  console.error('Error:', error);
}
```

## Upload Service (`upload.ts`)

### Methods
| Method | Description |
|--------|-------------|
| `uploadVideo(uri, userId)` | Upload video to Supabase Storage |
| `uploadAvatar(uri, userId)` | Upload avatar image |

### Storage Buckets
- `videos` - Video highlights
- `avatars` - User profile pictures

---

## Adding New Endpoints

1. Add method to `ApiService` in `api.ts`
2. Add corresponding hook in `/hooks/useApi.ts`
3. Update this README
4. Update TypeScript types in `/types/index.ts` if needed
