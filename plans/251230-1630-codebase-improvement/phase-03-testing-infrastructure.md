# Phase 3: Testing Infrastructure

**Priority:** HIGH | **Status:** pending | **Effort:** 12h | **Date:** 2025-12-30

[← Back to Plan](plan.md)

---

## Context

Test coverage 17.69% with 6 failing tests due to incomplete Supabase mocks. Critical services, hooks, and stores untested.

**Source:** [Testing Review Report](../../reports/code-reviewer-251230-1621-testing-review.md)

**Current Issues:**
- 6 test failures (mock chain incomplete)
- Hooks: 0% coverage (0/4 files)
- Stores: 50% coverage (1/2 files)
- Services: 7/14 untested
- Integration tests weak

**Target:** 60%+ overall coverage

---

## Key Insights

### Test Failure Root Causes
1. **Supabase mock missing `.in()`, `.or()`, `.gt()` methods**
2. **checkSlotConflict not mocked properly in booking tests**
3. **admin.service.test.ts mock implementation gaps**

### Coverage Gaps (High Risk)
- **Match service** (628 LOC) - 0% coverage
- **Push service** (438 LOC) - 0% coverage
- **Real-time service** - 0% coverage
- **All hooks** (useApi, useNetwork, etc.) - 0% coverage
- **Recording store** - 0% coverage

---

## Requirements

### Must Fix
- [ ] Fix all 6 failing tests
- [ ] Complete Supabase mock chain
- [ ] Add coverage for all hooks (4 files)
- [ ] Test critical services (match, push, realtime)
- [ ] Recording store tests

### Should Add
- [ ] Integration tests for booking flow
- [ ] Edge case tests (network errors, timeouts)
- [ ] Coverage thresholds in jest.config.js
- [ ] jest-expo preset

### Nice to Have
- [ ] E2E tests with Maestro
- [ ] Visual regression tests
- [ ] Performance benchmarks

---

## Implementation Steps

### Step 1: Fix Supabase Mock Chain (30min)

**Update `/tests/setup.ts`:**
```typescript
from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),        // ADD
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),        // ADD
    or: jest.fn().mockReturnThis(),        // ADD
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
}))
```

---

### Step 2: Fix Failing Tests (1.5h)

**booking.service.test.ts:**
```typescript
// Fix insufficient credits test
jest.spyOn(BookingService, 'checkSlotConflict').mockResolvedValue(false);
```

**admin.service.test.ts:**
- Fix mock implementation to return proper query chain
- Ensure `.select()` returns chainable object

**Run tests:**
```bash
npm test
# Should pass all 89 tests
```

---

### Step 3: Add Hook Tests (3h)

**Test files to create:**
- `tests/hooks/useApi.test.ts`
- `tests/hooks/useBookingRealtime.test.ts`
- `tests/hooks/useNetwork.test.ts`
- `tests/hooks/usePushNotifications.test.ts`

**Example: useApi.test.ts**
```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useHighlights } from '@/features/highlights/hooks/useHighlights';

describe('useHighlights Hook', () => {
    let queryClient: QueryClient;

    beforeEach(() => {
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        });
    });

    it('should fetch highlights successfully', async () => {
        const wrapper = ({ children }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        const { result } = renderHook(() => useHighlights({ limit: 10 }), { wrapper });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toBeDefined();
    });
});
```

---

### Step 4: Add Service Tests (4h)

**Priority services:**
1. **Match service** (highest risk, 628 LOC)
2. **Push service** (438 LOC)
3. **Real-time service**
4. **Notification service**

**Template:**
```typescript
import { MatchService } from '@/services/match.service';
import { supabase } from '@/lib/supabase';

jest.mock('@/lib/supabase');

describe('MatchService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('findMatches', () => {
        it('should return matches based on rating', async () => {
            // Mock implementation
            (supabase.from as jest.Mock).mockReturnValue({
                select: jest.fn().mockReturnThis(),
                eq: jest.fn().mockReturnThis(),
                gte: jest.fn().mockReturnThis(),
                lte: jest.fn().mockReturnThis(),
            });

            const result = await MatchService.findMatches({
                rating: 1500,
                sport: 'pickleball'
            });

            expect(result.success).toBe(true);
        });
    });
});
```

---

### Step 5: Add Store Tests (1.5h)

**recordingStore.test.ts:**
```typescript
import { useRecordingStore } from '@/features/recording/recordingStore';
import { act } from '@testing-library/react-native';

describe('RecordingStore', () => {
    beforeEach(() => {
        useRecordingStore.getState().reset();
    });

    it('should start recording', () => {
        act(() => {
            useRecordingStore.getState().startRecording();
        });

        expect(useRecordingStore.getState().isRecording).toBe(true);
    });

    it('should add highlight during recording', () => {
        act(() => {
            useRecordingStore.getState().startRecording();
            useRecordingStore.getState().addHighlight({
                type: 'spike',
                timestamp: 1000
            });
        });

        expect(useRecordingStore.getState().highlights).toHaveLength(1);
    });
});
```

---

### Step 6: Update Jest Configuration (30min)

**jest.config.js:**
```javascript
module.exports = {
    preset: 'jest-expo',  // ADD
    testEnvironment: 'node',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testMatch: ['<rootDir>/tests/**/*.test.ts', '<rootDir>/tests/**/*.test.tsx'],
    collectCoverage: true,
    collectCoverageFrom: [
        'services/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',           // ADD
        'stores/**/*.{ts,tsx}',          // ADD
        'src/features/**/*.{ts,tsx}',    // ADD
        'lib/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    coverageThreshold: {                 // ADD
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },
};
```

---

### Step 7: Integration Tests (1.5h)

**tests/integration/booking-flow.test.ts:**
```typescript
describe('Booking Flow Integration', () => {
    it('should complete full booking flow', async () => {
        // 1. User selects court
        const court = await CourtService.getCourtById('court-1');
        expect(court.success).toBe(true);

        // 2. Check availability
        const conflict = await BookingService.checkSlotConflict({
            courtId: 'court-1',
            startTime: new Date(),
            endTime: new Date(Date.now() + 3600000)
        });
        expect(conflict).toBe(false);

        // 3. Create booking
        const booking = await BookingService.createBooking({
            courtId: 'court-1',
            packageId: 'package-1',
            startTime: new Date()
        });
        expect(booking.success).toBe(true);

        // 4. Verify deduction
        const user = await AuthService.getCurrentUser();
        expect(user.data.credits).toBeLessThan(200000);
    });
});
```

---

## Todo Checklist

### Fix Failing Tests
- [ ] Update Supabase mock chain
- [ ] Fix booking.service.test.ts (checkSlotConflict)
- [ ] Fix admin.service.test.ts (3 tests)
- [ ] Verify all 89 tests pass

### Hook Testing
- [ ] useApi.test.ts
- [ ] useBookingRealtime.test.ts
- [ ] useNetwork.test.ts
- [ ] usePushNotifications.test.ts
- [ ] Achieve 60%+ hook coverage

### Service Testing
- [ ] match.service.test.ts
- [ ] push.service.test.ts
- [ ] realtime.service.test.ts
- [ ] notification.service.test.ts
- [ ] review.service.test.ts
- [ ] transaction.service.test.ts

### Store Testing
- [ ] recordingStore.test.ts
- [ ] Improve authStore.test.ts (actual methods)

### Configuration
- [ ] Add jest-expo preset
- [ ] Update collectCoverageFrom
- [ ] Add coverage thresholds
- [ ] Configure CI test reporting

### Integration Tests
- [ ] Booking flow test
- [ ] Auth flow test
- [ ] Video upload flow test
- [ ] Real-time updates test

---

## Success Criteria

- [ ] All 89+ tests passing
- [ ] Overall coverage ≥60%
- [ ] Hooks coverage ≥60%
- [ ] Critical services coverage ≥70%
- [ ] Zero mock chain errors
- [ ] CI test reporting integrated

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Tests too brittle | Use behavior testing over implementation |
| Mock complexity | Keep mocks simple, test real behavior |
| Coverage gaming | Review coverage reports for meaningful tests |
| Slow test suite | Parallelize tests, optimize setup |

---

## Next Steps

After Phase 3 completion:
1. Generate coverage report
2. Review uncovered critical paths
3. Proceed to Phase 4 (Code Organization)

---

**Estimated Effort:** 12 hours
**Depends On:** Phase 2 (for consistent code style)
**Blocks:** Production deployment
