# Phase 4: Code Organization & Cleanup

**Priority:** MEDIUM | **Status:** pending | **Effort:** 8h | **Date:** 2025-12-30

[← Back to Plan](plan.md)

---

## Context

Codebase has duplicate components, theme files, and inconsistent import paths. TypeScript compilation blocked by import errors.

**Source:** [UI Components Review](../../reports/code-reviewer-251230-1621-ui-components.md), [State Management Review](../../reports/code-reviewer-251230-1621-state-mgmt.md)

**Critical Issues:**
- Duplicate theme files (2 locations)
- Duplicate components (HighlightCard, HapticTouchable, AnimatedPressable)
- TypeScript import path errors
- Mixed Image library usage (React Native vs expo-image)

---

## Key Insights

### Duplication Impact
- **Maintenance Burden:** Changes require dual edits
- **Risk of Drift:** Versions can diverge over time
- **Performance:** Duplicate code imported, larger bundle
- **Developer Confusion:** Unclear which version to use

### Import Path Strategy
- **Current:** Mix of `../../constants/theme` and `@/shared/constants/theme`
- **Target:** Single `@/` alias for all absolute imports
- **Benefit:** Easier refactoring, clearer dependencies

---

## Requirements

### Must Fix
- [ ] Remove duplicate theme files
- [ ] Remove duplicate components
- [ ] Fix all TypeScript import errors
- [ ] Standardize on expo-image

### Should Fix
- [ ] Consolidate component exports
- [ ] Update all imports to use @/ aliases
- [ ] Remove unused imports/code
- [ ] Organize feature modules consistently

---

## Implementation Steps

### Step 1: Remove Duplicate Theme (1h)

**1.1 Identify usage**
```bash
grep -r "constants/theme" src/ app/
grep -r "shared/constants/theme" src/ app/
```

**1.2 Update all imports**
```typescript
// OLD
import { colors } from "../../constants/theme";
import { colors } from "../../../constants/theme";

// NEW (standardized)
import { colors } from "@/shared/constants/theme";
```

**1.3 Delete old theme**
```bash
rm /constants/theme.ts
```

**1.4 Verify**
```bash
npm run type-check
# Should pass with no theme import errors
```

---

### Step 2: Remove Duplicate Components (2h)

**2.1 HighlightCard**
```bash
# Delete inferior version
rm /components/ui/HighlightCard.tsx

# Move to shared
mv /src/features/highlights/components/HighlightCard.tsx \
   /src/shared/components/HighlightCard.tsx

# Update imports
sed -i '' 's|@/features/highlights/components/HighlightCard|@/shared/components/HighlightCard|g' **/*.tsx
```

**2.2 HapticTouchable**
```bash
rm /components/ui/HapticTouchable.tsx
# Keep /src/shared/components/HapticTouchable.tsx
```

**2.3 AnimatedPressable**
```bash
# Document which version is canonical
# Keep /src/shared/components/AnimatedPressable.tsx (full reanimated)
# Delete /components/ui/AnimatedPressable.tsx (simplified)
```

**2.4 Update component exports**
```typescript
// components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Skeleton, HighlightCardSkeleton, ProfileSkeleton } from "./Skeleton";
export { ErrorState, EmptyState, OfflineIndicator } from "./States";
// Re-export from shared
export { HapticTouchable } from "@/shared/components/HapticTouchable";
export { HighlightCard } from "@/shared/components/HighlightCard";
export { AnimatedPressable } from "@/shared/components/AnimatedPressable";
```

---

### Step 3: Fix TypeScript Import Errors (2h)

**3.1 Update service imports**
```typescript
// BEFORE (services/auth.service.ts)
import { supabase } from '../lib/supabase';
import { Booking, ApiResponse } from '../types';

// AFTER
import { supabase } from '@/lib/supabase';
import type { Booking, ApiResponse } from '@/types';
```

**3.2 Affected files**
- `/src/features/auth/auth.service.ts`
- `/src/features/bookings/booking.service.ts`
- `/src/features/courts/court.service.ts`
- `/src/features/highlights/highlight.service.ts`

**3.3 Find all relative imports**
```bash
grep -r "from '\.\./\.\./\.\./lib" src/
grep -r "from '\.\./lib" src/
grep -r "from '\.\./types" src/
```

**3.4 Replace with absolute**
```bash
# Example: Update all supabase imports
find src/ -name "*.ts" -o -name "*.tsx" | xargs sed -i '' "s|from ['\"]\.\.\/lib\/supabase['\"]|from '@/lib/supabase'|g"
```

**3.5 Verify build**
```bash
npm run type-check
npx expo start --clear
```

---

### Step 4: Standardize Image Library (1.5h)

**4.1 Find React Native Image usage**
```bash
grep -r "from 'react-native'" app/ src/ | grep Image
```

**4.2 Replace with expo-image**
```typescript
// BEFORE
import { Image } from "react-native";

// AFTER
import { Image } from "expo-image";
```

**4.3 Add default image config**
```typescript
// src/shared/constants/image.ts
export const IMAGE_DEFAULTS = {
    contentFit: "cover" as const,
    transition: 200,
    cachePolicy: "memory-disk" as const,
    placeholderColor: "#1e293b",
};
```

**4.4 Update components**
```typescript
// BEFORE
<Image source={{ uri: url }} style={styles.thumbnail} />

// AFTER
import { IMAGE_DEFAULTS } from "@/shared/constants/image";
<Image
    source={{ uri: url }}
    style={styles.thumbnail}
    {...IMAGE_DEFAULTS}
/>
```

**4.5 Files to update**
- `/app/match/chat.tsx`
- `/app/match/conversations.tsx`
- `/app/court/[id].tsx`
- `/app/settings/edit-profile.tsx`
- `/components/admin/CourtFormModal.tsx`

---

### Step 5: Consolidate Component Structure (1.5h)

**5.1 Create shared UI directory**
```bash
mkdir -p /src/shared/components/ui
```

**5.2 Move UI-only components**
```bash
mv /components/ui/Button.tsx /src/shared/components/ui/
mv /components/ui/Input.tsx /src/shared/components/ui/
mv /components/ui/Card.tsx /src/shared/components/ui/
mv /components/ui/Skeleton.tsx /src/shared/components/ui/
mv /components/ui/States.tsx /src/shared/components/ui/
```

**5.3 Update exports**
```typescript
// src/shared/components/ui/index.ts
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Skeleton, HighlightCardSkeleton, ProfileSkeleton } from "./Skeleton";
export { ErrorState, EmptyState, OfflineIndicator } from "./States";
export { HapticTouchable } from "../HapticTouchable";
export { HighlightCard } from "../HighlightCard";
export { AnimatedPressable } from "../AnimatedPressable";
```

**5.4 Update all component imports**
```bash
# Replace old imports
find app/ src/ -type f \( -name "*.ts" -o -name "*.tsx" \) -exec sed -i '' "s|from '@/components/ui'|from '@/shared/components/ui'|g" {} +
```

---

### Step 6: Remove Unused Code (1h)

**6.1 Find unused exports**
```bash
npx ts-prune
```

**6.2 Find unused imports**
```bash
# ESLint will catch these after Phase 2
npm run lint
```

**6.3 Remove dead code**
- Unused utility functions
- Commented-out code
- Deprecated components

**6.4 Verify no broken imports**
```bash
npm run type-check
npm test
```

---

## Todo Checklist

### Theme Consolidation
- [ ] Find all theme imports
- [ ] Update to use @/shared/constants/theme
- [ ] Delete /constants/theme.ts
- [ ] Verify no errors

### Component Duplication
- [ ] Delete duplicate HighlightCard
- [ ] Delete duplicate HapticTouchable
- [ ] Resolve AnimatedPressable strategy
- [ ] Update component exports
- [ ] Test all component imports

### TypeScript Imports
- [ ] Update auth.service.ts imports
- [ ] Update booking.service.ts imports
- [ ] Update court.service.ts imports
- [ ] Update highlight.service.ts imports
- [ ] Fix all relative imports
- [ ] Verify build passes

### Image Library
- [ ] Create IMAGE_DEFAULTS constant
- [ ] Update chat.tsx
- [ ] Update conversations.tsx
- [ ] Update court/[id].tsx
- [ ] Update edit-profile.tsx
- [ ] Update CourtFormModal.tsx
- [ ] Test image loading

### Component Structure
- [ ] Create shared/components/ui directory
- [ ] Move UI components
- [ ] Update exports
- [ ] Update all imports
- [ ] Test component rendering

### Cleanup
- [ ] Run ts-prune
- [ ] Remove unused code
- [ ] Remove commented code
- [ ] Final type-check
- [ ] Final test run

---

## Success Criteria

- [ ] Zero duplicate theme files
- [ ] Zero duplicate components
- [ ] All imports use @/ aliases
- [ ] expo-image used consistently
- [ ] TypeScript compiles without errors
- [ ] All tests pass
- [ ] No unused imports (ESLint clean)

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking imports | Update incrementally, test after each step |
| Component behavior changes | Test rendering after consolidation |
| Build failures | Keep git checkpoint before major changes |
| Image loading issues | Test on device, verify caching |

---

## Next Steps

After Phase 4 completion:
1. Commit with "refactor: consolidate components and theme"
2. Run full test suite
3. Proceed to Phase 5 (Performance Optimization)

---

**Estimated Effort:** 8 hours
**Can Run in Parallel With:** Phase 2
**Depends On:** Phase 3 (tests must pass after changes)
