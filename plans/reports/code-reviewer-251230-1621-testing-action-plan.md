# Testing Infrastructure - Action Plan

**Status**: Ready for Implementation
**Priority**: CRITICAL (Test Failures Block Progress)
**Estimated Effort**: 8-10 hours

---

## Phase 1: Critical Fixes (1-2 hours) - MUST DO FIRST

These fixes unblock the test suite and enable further testing work.

### 1.1 Fix Supabase Mock Chain

**File**: `/tests/setup.ts`
**Lines**: 15-30
**Impact**: Fixes 4 failing tests

**Current Code** (broken):
```typescript
// Line 15-30
from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
})),
```

**Required Additions**:
```typescript
// After lte, add:
gt: jest.fn().mockReturnThis(),  // For greater-than queries

// After limit, add:
or: jest.fn().mockReturnThis(),  // For OR conditions
```

**Why**:
- `booking.service.ts:63` uses `.in('status', ['approved', 'active'])`
- `booking.service.ts:152` uses `.or()` for complex conflict checking
- Without these, mock chain breaks and tests fail

**Verification**: Run `npm test -- booking.service.test.ts` - should pass `getActiveBooking` tests

---

### 1.2 Fix checkSlotConflict Mock

**File**: `/tests/services/booking.service.test.ts`
**Test**: `createBooking › should return error when insufficient credits` (line 156-193)
**Impact**: Fixes 1 failing test

**Problem**: Test expects "Số dư không đủ" error but gets "Khung giờ này đã được đặt" because `checkSlotConflict` isn't properly mocked

**Current Test Setup** (incomplete):
```typescript
it('should return error when insufficient credits', async () => {
    const mockUser = { id: 'user-123' };

    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
    });

    // Mock court price
    const courtMock = { data: { price_per_hour: 200000 }, error: null };
    const profileMock = { data: { credits: 50000 }, error: null };

    // Missing: checkSlotConflict mock setup
```

**Required Addition** (before service call):
```typescript
// Add this spy before the test calls createBooking
jest.spyOn(BookingService, 'checkSlotConflict').mockResolvedValue(false);
```

**Why**: `createBooking` checks slot conflicts first (line 186 in booking.service.ts) before checking credits. Without mocking it, the conflict error returns first.

**Verification**: Run `npm test -- booking.service.test.ts -- --testNamePattern="insufficient credits"`

---

### 1.3 Fix Admin Service Mock Implementation

**File**: `/tests/services/admin.service.test.ts`
**Tests**:
- `createCourtOwnerProfile › should create court owner profile successfully` (line 39-77)
- `getDashboardStats › should return calculated stats` (line 162-219)
- `cancelBooking › should cancel booking with reason` (line 292-306)

**Impact**: Fixes 2 failing tests

**Problem**: Admin service calls `.select()` immediately after `.from()` but the mock doesn't support this pattern in certain cases.

**Current Issue** (line 46-54):
```typescript
(supabase.from as jest.Mock).mockImplementation((table) => {
    if (table === 'court_owners') {
        return {
            insert: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        };
    }
    // Missing .select() return when checking existing owners
```

**Required Fix**:
```typescript
(supabase.from as jest.Mock).mockImplementation((table) => {
    if (table === 'court_owners') {
        return {
            select: jest.fn().mockReturnThis(),     // ADD THIS
            eq: jest.fn().mockReturnThis(),         // ADD THIS
            maybeSingle: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
            insert: jest.fn().mockResolvedValue({
                data: null,
                error: null,
            }),
        };
    }
    // ... rest unchanged
```

**Why**: Line 66-70 in admin.service.ts does:
```typescript
const { data: existing, error: checkError } = await supabase
    .from("court_owners")
    .select("id")           // ← Mock must support this
    .eq("user_id", user.id)
    .maybeSingle();
```

**Verification**: Run `npm test -- admin.service.test.ts`

---

## Phase 2: Configuration Updates (45 minutes)

Update Jest configuration to properly support React Native and enable coverage tracking.

### 2.1 Update jest.config.js

**File**: `/jest.config.js`

**Current**:
```javascript
module.exports = {
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    // ... no coverage thresholds
};
```

**Required Changes**:
```javascript
module.exports = {
    preset: 'jest-expo',  // IMPORTANT for React Native
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^../../services/(.*)$': '<rootDir>/services/$1',
        '^../../lib/(.*)$': '<rootDir>/lib/$1',
        '^../../stores/(.*)$': '<rootDir>/stores/$1',
        '^../../constants/(.*)$': '<rootDir>/constants/$1',
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',            // ADD THIS
        'stores/**/*.{ts,tsx}',           // ADD THIS
        'lib/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**',
    ],
    coverageThreshold: {                  // ADD THIS
        global: {
            branches: 40,
            functions: 40,
            lines: 40,
            statements: 40,
        },
    },
};
```

**Why**:
- `jest-expo` provides proper React Native module mocking
- `collectCoverageFrom` must include `hooks/` and `stores/` to track all code
- `coverageThreshold` enforces minimum coverage as project grows

---

### 2.2 Update tests/setup.ts

**File**: `/tests/setup.ts`
**Issue**: Global mock doesn't reset properly between tests

**Add After Line 40** (end of mock):
```typescript
// Reset all mocks before each test
beforeEach(() => {
    jest.clearAllMocks();
});

// Clean up after each test
afterEach(() => {
    jest.restoreAllMocks();
});
```

**Why**: Ensures test isolation and prevents mock state leaking between tests

---

## Phase 3: Hook Testing (2-3 hours)

Add test files for all 4 untested hooks.

### 3.1 Create useApi.test.ts with Integration Tests

**File**: `/tests/hooks/useApi.test.ts`

**Current Status**: Only pattern verification, no actual hook testing

**Required Addition**:
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useHighlights } from '../../hooks/useApi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';

// Create wrapper with QueryClient
const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    return ({ children }: any) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
};

describe('useApi Hooks', () => {
    describe('useHighlights', () => {
        it('should fetch highlights successfully', async () => {
            const { result } = renderHook(() => useHighlights(10), {
                wrapper: createWrapper(),
            });

            // Initial loading state
            expect(result.current.isLoading).toBe(true);

            // Wait for data
            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(result.current.data).toBeDefined();
            expect(Array.isArray(result.current.data)).toBe(true);
        });

        it('should handle errors gracefully', async () => {
            // Mock service error
            jest.spyOn(HighlightService, 'getHighlights')
                .mockResolvedValue({ success: false, error: 'Network error' });

            const { result } = renderHook(() => useHighlights(10), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isError).toBe(true);
            });
        });
    });

    describe('useBookingHistory', () => {
        it('should fetch user bookings', async () => {
            const { result } = renderHook(() => useBookingHistory(), {
                wrapper: createWrapper(),
            });

            await waitFor(() => {
                expect(result.current.isLoading).toBe(false);
            });

            expect(Array.isArray(result.current.data)).toBe(true);
        });
    });

    // Similar tests for: useActiveBooking, useCourts, useUser
});
```

**Coverage Target**: Reach 80%+ for useApi.ts

---

### 3.2 Create useNetwork.test.ts

**File**: `/tests/hooks/useNetwork.test.ts`

**Template**:
```typescript
import { renderHook } from '@testing-library/react-native';
import { useNetwork } from '../../hooks/useNetwork';

describe('useNetwork Hook', () => {
    it('should detect online status', () => {
        const { result } = renderHook(() => useNetwork());

        // Expect online initially
        expect(typeof result.current.isOnline).toBe('boolean');
    });

    it('should handle offline transition', async () => {
        const { result } = renderHook(() => useNetwork());

        // Simulate offline event
        // Check state changes
    });

    it('should queue operations when offline', () => {
        // Test queue behavior
    });
});
```

**Coverage Target**: 70%+ for useNetwork.ts

---

### 3.3 Create useBookingRealtime.test.ts

**File**: `/tests/hooks/useBookingRealtime.test.ts`

**Template**:
```typescript
describe('useBookingRealtime Hook', () => {
    it('should subscribe to booking changes', () => {
        // Test subscription setup
    });

    it('should update state on booking change', () => {
        // Test real-time update handling
    });

    it('should cleanup subscription on unmount', () => {
        // Test cleanup
    });
});
```

---

### 3.4 Create usePushNotifications.test.ts

**File**: `/tests/hooks/usePushNotifications.test.ts`

**Template**:
```typescript
describe('usePushNotifications Hook', () => {
    it('should request notification permissions', async () => {
        // Test permission request
    });

    it('should handle notification received', () => {
        // Test notification handling
    });
});
```

---

## Phase 4: Missing Service Tests (3-4 hours)

Add unit tests for 7 untested services.

### 4.1 Priority Services to Test

**High Priority** (most critical):
1. `match.service.ts` - Player matching algorithm (628 LOC)
2. `push.service.ts` - Push notifications (438 LOC)
3. `realtime.service.ts` - Real-time subscriptions (207 LOC)

**Medium Priority**:
4. `notification.service.ts` - Local notifications (82 LOC)
5. `review.service.ts` - Court reviews (288 LOC)
6. `transaction.service.ts` - Transaction handling (99 LOC)
7. `api.ts` - Base API service (55 LOC)

### 4.2 Create match.service.test.ts

**File**: `/tests/services/match.service.test.ts`

**Template**:
```typescript
import { MatchService } from '../../services/match.service';
import { supabase } from '../../lib/supabase';

describe('MatchService', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findMatches', () => {
        it('should return empty array when no players available', async () => {
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
            });

            const result = await MatchService.findMatches('user123');
            expect(result.success).toBe(true);
            expect(result.data).toEqual([]);
        });

        it('should filter by rating range', async () => {
            const mockPlayers = [
                { id: 'p1', name: 'Player 1', rating: 4.0 },
                { id: 'p2', name: 'Player 2', rating: 3.5 },
            ];

            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
                order: jest.fn().mockResolvedValue({ data: mockPlayers, error: null }),
            });

            const result = await MatchService.findMatches('user123', { minRating: 3.5 });
            expect(result.success).toBe(true);
            expect(result.data.length).toBe(2);
        });
    });

    // Additional test suites for: createMatch, acceptMatch, rejectMatch, etc.
});
```

**Coverage Target**: 70%+ for match.service.ts

---

### 4.3 Create push.service.test.ts

**File**: `/tests/services/push.service.test.ts`

**Template**:
```typescript
import { PushService } from '../../services/push.service';
import { supabase } from '../../lib/supabase';

describe('PushService', () => {
    describe('registerDevice', () => {
        it('should save device token to database', async () => {
            const mockUser = { id: 'user123' };
            (supabase.auth.getUser as jest.Mock).mockResolvedValue({
                data: { user: mockUser },
            });

            (supabase.from as jest.Mock).mockReturnValue({
                insert: jest.fn().mockReturnThis(),
                eq: jest.fn().mockResolvedValue({ error: null }),
            });

            const result = await PushService.registerDevice('device-token-123');
            expect(result.success).toBe(true);
        });
    });

    describe('sendNotification', () => {
        it('should send push notification', async () => {
            // Mock notification sending
            const result = await PushService.sendNotification('user123', {
                title: 'Test',
                body: 'Test message',
            });

            expect(result.success).toBe(true);
        });
    });
});
```

---

## Phase 5: Store and Library Tests (1-2 hours)

### 5.1 Fix authStore.test.ts

**File**: `/tests/stores/authStore.test.ts`

**Current Issue**: Tests literals, not actual store methods

**Replace with**:
```typescript
import { useAuthStore } from '../../stores/authStore';

describe('AuthStore', () => {
    beforeEach(() => {
        useAuthStore.setState({
            user: null,
            loading: true,
            initialized: false,
        });
    });

    describe('Initialization', () => {
        it('should have correct initial state', () => {
            const { user, loading, initialized } = useAuthStore.getState();
            expect(user).toBeNull();
            expect(loading).toBe(true);
            expect(initialized).toBe(false);
        });
    });

    describe('setUser', () => {
        it('should set user and update loading state', () => {
            const mockUser = { id: 'user-123', email: 'test@example.com' };

            useAuthStore.setState({
                user: mockUser,
                loading: false,
                initialized: true,
            });

            const state = useAuthStore.getState();
            expect(state.user).toEqual(mockUser);
            expect(state.loading).toBe(false);
        });
    });

    describe('signOut', () => {
        it('should clear user on sign out', () => {
            useAuthStore.setState({ user: null, loading: false });

            const { user } = useAuthStore.getState();
            expect(user).toBeNull();
        });
    });
});
```

---

### 5.2 Create recordingStore.test.ts

**File**: `/tests/stores/recordingStore.test.ts`

**Template**:
```typescript
import { useRecordingStore } from '../../stores/recordingStore';

describe('RecordingStore', () => {
    beforeEach(() => {
        useRecordingStore.setState({
            isRecording: false,
            recordedUri: null,
            progress: 0,
        });
    });

    describe('startRecording', () => {
        it('should set recording state', () => {
            useRecordingStore.setState({ isRecording: true });
            expect(useRecordingStore.getState().isRecording).toBe(true);
        });
    });

    describe('stopRecording', () => {
        it('should save recorded video URI', () => {
            useRecordingStore.setState({
                isRecording: false,
                recordedUri: '/path/to/video.mp4',
            });

            expect(useRecordingStore.getState().recordedUri).toBe('/path/to/video.mp4');
        });
    });
});
```

---

### 5.3 Add lib/security.test.ts

**File**: `/tests/lib/security.test.ts`

**Critical Tests**:
```typescript
import { encrypt, decrypt, hashPassword } from '../../lib/security';

describe('Security Utilities', () => {
    describe('encrypt/decrypt', () => {
        it('should encrypt and decrypt data', () => {
            const original = 'sensitive-data';
            const encrypted = encrypt(original);

            expect(encrypted).not.toBe(original);
            expect(decrypt(encrypted)).toBe(original);
        });

        it('should handle null input', () => {
            const result = encrypt(null);
            expect(result).toBeDefined();
        });
    });

    describe('hashPassword', () => {
        it('should produce consistent hash', () => {
            const password = 'test123';
            const hash1 = hashPassword(password);
            const hash2 = hashPassword(password);

            expect(hash1).toBe(hash2);
        });

        it('should not expose password in hash', () => {
            const hash = hashPassword('password123');
            expect(hash).not.toContain('password');
            expect(hash).not.toContain('123');
        });
    });
});
```

---

## Phase 6: Edge Case and Integration Tests (2-3 hours)

### 6.1 Add Edge Case Tests to booking.service.test.ts

**Add these test suites**:
```typescript
describe('Booking Edge Cases', () => {
    describe('Concurrent Bookings', () => {
        it('should handle race condition on same slot', async () => {
            // Test concurrent booking attempts
        });
    });

    describe('Refund Calculations', () => {
        it('should calculate refund based on cancellation time', async () => {
            // Test partial refund logic
        });

        it('should not refund if cancelled after deadline', async () => {
            // Test no refund scenario
        });
    });

    describe('Timezone Handling', () => {
        it('should handle different timezones correctly', async () => {
            // Test timezone conversion
        });
    });

    describe('Expiration', () => {
        it('should mark pending bookings as expired', async () => {
            // Test expiration logic
        });
    });
});
```

---

### 6.2 Add Network Error Tests

**File**: `/tests/services/upload.test.ts` - Add:
```typescript
describe('Network Resilience', () => {
    it('should retry on network timeout', async () => {
        (supabase.storage.from as jest.Mock).mockReturnValue({
            upload: jest.fn().mockRejectedValue(new Error('Network timeout')),
        });

        // Should implement retry logic
        // This test verifies retry mechanism
    });

    it('should handle partial uploads', async () => {
        // Test resume from checkpoint
    });
});
```

---

### 6.3 Create End-to-End Booking Flow Test

**File**: `/tests/integration/complete-booking-flow.test.ts`

**Template**:
```typescript
import { AuthService } from '../../services/auth.service';
import { BookingService } from '../../services/booking.service';
import { CourtService } from '../../services/court.service';
import { supabase } from '../../lib/supabase';

describe('Complete Booking Flow E2E', () => {
    it('should complete booking from court selection to confirmation', async () => {
        // 1. Setup mock user
        const mockUser = { id: 'user-123', email: 'test@example.com' };
        (supabase.auth.getUser as jest.Mock).mockResolvedValue({
            data: { user: mockUser },
        });

        // 2. Get available courts
        const courts = await CourtService.getCourts();
        expect(courts.success).toBe(true);
        expect(courts.data.length).toBeGreaterThan(0);

        // 3. Check user profile/credits
        const user = await AuthService.getCurrentUser();
        expect(user.data?.credits).toBeGreaterThan(0);

        // 4. Create booking
        const booking = await BookingService.createBooking({
            courtId: courts.data[0].id,
            startTime: Date.now() + 3600000,
            durationHours: 1,
        });
        expect(booking.success).toBe(true);
        expect(booking.data?.status).toBe('pending');
    });
});
```

---

## Implementation Checklist

### Week 1
- [ ] Fix Supabase mock chain (1.1)
- [ ] Fix checkSlotConflict mock (1.2)
- [ ] Fix Admin Service mocks (1.3)
- [ ] Update jest.config.js (2.1)
- [ ] Update tests/setup.ts (2.2)
- [ ] Create useApi integration tests (3.1)
- [ ] Create useNetwork tests (3.2)
- [ ] Run: `npm test` - All tests should pass

### Week 2
- [ ] Create useBookingRealtime tests (3.3)
- [ ] Create usePushNotifications tests (3.4)
- [ ] Create match.service tests (4.2)
- [ ] Create push.service tests (4.3)
- [ ] Fix authStore tests (5.1)
- [ ] Create recordingStore tests (5.2)
- [ ] Run: `npm test` - Coverage should exceed 50%

### Week 3
- [ ] Add edge case tests (6.1)
- [ ] Add network error tests (6.2)
- [ ] Create E2E booking flow test (6.3)
- [ ] Add remaining service tests (notification, review, transaction)
- [ ] Run: `npm test` - Coverage should exceed 60%

---

## Success Criteria

| Metric | Current | Target |
|--------|---------|--------|
| Test Pass Rate | 93% | 100% |
| Line Coverage | 17.84% | 60%+ |
| Statement Coverage | 17.69% | 60%+ |
| Hook Coverage | 0% | 70%+ |
| Service Coverage | 25.09% | 70%+ |
| Store Coverage | 0% | 70%+ |
| Branch Coverage | 19.58% | 50%+ |
| Function Coverage | 14.68% | 50%+ |

---

## File Changes Summary

**Files to Modify**:
1. `/tests/setup.ts` - Add missing query builder methods
2. `/tests/services/booking.service.test.ts` - Add checkSlotConflict spy
3. `/tests/services/admin.service.test.ts` - Fix mock implementations
4. `/jest.config.js` - Add preset, coverage config
5. `/tests/stores/authStore.test.ts` - Replace with actual store tests

**Files to Create**:
1. `/tests/hooks/useApi.integration.test.ts` - Hook integration tests
2. `/tests/hooks/useNetwork.test.ts` - Network hook tests
3. `/tests/hooks/useBookingRealtime.test.ts` - Real-time hook tests
4. `/tests/hooks/usePushNotifications.test.ts` - Push notification tests
5. `/tests/services/match.service.test.ts` - Match service tests
6. `/tests/services/push.service.test.ts` - Push service tests
7. `/tests/services/realtime.service.test.ts` - Real-time service tests
8. `/tests/services/notification.service.test.ts` - Notification tests
9. `/tests/services/review.service.test.ts` - Review tests
10. `/tests/services/transaction.service.test.ts` - Transaction tests
11. `/tests/stores/recordingStore.test.ts` - Recording store tests
12. `/tests/lib/security.test.ts` - Security utility tests
13. `/tests/integration/complete-booking-flow.test.ts` - E2E booking flow

---

**Estimated Timeline**: 8-10 hours
**Recommended Approach**: Implement phases sequentially, run tests after each phase
**Block on**: Phase 1 must complete before any other phases
