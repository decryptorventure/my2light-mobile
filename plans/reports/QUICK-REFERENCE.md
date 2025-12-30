# Testing Review - Quick Reference Card

## Test Results Summary

```
✓ 83 tests passed
✗ 6 tests failed
━━━━━━━━━━━━━━━━━
93% pass rate (needs 100%)
```

## Critical Failures

### 1. Supabase Mock Chain (4 tests affected)

**Files**: `tests/setup.ts` | Lines 15-30
**Issue**: Missing `.in()`, `.or()`, `.gt()` methods in query builder mock
**Tests**:

- BookingService › getActiveBooking (2 tests)
- AdminService › getDashboardStats
- AdminService › cancelBooking

**Fix** (30 min):

```typescript
// In tests/setup.ts after .lte, add:
gt: jest.fn().mockReturnThis(),
or: jest.fn().mockReturnThis(),
```

---

### 2. Missing Mock Spy (1 test affected)

**File**: `tests/services/booking.service.test.ts` | Line 156
**Test**: createBooking › insufficient credits
**Issue**: `checkSlotConflict` not mocked, returns conflict error before credit check

**Fix** (15 min):

```typescript
// Add before service call (line 165):
jest.spyOn(BookingService, "checkSlotConflict").mockResolvedValue(false);
```

---

### 3. Admin Service Mock (2 tests affected)

**File**: `tests/services/admin.service.test.ts` | Line 46
**Tests**:

- createCourtOwnerProfile › create successfully
- getDashboardStats › return calculated stats

**Issue**: Mock doesn't support `.select()` method on court_owners table

**Fix** (20 min):

```typescript
// In mockImplementation for court_owners, add:
select: jest.fn().mockReturnThis(),
eq: jest.fn().mockReturnThis(),
maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
```

---

## Coverage Breakdown

| Category | Coverage | Target | Gap  |
| -------- | -------- | ------ | ---- |
| Services | 25%      | 70%    | -45% |
| Hooks    | 0%       | 70%    | -70% |
| Stores   | 50%      | 70%    | -20% |
| Overall  | 17.69%   | 60%    | -42% |

---

## Untested Critical Code (0% coverage)

🔴 **CRITICAL** (1066+ LOC):

- Match service (628 LOC) - Player matching algorithm
- Push service (438 LOC) - Push notifications
- Security library (148 LOC) - Encryption/hashing

🟠 **HIGH** (647+ LOC):

- All 4 hooks (1052 LOC total) - API, network, realtime, notifications
- Recording store (135 LOC)
- Real-time service (207 LOC)
- Review service (288 LOC)

🟡 **MEDIUM** (untested scenarios):

- Booking service edge cases (concurrent, conflicts, refunds)
- Auth service security flows
- Network/offline scenarios
- Error handling paths

---

## Jest Configuration Issues

**File**: `jest.config.js`

**Missing**:

- ✗ `preset: 'jest-expo'` (required for React Native)
- ✗ Coverage thresholds (can't enforce minimum)
- ✗ `hooks/` in collectCoverageFrom
- ✗ `stores/` in collectCoverageFrom

**Impact**: Configuration doesn't properly support React Native, can't track coverage gaps

---

## Implementation Priorities

### Phase 1: CRITICAL (1-2 hours)

1. ✅ Fix Supabase mock chain (4 tests)
2. ✅ Add checkSlotConflict spy (1 test)
3. ✅ Fix admin service mocks (2 tests)
4. ✅ Run: `npm test` should have 100% pass rate

### Phase 2: HIGH (45 minutes)

1. Update `jest.config.js` - add preset and thresholds
2. Update `tests/setup.ts` - improve test isolation
3. Run coverage check - should show hooks/stores

### Phase 3: HIGH (2-3 hours)

1. Add 4 hook tests (~800 LOC)
2. Add 3 critical service tests (match, push, security)
3. Coverage should reach 40%

### Phase 4: MEDIUM (3-4 hours)

1. Add 7 remaining service tests
2. Add edge case tests
3. Add error/network scenario tests
4. Coverage should reach 60%+

---

## Key Metrics

```
BEFORE:                 AFTER (Target):
Tests: 83/89 pass       Tests: 89/89 pass
Coverage: 17.69%        Coverage: 60%+
Hooks: 0%               Hooks: 70%+
Services: 25%           Services: 70%+
Stores: 50%             Stores: 70%+
```

---

## Files to Create

**Hook Tests**:

- [ ] `tests/hooks/useApi.test.ts`
- [ ] `tests/hooks/useNetwork.test.ts`
- [ ] `tests/hooks/useBookingRealtime.test.ts`
- [ ] `tests/hooks/usePushNotifications.test.ts`

**Service Tests**:

- [ ] `tests/services/match.service.test.ts`
- [ ] `tests/services/push.service.test.ts`
- [ ] `tests/services/realtime.service.test.ts`
- [ ] `tests/services/notification.service.test.ts`
- [ ] `tests/services/review.service.test.ts`
- [ ] `tests/services/transaction.service.test.ts`
- [ ] `tests/lib/security.test.ts`

**Store Tests**:

- [ ] `tests/stores/recordingStore.test.ts`
- [ ] Update `tests/stores/authStore.test.ts` (replace literal tests)

**Integration Tests**:

- [ ] `tests/integration/complete-booking-flow.test.ts`

---

## Files to Modify

**Critical**:

- [ ] `tests/setup.ts` - Add missing query builder methods
- [ ] `tests/services/booking.service.test.ts` - Add checkSlotConflict spy
- [ ] `tests/services/admin.service.test.ts` - Fix mock implementations
- [ ] `jest.config.js` - Add preset and coverage config

---

## Common Test Patterns

### Test Query Builder Chain

```typescript
(supabase.from as jest.Mock).mockReturnValue({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
});
```

### Test Hook Integration

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { useHighlights } from "../../hooks/useApi";

describe("useHighlights", () => {
    it("should fetch highlights", async () => {
        const { result } = renderHook(() => useHighlights(10));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(Array.isArray(result.current.data)).toBe(true);
    });
});
```

### Test Zustand Store

```typescript
import { useAuthStore } from "../../stores/authStore";

describe("AuthStore", () => {
    beforeEach(() => {
        useAuthStore.setState({ user: null });
    });

    it("should set user", () => {
        useAuthStore.setState({ user: mockUser });
        expect(useAuthStore.getState().user).toEqual(mockUser);
    });
});
```

---

## Detailed Reports

📄 **Full Analysis**: `code-reviewer-251230-1621-testing-review.md`

- Complete issue breakdown
- Coverage analysis by file
- 10 recommendations with context

📋 **Action Plan**: `code-reviewer-251230-1621-testing-action-plan.md`

- Step-by-step implementation guide
- Code templates for all tests
- 6-phase rollout plan
- Success criteria

📝 **Summary**: `TESTING-REVIEW-SUMMARY.txt`

- Executive overview
- Risk assessment
- Timeline estimates

---

## Next Actions

1. **TODAY**: Fix 3 critical mock issues (1-2 hours)
    - `tests/setup.ts` - Add missing methods
    - `tests/services/booking.service.test.ts` - Add spy
    - `tests/services/admin.service.test.ts` - Fix mocks

2. **TOMORROW**: Update Jest configuration (45 min)
    - `jest.config.js` - Add preset, thresholds, paths
    - `tests/setup.ts` - Improve isolation

3. **THIS WEEK**: Add hook tests (2-3 hours)
    - 4 hook test files with integration tests

4. **NEXT WEEK**: Expand service coverage (3-4 hours)
    - 3 critical services (match, push, realtime)
    - 4 secondary services
    - Edge cases and error scenarios

---

**Report Generated**: 2025-12-30
**Status**: Ready for Implementation
**Blocking Issues**: 6 failing tests (Phase 1 fixes required)
