# System Architecture

## Overview

My2Light Mobile is a React Native Expo application for badminton/pickleball video recording and matchmaking. Built with TypeScript, it follows a feature-based modular architecture.

## Technology Stack

| Layer              | Technology                          | Purpose                    |
| ------------------ | ----------------------------------- | -------------------------- |
| **Frontend**       | React Native 0.81 + Expo 54         | Mobile framework           |
| **Routing**        | Expo Router 6                       | File-based routing         |
| **Backend**        | Supabase                            | Database, Auth, Storage    |
| **State (Client)** | Zustand + MMKV                      | Client state persistence   |
| **State (Server)** | React Query (TanStack Query)        | Server state caching       |
| **Styling**        | React Native StyleSheet             | Native styling             |
| **TypeScript**     | 5.9 (Strict mode)                   | Type safety                |
| **Testing**        | Jest + React Native Testing Library | Unit/Integration tests     |
| **Code Quality**   | ESLint 9 + Prettier 3.7 + Husky 9   | Linting, formatting, hooks |

## Folder Structure

```
my2light-mobile/
├── app/                          # Expo Router screens
│   ├── (auth)/                   # Auth group (login, register)
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Home feed
│   │   ├── library.tsx           # User library
│   │   ├── match.tsx             # Matchmaking
│   │   ├── profile.tsx           # Profile
│   │   └── social.tsx            # Social feed
│   ├── admin/                    # Admin screens
│   ├── booking/                  # Booking screens
│   ├── court/                    # Court details
│   ├── match/                    # Match chat/conversations
│   ├── record/                   # Video recording flow
│   └── settings/                 # Settings screens
│
├── src/
│   ├── features/                 # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── auth.service.ts   # Authentication service
│   │   │   ├── screens/          # Auth screens
│   │   │   └── authStore.ts      # Auth state (moved to /stores)
│   │   ├── highlights/
│   │   │   ├── highlight.service.ts
│   │   │   ├── components/
│   │   │   │   └── HighlightCard.tsx
│   │   │   └── hooks/
│   │   │       └── useHighlights.ts
│   │   ├── courts/
│   │   │   └── court.service.ts
│   │   ├── bookings/
│   │   │   └── booking.service.ts
│   │   └── recording/
│   │       └── screens/
│   │
│   ├── shared/                   # Shared resources
│   │   ├── components/           # Reusable UI components
│   │   │   ├── HapticTouchable.tsx
│   │   │   └── AnimatedPressable.tsx
│   │   ├── constants/
│   │   │   ├── theme.ts          # Colors, spacing, fonts
│   │   │   ├── cache.ts          # CACHE_TTL constants
│   │   │   └── network.ts        # Network retry config
│   │   └── utils/
│   │       └── performance.ts    # Performance monitoring
│   │
│   └── lib/                      # Core utilities
│       ├── supabase.ts           # Supabase client
│       ├── storage.ts            # MMKV encrypted storage
│       ├── network.ts            # Offline queue, network status
│       ├── apiWrapper.ts         # API call wrapper
│       ├── logger.ts             # Structured logging
│       ├── security.ts           # Validation, encryption
│       ├── haptics.ts            # Haptic feedback
│       └── backgroundUpload.ts   # Background video uploads
│
├── components/ui/                # UI component library
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Skeleton.tsx
│   ├── States.tsx                # Error, Empty, Offline states
│   └── index.ts                  # Barrel exports
│
├── services/                     # Legacy API services (migrating to features/)
│   ├── admin.service.ts
│   ├── booking.service.ts
│   ├── court.service.ts
│   ├── highlight.service.ts
│   ├── match.service.ts
│   └── upload.ts
│
├── stores/                       # Zustand stores
│   ├── authStore.ts              # Authentication state
│   └── recordingStore.ts         # Video recording state
│
├── types/                        # Global TypeScript types
│   └── index.ts                  # User, Highlight, Court, etc.
│
├── tests/                        # Test files
│   ├── setup.ts                  # Jest configuration
│   ├── services/                 # Service tests
│   └── hooks/                    # Hook tests
│
├── plans/                        # Implementation plans
│   └── 251230-1630-codebase-improvement/
│       ├── phase-01-critical-security-fixes.md
│       ├── phase-02-code-quality-tooling.md
│       ├── phase-03-testing-infrastructure.md
│       ├── phase-04-code-organization.md
│       ├── phase-05-performance-optimization.md
│       └── phase-06-documentation-updates.md
│
└── docs/                         # Documentation
    ├── security-practices.md
    ├── testing-guide.md
    ├── code-standards.md
    └── system-architecture.md (this file)
```

## State Management

### Client State (Zustand + MMKV)

Used for:

- Authentication state (user, session, tokens)
- Recording state (camera settings, recording progress)
- UI preferences

**Why Zustand**: Minimal boilerplate, React Hook-based, TypeScript-first

**Why MMKV**: Encrypted, synchronous, 30x faster than AsyncStorage

```typescript
// Example: authStore.ts
export const useAuthStore = create<AuthState>(
    persist(
        (set) => ({
            user: null,
            session: null,
            setUser: (user) => set({ user }),
        }),
        {
            name: "auth-storage",
            storage: createJSONStorage(() => zustandStorage),
        }
    )
);
```

### Server State (React Query)

Used for:

- API data fetching (highlights, courts, bookings)
- Caching with TTL
- Optimistic updates
- Background refetching

**Cache Strategy**: See `CACHE_TTL` constants

```typescript
// src/shared/constants/cache.ts
export const CACHE_TTL = {
    REAL_TIME: 10000, // 10s - Active bookings
    FREQUENT: 60000, // 1min - Highlights, user data
    NORMAL: 300000, // 5min - Courts, stable data
    LONG: 600000, // 10min - Reference data
};
```

```typescript
// Example: useHighlights hook
export function useHighlights(limit: number = 20) {
    return useQuery({
        queryKey: ["highlights", limit],
        queryFn: () => HighlightService.getHighlights(limit),
        staleTime: CACHE_TTL.FREQUENT,
        gcTime: CACHE_TTL.FREQUENT * 2,
    });
}
```

## Data Flow

```
┌─────────────┐
│  Component  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ React Query Hook│ (useHighlights, useBookings, etc.)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Service Layer  │ (HighlightService, BookingService, etc.)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ API Wrapper     │ (offline queue, caching)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ Supabase Client │
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│  Backend (SB)   │ (PostgreSQL, Auth, Storage, RLS)
└─────────────────┘
```

### Example Flow: Fetching Highlights

1. **Component** calls `useHighlights(10)` hook
2. **React Query** checks cache:
    - If fresh (< 60s): Return cached data
    - If stale: Return cached + refetch in background
    - If missing: Fetch from server
3. **Hook** calls `HighlightService.getHighlights(10)`
4. **Service** calls `apiWrapper(key, fn, options)`
5. **API Wrapper** checks:
    - Online? Proceed to Supabase
    - Offline? Add to queue, return cached
6. **Supabase Client** executes query with JWT token
7. **Backend** applies RLS policies, returns data
8. **Service** transforms response to domain models
9. **React Query** caches result with TTL
10. **Component** re-renders with data

## Security Layers

### 1. Row Level Security (RLS)

Supabase PostgreSQL policies enforce data access control:

```sql
-- Example: Users can only see their own highlights
CREATE POLICY "Users view own highlights"
ON highlights FOR SELECT
USING (auth.uid() = user_id);
```

### 2. JWT Authentication

- Tokens generated by Supabase Auth
- Stored in encrypted MMKV
- Auto-refresh handled by client
- Included in all API requests

### 3. Encrypted Storage (MMKV)

```typescript
// lib/storage.ts
storage = createMMKV({
    id: "my2light-storage",
    encryptionKey: process.env.EXPO_PUBLIC_ENCRYPTION_KEY,
});
```

### 4. Input Validation

```typescript
// lib/security.ts
export function validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): boolean {
    return (
        password.length >= 12 &&
        /[A-Z]/.test(password) &&
        /[a-z]/.test(password) &&
        /[0-9]/.test(password)
    );
}
```

### 5. Rate Limiting

- Login attempts: 5 per minute
- API calls: Configured in Supabase Edge Functions
- Offline queue: Max 3 retries per action

## Performance Optimizations

### 1. Optimistic Updates

```typescript
// src/features/highlights/hooks/useHighlights.ts
export function useToggleLike() {
    return useMutation({
        onMutate: async (params) => {
            // Cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ["highlights"] });

            // Snapshot previous value
            const previousData = queryClient.getQueryData(["highlights"]);

            // Optimistically update cache
            queryClient.setQueryData(["highlights"], (old) => {
                // Update like count immediately
            });

            return { previousData };
        },
        onError: (err, params, context) => {
            // Rollback on error
            queryClient.setQueryData(["highlights"], context.previousData);
        },
    });
}
```

### 2. FlatList Optimization

```typescript
<FlatList
    data={messages}
    keyExtractor={(item) => item.id}
    removeClippedSubviews={true}        // Remove off-screen views
    maxToRenderPerBatch={25}            // Batch rendering
    updateCellsBatchingPeriod={50}      // Debounce
    initialNumToRender={20}             // Initial render count
    windowSize={10}                     // Viewport multiplier
/>
```

### 3. Offline Queue with Exponential Backoff

```typescript
// src/lib/network.ts
async process() {
    while (this.queue.length > 0) {
        try {
            await item.action();
            this.queue.shift(); // Success
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                this.queue.shift(); // Don't retry auth errors
            } else {
                // Exponential backoff: 1s, 2s, 4s (max 10s)
                const delay = Math.min(1000 * Math.pow(2, item.retryCount), 10000);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
}
```

### 4. Image Optimization

- **expo-image** library (better caching, performance)
- Lazy loading for off-screen images
- Progressive JPEG support

## Routing Architecture

**Expo Router**: File-based routing system

```
app/
├── _layout.tsx              # Root layout
├── (auth)/
│   ├── _layout.tsx          # Auth layout
│   ├── login.tsx            # /login
│   └── register.tsx         # /register
├── (tabs)/
│   ├── _layout.tsx          # Tab layout
│   ├── index.tsx            # / (Home)
│   ├── library.tsx          # /library
│   ├── match.tsx            # /match
│   ├── profile.tsx          # /profile
│   └── social.tsx           # /social
└── court/
    └── [id].tsx             # /court/123 (Dynamic route)
```

## Testing Strategy

### Coverage Targets

- **Overall**: 60%+
- **Critical Services**: 70%+ (auth, booking, payment)
- **Hooks**: 60%+
- **Current**: 25%

### Test Types

1. **Unit Tests**: Services, utilities, hooks
2. **Integration Tests**: Feature flows (planned)
3. **E2E Tests**: Critical paths (planned)

### Mocking Strategy

- **Supabase**: Global mock in `tests/setup.ts`
- **Storage**: In-memory mock
- **Network**: Mock `isOnline()` function

See [testing-guide.md](./testing-guide.md) for details.

## Code Quality

### ESLint 9

- Flat config (`eslint.config.js`)
- TypeScript support
- React/React Native rules
- Auto-fix on save

### Prettier 3.7

- Consistent formatting
- 100 char line width
- 4 spaces indentation
- Single quotes

### Husky 9 + lint-staged

Pre-commit hooks:

- ESLint on staged `.ts/.tsx` files
- Prettier on all staged files
- TypeScript compilation check

## Deployment

### Development

```bash
npx expo start
# Press 'i' for iOS Simulator
# Press 'a' for Android Emulator
```

### Build (Future)

```bash
eas build --platform ios
eas build --platform android
```

### CI/CD (Planned)

- GitHub Actions on push/PR
- Run: Lint, TypeScript, Tests
- Build: EAS Build on release tags

## Monitoring (Planned)

- **Error Tracking**: Sentry or similar
- **Analytics**: Firebase Analytics
- **Performance**: React Native Performance Monitor
- **Crash Reporting**: Crashlytics

## Scalability Considerations

### Current Architecture Supports

- ✅ Offline-first capabilities
- ✅ Optimistic updates
- ✅ Efficient caching (React Query + MMKV)
- ✅ Modular feature structure
- ✅ Type-safe codebase

### Future Enhancements

- 🔄 Push notifications (Expo Notifications)
- 🔄 Real-time updates (Supabase Realtime)
- 🔄 Video compression (before upload)
- 🔄 CDN for video delivery
- 🔄 Pagination for infinite scroll

## Migration Path

### From Legacy Services to Feature Modules

**Current**: `/services/booking.service.ts`
**Target**: `/src/features/bookings/booking.service.ts`

**Status**: Gradual migration in progress

### From Relative to Absolute Imports

**Current**: `import { Button } from "../../../components/ui/Button"`
**Target**: `import { Button } from "@/components/ui/Button"`

**Status**: ✅ Completed in Phase 4

## References

- [Expo Documentation](https://docs.expo.dev/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
