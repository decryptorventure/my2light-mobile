# Code Review Report: UI Components, Performance & Architecture
**Date:** 2025-12-30 | **Focus:** Shared Components, Theme System, Performance Patterns
**Reviewer:** Code-Reviewer Agent | **Status:** Complete

---

## Code Review Summary

### Scope
- **Files Reviewed:** 13 UI component files, theme constants, layout files
- **Lines Analyzed:** ~1,000 LOC (UI components)
- **Review Focus:** Component reusability, performance optimization, code duplication, theme consistency
- **Architecture:** Feature-based + shared components with Expo Router

### Overall Assessment
**Code Quality: GOOD** with significant **organizational issues** requiring immediate attention. Components are well-written with proper memoization & props design, but codebase suffers from:
- **Critical:** Duplicate component implementations (2+ versions of key components)
- **Critical:** Dual theme files creating maintenance burden
- **High:** Inconsistent image library usage (React Native `Image` vs `expo-image`)
- **High:** Several components lack proper typing and imports consistency
- **Medium:** Some FlatList instances missing optimization flags

---

## Critical Issues

### 1. DUPLICATE THEME FILES (MAJOR ISSUE)
**Severity:** CRITICAL
**Files Affected:**
- `/constants/theme.ts` (line 1-64)
- `/src/shared/constants/theme.ts` (line 1-64)

**Problem:** Identical theme constants duplicated across two locations. Both files contain exact same code:
- Colors, spacing, borderRadius, fontSize, fontWeight definitions
- Zero differences between versions
- Creates maintenance nightmare: changes in one location won't sync to the other

**Impact:**
- Theme updates require dual edits
- Risk of theme inconsistencies between old/new codebase locations
- Confuses developers about which version to use
- Memory overhead (imported twice in different parts of codebase)

**Current Usage:**
- App files import from `../../constants/theme` (old location)
- Feature components import from `@/shared/constants/theme` (new location)

**Recommendation:**
1. Keep single canonical location: `/src/shared/constants/theme.ts`
2. Update all `/constants/theme` imports to use alias: `@/shared/constants/theme`
3. Remove `/constants/theme.ts` entirely
4. Verify with `grep -r "constants/theme"` before deletion

---

### 2. DUPLICATE COMPONENTS (MAJOR ISSUE)
**Severity:** CRITICAL
**Duplicate Pairs:**

#### A. HighlightCard Component
**Files:**
- `/components/ui/HighlightCard.tsx` (47 lines, using React Native `Image`)
- `/src/features/highlights/components/HighlightCard.tsx` (83 lines, using `expo-image`)

**Key Differences:**
```tsx
// components/ui/HighlightCard.tsx
import { Image } from "react-native";
// ... no image caching or optimization
<Image source={{ uri: highlight.thumbnailUrl }} style={styles.thumbnail} />

// src/features/highlights/components/HighlightCard.tsx
import { Image } from "expo-image";
// ... optimized with caching
<Image
  source={{ uri: highlight.thumbnailUrl }}
  style={styles.thumbnail}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

**Problem:**
- Features component has BETTER implementation (expo-image with caching)
- UI component is outdated and less performant
- App likely imports from wrong location causing performance regression

**Recommendation:**
1. Delete `/components/ui/HighlightCard.tsx`
2. Move `/src/features/highlights/components/HighlightCard.tsx` → `/src/shared/components/HighlightCard.tsx`
3. Update all imports to use shared location
4. Use `expo-image` consistently across app

#### B. HapticTouchable Component
**Files:**
- `/components/ui/HapticTouchable.tsx` (36 lines)
- `/src/shared/components/HapticTouchable.tsx` (36 lines)

**Problem:** 100% identical implementation. Same issue as HighlightCard.

**Recommendation:**
1. Delete `/components/ui/HapticTouchable.tsx`
2. Keep `/src/shared/components/HapticTouchable.tsx`
3. Update imports in `/components/ui/index.ts` to re-export from shared

#### C. AnimatedPressable Component
**Files:**
- `/components/ui/AnimatedPressable.tsx` (46 lines, simplified version)
- `/src/shared/components/AnimatedPressable.tsx` (77 lines, with react-native-reanimated)

**Problem:** Different implementations - old version is simplified (no animation), new version uses reanimated v3. This causes inconsistency.

**Note:** Simplified version documented as temporary fix due to Expo Go incompatibility (from DOCS.md).

**Recommendation:**
1. Keep both versions but document clearly why
2. OR: Choose one canonical version & deprecate other
3. Update shared component exports to indicate which is active

---

## High Priority Findings

### 2. INCONSISTENT IMAGE LIBRARY USAGE
**Severity:** HIGH
**Problem:** Mixed usage of React Native `Image` vs `expo-image`

**Current Usage Patterns:**
```tsx
// OLD: React Native Image (no caching, no optimization)
import { Image } from "react-native";
<Image source={{ uri: url }} style={styles.thumbnail} />

// NEW: expo-image (with caching, transitions, contentFit)
import { Image } from "expo-image";
<Image
  source={{ uri: url }}
  style={styles.thumbnail}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
/>
```

**Files Using React Native Image (Performance Risk):**
- `/app/match/chat.tsx` (message images)
- `/app/match/conversations.tsx` (avatar images)
- `/app/court/[id].tsx` (court images - no fallback handling)
- `/app/settings/edit-profile.tsx` (profile avatar)
- `/components/admin/CourtFormModal.tsx` (admin image preview)
- `/app/(tabs)/index.tsx` (user avatar - Image component)

**Files Using expo-image (Optimized):**
- `/src/features/highlights/components/HighlightCard.tsx` (proper implementation)
- `/app/settings/edit-profile.tsx` (avatar)

**Recommendation:**
1. Create IMAGE_CONFIG constant with expo-image defaults:
   ```tsx
   export const IMAGE_DEFAULTS = {
     contentFit: "cover",
     transition: 200,
     cachePolicy: "memory-disk",
     placeholderColor: colors.surfaceLight,
   };
   ```
2. Standardize across app to use `expo-image` everywhere
3. Update old `Image` imports to use expo-image
4. Add fallback UI for failed image loads

---

### 3. INCONSISTENT COMPONENT IMPORTS IN UI/INDEX.TS
**Severity:** HIGH
**File:** `/components/ui/index.ts`

**Current Issues:**
- Exports duplicated components that also exist in `/src/shared/components/`
- No clear source of truth
- Creates confusion about which version to use

**Current Exports:**
```tsx
export { Button } from "./Button";
export { Input } from "./Input";
export { Card } from "./Card";
export { Skeleton, ... } from "./Skeleton";
export { ErrorState, EmptyState, OfflineIndicator } from "./States";
export { HapticTouchable } from "./HapticTouchable";        // DUPLICATE
export { HighlightCard } from "./HighlightCard";            // DUPLICATE
export { AnimatedPressable } from "./AnimatedPressable";    // DUPLICATE
export { AnimatedCard, FadeInView, SlideInView } from "./AnimatedCard";
```

**Recommendation:**
1. Consolidate UI components into single location: `/src/shared/components/ui/`
2. Keep `/components/ui/` only for true "UI-only" components (Button, Input, Card, Skeleton, States)
3. Move feature-specific components to their features
4. Update monorepo structure to be consistent with feature-based pattern

---

### 4. THEME IMPORTS INCONSISTENCY
**Severity:** HIGH
**Problem:** Mixed import patterns for theme constants

**Current Patterns:**
```tsx
// Old pattern (root level)
import { colors, spacing, fontSize } from "../../constants/theme";

// New pattern (path alias)
import { colors, spacing, fontSize } from "@/shared/constants/theme";

// Some files use ../../../ going up too many levels
```

**Recommendation:**
1. Single canonical import: `import { colors, spacing, fontSize } from "@/shared/constants/theme";`
2. Update all 17 component imports to use path alias
3. Configure tsconfig.json to ensure `@/shared` is correctly aliased

---

### 5. FLATLIST OPTIMIZATION GAPS
**Severity:** HIGH
**File:** `/app/match/chat.tsx` (lines 50+)

**Current Implementation:**
```tsx
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={renderMessage}
  contentContainerStyle={styles.messagesList}
  // ❌ Missing optimization flags
/>
```

**Missing Optimizations:**
- No `removeClippedSubviews={true}` for message list
- No `maxToRenderPerBatch` (default 10, should be 20+ for chats)
- No `updateCellsBatchingPeriod` optimization
- No `initialNumToRender` setting
- No `getItemLayout` for fixed-height items

**Recommendation:**
```tsx
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={renderMessage}
  removeClippedSubviews={true}
  maxToRenderPerBatch={25}
  updateCellsBatchingPeriod={50}
  initialNumToRender={20}
  getItemLayout={(data, index) => ({
    length: MESSAGE_HEIGHT,
    offset: MESSAGE_HEIGHT * index,
    index,
  })}
  inverted // For chat, typically want newest at bottom
/>
```

---

## Medium Priority Improvements

### 1. BUTTON COMPONENT - UNUSED ICONS
**Severity:** MEDIUM
**File:** `/components/ui/Button.tsx` (line 23)

**Issue:** Icon prop not properly utilized:
```tsx
interface ButtonProps {
  icon?: React.ReactNode;  // ✅ Prop exists
  ...
}

// But in rendering:
{loading ? (
  <ActivityIndicator ... />
) : (
  <>
    {icon}  // ✅ Icon rendered
    <Text ...>{title}</Text>
  </>
)}
```

**Problem:** No flexbox gap between icon and text, hard-coded margin-left logic.

**Recommendation:**
```tsx
<TouchableOpacity style={[
  styles.base,
  styles[variant],
  styles[`size_${size}`],
  fullWidth && styles.fullWidth,
  isDisabled && styles.disabled,
  icon && styles.withIcon,  // Add class
  style,
]}>
```

---

### 2. SKELETON COMPONENT - MEMORY EFFICIENCY
**Severity:** MEDIUM
**File:** `/components/ui/Skeleton.tsx` (line 18-37)

**Issue:** Animated.Value created fresh for each Skeleton instance
```tsx
const opacity = useRef(new Animated.Value(0.3)).current;

useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([...])
  );
  animation.start();
  return () => animation.stop();
}, []);
```

**Problem:** Pre-built skeleton layouts (HighlightCardSkeleton, ProfileSkeleton) create multiple animation loops running simultaneously. With 5+ skeleton loaders visible, this wastes memory.

**Recommendation:** Use single shared animation driver:
```tsx
// Create once
const globalOpacity = useRef(new Animated.Value(0.3)).current;

useEffect(() => {
  const animation = Animated.loop(
    Animated.sequence([...])
  );
  animation.start();
}, []);

// Reuse across all Skeleton components
```

---

### 3. INPUT COMPONENT - FOCUS STATE MANAGEMENT
**Severity:** MEDIUM
**File:** `/components/ui/Input.tsx` (lines 33-34)

**Issue:** Focus/blur states not properly debounced with keyboard visibility changes
```tsx
const [isFocused, setIsFocused] = useState(false);

// No prevention of race conditions when keyboard appears
<TextInput
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
/>
```

**Problem:** On Android, keyboard events can trigger state updates out of order.

**Recommendation:** Add keyboard tracking or debounce:
```tsx
const handleFocus = useCallback(() => setIsFocused(true), []);
const handleBlur = useCallback(() => setIsFocused(false), []);
```

---

### 4. CARD COMPONENT - INCOMPLETE ACTIVE STATE
**Severity:** MEDIUM
**File:** `/components/ui/Card.tsx` (lines 33-39)

**Issue:** TouchableOpacity wrapper only for onPress, but no activeOpacity consistency
```tsx
if (onPress) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      {content}
    </TouchableOpacity>
  );
}
return content;
```

**Problem:** Hard-coded activeOpacity doesn't match other components or theme.

**Recommendation:**
```tsx
interface CardProps {
  activeOpacity?: number;  // Add prop
}

export function Card({ activeOpacity = 0.7, ...props }: CardProps) {
  ...
  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={activeOpacity}>
```

---

### 5. HAPTIC FEEDBACK - INCONSISTENT TYPE ANNOTATION
**Severity:** MEDIUM
**Files:** Both HapticTouchable implementations

**Issue:** Event callback typing too loose:
```tsx
const handlePress = useCallback((event: any) => {  // ❌ any type
  ...
}, [onPress, hapticStyle, hapticEnabled]);
```

**Recommendation:**
```tsx
import type { GestureResponderEvent } from "react-native";

const handlePress = useCallback((event: GestureResponderEvent) => {
  ...
}, [onPress, hapticStyle, hapticEnabled]);
```

---

### 6. ANIMATIONS - REANIMATED VERSION MISMATCH
**Severity:** MEDIUM
**Context:** From DOCS.md, noted issue with reanimated v4 incompatibility

**Current State:**
- `/components/ui/AnimatedCard.tsx` - Simplified (no animation)
- `/components/ui/AnimatedPressable.tsx` - Simplified (no animation)
- `/src/shared/components/AnimatedPressable.tsx` - Full reanimated v3 implementation

**Problem:** Simplified versions don't animate. Users experience static UI.

**Recommendation:**
1. Stick with current simplified approach until Development Build is ready
2. Document clearly in component JSDoc which is active
3. Plan migration path to reanimated when switching to Development Build

---

## Low Priority Suggestions

### 1. STATES COMPONENT - GENERIC ACTION BUTTON
**Severity:** LOW
**File:** `/components/ui/States.tsx`

**Suggestion:** Replace repeated TouchableOpacity styling with reusable button:
```tsx
interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outlined";
}

// Then in ErrorState/EmptyState
<ActionButton label="Thử lại" onPress={onRetry} variant="primary" />
```

---

### 2. COORDINATE UI ICON SIZES
**Severity:** LOW
**Inconsistency:** Various icon sizes used inconsistently

**Current:**
- ErrorState: 64px icon
- EmptyState: 64px icon
- States error retry: 18px
- HapticTouchable: Not defined

**Recommendation:** Add to theme constants:
```tsx
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

---

### 3. COMPONENT DOCUMENTATION
**Severity:** LOW
**Issue:** Some components lack JSDoc comments

**Recommendation:** Add JSDoc for public APIs:
```tsx
/**
 * Button component with multiple variants and sizes
 * @component
 * @example
 * return <Button title="Press me" onPress={() => {}} variant="primary" />
 */
export function Button({ title, onPress, ...props }: ButtonProps) {
```

---

## Positive Observations

### ✅ Strong Points

1. **Good Memoization Usage:** HighlightCard properly memoized with `memo()` to prevent unnecessary FlatList re-renders (line 83 in src/features/highlights/components/HighlightCard.tsx)

2. **Props Interface Design:** Components have well-defined interfaces with optional props and sensible defaults:
   - Button: Clear variants, sizes, loading state
   - Input: Comprehensive with icons, errors, password toggle
   - Card: Flexible padding/variant system

3. **Responsive Design:** Components use `Dimensions` appropriately:
   ```tsx
   const { width } = Dimensions.get("window");
   const CARD_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;
   ```

4. **Error Handling:** States component provides ErrorState/EmptyState/OfflineIndicator coverage

5. **TypeScript:** Strict typing on component props (except occasional `any` types)

6. **Theme Consistency:** When using theme constants, application is consistent

---

## Recommended Actions (Priority Order)

### CRITICAL (Do First)
1. **[1-2 hours]** Consolidate theme files:
   - Delete `/constants/theme.ts`
   - Create alias redirect or update all imports to `@/shared/constants/theme`
   - Verify no imports left to old location

2. **[2-3 hours]** Resolve duplicate components:
   - Delete `/components/ui/HighlightCard.tsx` (inferior version)
   - Delete `/components/ui/HapticTouchable.tsx` (duplicate)
   - Consolidate AnimatedPressable (choose canonical version)
   - Update all imports

3. **[1-2 hours]** Standardize Image library usage:
   - Replace all React Native `Image` imports with `expo-image`
   - Add IMAGE_CONFIG constant for caching
   - Update CourtFormModal, chat, conversations components

### HIGH (Do Within Sprint)
4. **[1 hour]** Update FlatList optimization in `/app/match/chat.tsx`
5. **[30 min]** Fix focus state management in Input component
6. **[30 min]** Standardize component imports and exports
7. **[1 hour]** Update all theme imports to use path alias

### MEDIUM (Next Iteration)
8. Create shared component structure under `/src/shared/components/ui/`
9. Add comprehensive JSDoc to components
10. Implement icon size constants
11. Optimize Skeleton animation memory usage

---

## Metrics & Coverage

| Metric | Status | Notes |
|--------|--------|-------|
| **Component Duplication** | ❌ High | 3+ component pairs duplicated |
| **Theme Consistency** | ❌ Poor | 2 theme files causing confusion |
| **Image Optimization** | ⚠️ Partial | Mix of expo-image & React Native Image |
| **Memoization** | ✅ Good | 49 instances of useMemo/useCallback/memo |
| **TypeScript Coverage** | ✅ Good | Strong typing on props, some `any` types |
| **FlatList Optimization** | ⚠️ Partial | Missing some optimization flags |
| **Code Reusability** | ✅ Good | Clean component APIs with sensible defaults |

---

## Unresolved Questions

1. **Design System Decision:** Should `/components` be deleted entirely or kept for non-feature UI components? (Root concern: conflicting locations)

2. **Reanimated Migration:** When is Development Build deployment planned to re-enable animations?

3. **Image Optimization:** Are there performance issues with React Native Image in production? (Investigate memory usage)

4. **Component Ownership:** Which team member owns `/components/ui/` vs `/src/shared/components/`? (Prevents future duplication)

---

## Summary

**Overall:** Solid component library with good patterns but hindered by organizational debt. Duplicate components and theme files create maintenance burden and potential performance issues. **Standardizing on single locations and expo-image will improve code quality significantly.**

**Next Step:** Prioritize removing duplicates and consolidating theme files before adding new features.
