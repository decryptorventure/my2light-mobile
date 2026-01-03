# Code Review: Architecture & Project Structure

**Date:** 2026-01-03
**Reviewer:** code-reviewer
**Scope:** Full architecture & project structure analysis
**Codebase:** my2light-mobile v2.3.0

---

## Executive Summary

**Overall Architecture Rating: 5/10**

The codebase is in **mid-migration state** with **significant technical debt** from incomplete refactoring. While the intended feature-based architecture is sound, execution is inconsistent. Major issues: code duplication (services, stores, lib files), monolithic screen files (up to 919 lines), poor import hygiene (71% relative paths), and weak separation of concerns.

**Status:** ⚠️ **NEEDS SIGNIFICANT CLEANUP**

---

## Scope

**Files Reviewed:**
- 42 screen files in `app/`
- 22 feature files in `src/features/`
- 11 legacy services in `services/`
- 4 partial feature services in `src/features/*/`
- Path alias configuration
- Directory structure & organization

**Metrics:**
- Total codebase: ~1.04 MB
- app/ (largest): 551K - contains most logic
- services/ (legacy): 134K - still heavily used
- src/ (new): 203K - **underutilized**
- Duplicate lib/ folders: 29K + files in src/lib/

---

## Critical Issues

### 1. **Code Duplication & Incomplete Migration** ❌

**Duplicate Services (11 old vs 4 partial new):**

```
LEGACY (still in use):          NEW (partially created, unused):
/services/                      /src/features/
├── auth.service.ts (187L)      ├── auth/auth.service.ts (unused)
├── highlight.service.ts (220L) ├── highlights/highlight.service.ts (134L)
├── booking.service.ts (490L)   ├── bookings/booking.service.ts (unused)
├── court.service.ts (105L)     ├── courts/court.service.ts (unused)
├── admin.service.ts (605L)     └── (missing: match, admin, notifications, etc.)
├── match.service.ts (681L)
├── notification.service.ts (92L)
├── push.service.ts (449L)
├── realtime.service.ts (212L)
├── review.service.ts (304L)
└── transaction.service.ts (108L)
```

**Impact:**
- All 42 screens import from OLD `/services/` (not new `/src/features/`)
- Duplicate supabase.ts with **different implementations**:
  - `/lib/supabase.ts`: 64 lines, custom storage logging, waitForSession helper
  - `/src/lib/supabase.ts`: 18 lines, basic AsyncStorage
- Duplicate authStore:
  - `/stores/authStore.ts`: 188 lines, used by all screens
  - `/src/features/auth/authStore.ts`: 126 lines, **never imported**
- Maintenance burden: changes must be made in 2 places

**Evidence:**

```bash
# All screens use OLD services
$ grep -r "from.*services/" app/ --include="*.tsx" | wc -l
85  # 85 imports from legacy services

# Virtually no use of new features
$ grep -r "from.*@/features" app/ --include="*.tsx" | wc -l
1   # Only HighlightCard component used once
```

**Recommendation:**
- **COMPLETE migration** or **ABANDON** new structure
- Delete unused `/src/features/*/` service files OR migrate all screens to use them
- Consolidate duplicate files (supabase.ts, authStore.ts)

---

### 2. **Monolithic Screen Files** ❌

**Files Exceeding Recommended Size (>300 lines):**

| File | Lines | Issues |
|------|-------|--------|
| `app/booking/[id].tsx` | **919** | Complex 3-step flow, all logic inline |
| `app/onboarding/index.tsx` | **759** | 6-step wizard, no component extraction |
| `app/match/[id].tsx` | **665** | Chat + match details + actions |
| `app/(tabs)/index.tsx` | **659** | Home feed, search, court list |
| `app/video/[id].tsx` | **604** | Video player + comments + actions |
| `app/feed/index.tsx` | **512** | TikTok-style feed, swipe logic |
| `app/my-bookings/index.tsx` | **501** | Booking list + filters + actions |

**Total:** 7 files > 500 lines, 20+ files > 300 lines

**Example - booking/[id].tsx (919 lines):**

```tsx
// ❌ ALL logic in one file:
- 3-step wizard state management (datetime, package, payment)
- Court data fetching
- Real-time slot availability
- Payment processing
- Form validation
- User credit checks
- Time slot rendering
- Package selection UI
```

**Should be split into:**

```
app/booking/[id].tsx (orchestrator, ~150 lines)
├── components/
│   ├── DateTimeStep.tsx (~200 lines)
│   ├── PackageStep.tsx (~150 lines)
│   ├── PaymentStep.tsx (~200 lines)
│   ├── TimeSlotGrid.tsx (~100 lines)
│   └── BookingSummary.tsx (~80 lines)
└── hooks/
    ├── useBookingWizard.ts (state management)
    ├── useSlotAvailability.ts (real-time logic)
    └── useBookingPayment.ts (payment logic)
```

**Recommendation:**
- **EXTRACT components** from files >300 lines
- **MOVE business logic** to custom hooks
- Apply **Single Responsibility Principle**

---

### 3. **Import Structure Violations** ❌

**Path Alias Usage:**

```bash
Relative imports (../../): 85 occurrences (71%)
Alias imports (@/):        35 occurrences (29%)
```

**Code Standards Violation:**
- 71% of imports use relative paths
- Standard mandates `@/` aliases for shared modules

**Examples:**

```tsx
// ❌ BAD - Deep relative paths in app/onboarding/index.tsx
import { AuthService } from "../../services/auth.service";
import { uploadAvatar } from "../../services/upload";
import haptics from "../../lib/haptics";

// ✅ GOOD - Should use aliases
import { AuthService } from "@/services/auth.service";
import { uploadAvatar } from "@/services/upload";
import haptics from "@/lib/haptics";
```

**Additional Issues:**

```tsx
// hooks/useApi.ts line 2 - violates own standards
import { ApiService } from "../services/api";  // ❌ relative
// Should be:
import { ApiService } from "@/services/api";   // ✅ alias
```

**Recommendation:**
- **REFACTOR all relative imports** to use `@/` aliases
- Run automated tool: `npx eslint --fix` with import order rule
- Add pre-commit hook to enforce alias usage

---

### 4. **Weak Separation of Concerns** ❌

**Business Logic Leaking into Screens:**

```tsx
// ❌ app/onboarding/index.tsx - Direct service calls in component
const handleFinish = async () => {
    setLoading(true);
    const result = await AuthService.updateProfile(user!.id, {
        name,
        avatar,
        skill_level: skillLevel,
        play_style: playStyle,
        profile_completed: true
    });
    // ... error handling in component
};
```

**Should be:**

```tsx
// ✅ Move to custom hook
const { updateProfile, isUpdating } = useProfileUpdate();
const handleFinish = () => updateProfile({ name, avatar, skillLevel, playStyle });
```

**Monolithic Hooks:**

```
/hooks/useApi.ts - 7946 lines ❌
├── useHighlights
├── useUserHighlights
├── useCreateHighlight
├── useToggleLike
├── useCourts
├── useCourtDetail
├── useCurrentUser
├── useUserCredits
├── useBookings
├── useMatches
├── useNotifications
└── ... 20+ more hooks
```

**Should be organized by feature:**

```
/src/features/
├── highlights/hooks/useHighlights.ts
├── courts/hooks/useCourts.ts
├── bookings/hooks/useBookings.ts
├── matches/hooks/useMatches.ts
└── ...
```

**Recommendation:**
- **SPLIT** monolithic hooks/useApi.ts by feature
- **EXTRACT** business logic from screens to hooks
- **MOVE** hooks to their respective feature folders

---

### 5. **Poor Feature Modularization** ⚠️

**Current Feature Structure (Incomplete):**

```
src/features/
├── auth/
│   ├── authStore.ts ❌ (unused, duplicate exists in /stores)
│   ├── auth.service.ts ❌ (unused, /services/auth.service.ts used instead)
│   └── screens/ (empty, screens in /app instead)
├── highlights/
│   ├── components/HighlightCard.tsx ✅ (only feature component used!)
│   ├── hooks/useHighlights.ts ❌ (unused, /hooks/useApi.ts used instead)
│   └── highlight.service.ts ❌ (unused)
├── bookings/
│   ├── hooks/useBookings.ts ❌ (unused)
│   └── booking.service.ts ❌ (unused)
├── courts/
│   ├── hooks/useCourts.ts ❌ (unused)
│   └── court.service.ts ❌ (unused)
└── recording/
    ├── recordingStore.ts ✅ (used)
    └── screens/ (contains actual screens)
```

**Missing Features:**
- ❌ No `features/matches/`
- ❌ No `features/admin/`
- ❌ No `features/notifications/`
- ❌ No `features/profile/`

**Inconsistent Screen Placement:**
- Most screens in `/app/` (Expo Router requirement ✅)
- Some screens duplicated in `/src/features/*/screens/` (unused ❌)

**Recommendation:**
- **DECIDE**: Keep screens in /app/ (Expo Router) ✅
- **REMOVE** duplicate screens from /src/features/*/screens/
- **CREATE** feature folders for all domains:
  - features/matches/ (service, hooks, components, types)
  - features/admin/ (service, hooks, components, types)
  - features/notifications/ (service, hooks, components, types)
- **USE** feature exports consistently via index.ts

---

## High Priority Findings

### 6. **Inconsistent Barrel Exports** ⚠️

**Current State:**

```bash
# Barrel exports found:
/components/ui/index.ts ✅
/src/features/highlights/index.ts ✅
/src/features/bookings/index.ts ✅
/src/features/courts/index.ts ✅

# Missing barrel exports:
/src/features/auth/ ❌
/src/features/recording/ ❌
/services/ ❌
/hooks/ ❌
```

**Impact:**
- Inconsistent import patterns
- Harder to refactor (no central export point)

**Recommendation:**
- Add index.ts to ALL feature folders
- Create /services/index.ts for legacy services
- Enforce via ESLint rule

---

### 7. **Directory Structure Confusion** ⚠️

**Two Parallel Structures:**

```
OLD (in use):                  NEW (partially built, mostly unused):
/services/                     /src/features/*/
/hooks/                        /src/features/*/hooks/
/stores/                       /src/features/*/stores/
/lib/                          /src/lib/
/components/                   /src/shared/components/
```

**Documentation Mismatch:**

DOCS.md claims complete feature-based structure (lines 45-76), but reality is 80% legacy structure still in use.

**Recommendation:**
- Update DOCS.md to reflect ACTUAL structure
- Finish migration OR rollback to old structure
- Remove unused directories

---

### 8. **Shared Components Organization** ✅

**Good Structure:**

```
/components/ui/
├── Button.tsx
├── Input.tsx
├── Card.tsx
├── Skeleton.tsx
├── States.tsx
├── AnimatedCard.tsx
└── index.ts ✅

/src/shared/components/
├── AnimatedPressable.tsx
└── HapticTouchable.tsx
```

**Strengths:**
- Clear UI component library
- Good barrel exports
- Reusable components

**Minor Issue:**
- Duplication: components/ui vs src/shared/components
- Unclear when to use which location

**Recommendation:**
- **CONSOLIDATE** into one location: /components/ui/
- Move AnimatedPressable, HapticTouchable to /components/ui/

---

## Medium Priority Improvements

### 9. **Type Safety & Configuration** ⚠️

**TSConfig Issues:**

```bash
$ npm run type-check
error TS2468: Cannot find global value 'Promise'
error TS17004: Cannot use JSX unless the '--jsx' flag is provided
```

**Root Cause:**
tsconfig.json missing proper lib configuration for ES2015+ and React

**Current:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    // ❌ Missing: "lib", "jsx"
  }
}
```

**Should be:**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "lib": ["ES2020"],
    "jsx": "react-native",
    "target": "ES2020"
  }
}
```

**Recommendation:**
- Fix tsconfig.json to enable proper type checking
- Add "lib" and "jsx" compiler options
- Ensure `npm run type-check` passes

---

### 10. **Performance Concerns** ⚠️

**Large Monolithic Hooks:**

```tsx
// hooks/useApi.ts - 7946 lines
// All hooks defined in one file = larger bundle
// Should be code-split by feature
```

**Impact:**
- Larger initial bundle size
- Can't tree-shake unused hooks
- Harder to lazy-load features

**Recommendation:**
- Split hooks by feature
- Use React.lazy() for heavy screens
- Implement code splitting

---

## Low Priority Suggestions

### 11. **Naming Conventions** ✅

**Generally Good:**

```
✅ Components: PascalCase (Button.tsx, HighlightCard.tsx)
✅ Services: camelCase + .service suffix (auth.service.ts)
✅ Hooks: camelCase + use prefix (useAuth.ts)
✅ Stores: camelCase + Store suffix (authStore.ts)
```

**Minor Inconsistencies:**

```
⚠️ Some files use index.tsx in features (should be named after feature)
⚠️ _layout.tsx naming (Expo Router convention, acceptable)
```

---

### 12. **Documentation Quality** ⚠️

**Good:**
- Comprehensive DOCS.md with tech stack
- Code standards documented
- README with quick start

**Misleading:**
- DOCS.md describes ideal architecture, not actual state
- No migration guide for old → new structure
- Missing ADRs (Architecture Decision Records)

**Recommendation:**
- Update DOCS.md to match reality
- Add MIGRATION.md guide
- Document why migration stalled

---

## Positive Observations

### Strengths ✅

1. **Good foundation** - Feature-based structure is sound design
2. **UI component library** - Well organized with barrel exports
3. **Path aliases configured** - Just need to use them consistently
4. **Type safety enabled** - strict mode in tsconfig
5. **Testing infrastructure** - Jest setup, 85/89 tests passing
6. **Code standards documented** - Just not enforced

---

## Recommended Actions (Prioritized)

### Phase 1: Critical Cleanup (1-2 weeks)

1. **DECIDE migration strategy:**
   - Option A: Complete migration to /src/features/
   - Option B: Rollback to legacy /services/ structure
   - **Recommended:** Option A (finish what was started)

2. **Remove code duplication:**
   - Delete unused authStore in src/features/auth/ OR migrate all imports
   - Consolidate supabase.ts (choose one implementation)
   - Remove unused service duplicates

3. **Fix import hygiene:**
   - Convert all relative imports to @/ aliases
   - Add ESLint rule to enforce
   - Run: `npx @codemod/codemod imports/relative-to-alias`

### Phase 2: Refactoring (2-3 weeks)

4. **Split monolithic files:**
   - Extract components from booking/[id].tsx (919 → ~150 lines)
   - Extract components from onboarding/index.tsx (759 → ~200 lines)
   - Extract components from other 500+ line files

5. **Organize hooks by feature:**
   - Split hooks/useApi.ts (7946 lines) into feature folders
   - Move to src/features/*/hooks/

6. **Complete feature structure:**
   - Create features/matches/
   - Create features/admin/
   - Create features/notifications/

### Phase 3: Polish (1 week)

7. **Fix TypeScript config:**
   - Add lib, jsx to tsconfig.json
   - Ensure type-check passes

8. **Update documentation:**
   - Align DOCS.md with reality
   - Add MIGRATION.md guide

9. **Add automation:**
   - Pre-commit hooks for import order
   - ESLint rules for path aliases

---

## Metrics Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Code duplication | High (2x services, stores, lib) | None | ❌ |
| Files >500 lines | 7 files | 0 files | ❌ |
| Relative imports | 71% | <10% | ❌ |
| Feature completeness | 4/11 services | 11/11 | ❌ |
| Type coverage | Strict enabled | Strict enabled | ✅ |
| Test coverage | 25% | 70%+ | ⚠️ |
| Barrel exports | 4 files | All features | ⚠️ |

---

## Unresolved Questions

1. Why was migration to /src/features/ started but not completed?
2. Which supabase.ts implementation should be kept (old vs new)?
3. Should screens remain in /app/ or move to features? (Answer: Keep in /app/ for Expo Router)
4. What is timeline for completing migration?
5. Are there plans to add more comprehensive tests?

---

**Next Steps:**
- Review this report with team
- Decide on migration strategy (complete or rollback)
- Create implementation plan for Phase 1-3
- Assign ownership of cleanup tasks

**Estimated Effort:**
- Phase 1: 1-2 weeks (1 developer)
- Phase 2: 2-3 weeks (1 developer)
- Phase 3: 1 week (1 developer)
- **Total: 4-6 weeks**
