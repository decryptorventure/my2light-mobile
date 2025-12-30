# Code Standards

## Import Order

Follow this consistent import order:

1. **External libraries** (React, React Native, third-party)
2. **Internal absolute imports** (`@/` aliases)
3. **Relative imports**
4. **Type imports** (always at the end)

### Example

```typescript
// 1. External libraries
import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";

// 2. Internal absolute imports
import { supabase } from "@/lib/supabase";
import { colors, spacing } from "@/shared/constants/theme";
import { HighlightService } from "@/features/highlights";

// 3. Relative imports
import { Button } from "./Button";
import { useLocalHook } from "../hooks/useLocalHook";

// 4. Type imports
import type { User } from "@/types";
import type { ComponentProps } from "./types";
```

## TypeScript Path Aliases

Use these configured aliases (from `tsconfig.json`):

```typescript
@/features/*      → src/features/*
@/shared/*        → src/shared/*
@/types           → types/index
@/stores/*        → stores/*
@/components/*    → components/*
@/hooks/*         → hooks/*
@/lib/*           → src/lib/*
@/services/*      → services/*
@/*               → src/*
```

### Examples

```typescript
// ✅ Good: Use aliases
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import type { Highlight } from "@/types";

// ❌ Bad: Relative paths for shared modules
import { useAuth } from "../../../hooks/useAuth";
import { Button } from "../../components/ui/Button";
```

## Component Structure

### Functional Components with Hooks

```typescript
import React, { useState, useCallback, useMemo } from "react";
import type { FC } from "react";

interface MyComponentProps {
    title: string;
    onAction: (id: string) => void;
    isActive?: boolean;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onAction, isActive = false }) => {
    // 1. Hooks
    const [state, setState] = useState(false);

    // 2. Computed values
    const computedValue = useMemo(() => {
        return state ? "active" : "inactive";
    }, [state]);

    // 3. Event handlers
    const handlePress = useCallback(() => {
        setState((prev) => !prev);
        onAction("123");
    }, [onAction]);

    // 4. Render
    return (
        <View>
            <Text>{title}</Text>
        </View>
    );
};

// Default export at bottom
export default MyComponent;
```

### Component Best Practices

- **Memoize** expensive computations with `useMemo`
- **Memoize** event handlers passed to children with `useCallback`
- **Extract** complex logic to custom hooks
- **Split** large components into smaller ones
- **Use** `React.memo` for components that receive stable props

```typescript
// Memoize expensive computation
const filteredData = useMemo(() => data.filter((item) => item.status === "active"), [data]);

// Memoize callback to prevent child re-renders
const handleItemPress = useCallback(
    (id: string) => {
        navigation.navigate("Details", { id });
    },
    [navigation]
);

// Memoize component
export const ExpensiveComponent = React.memo(({ data }) => {
    // Render logic
});
```

## File Naming

| Type       | Convention                  | Example                                 |
| ---------- | --------------------------- | --------------------------------------- |
| Components | PascalCase                  | `Button.tsx`, `HighlightCard.tsx`       |
| Hooks      | camelCase (use prefix)      | `useAuth.ts`, `useHighlights.ts`        |
| Services   | camelCase (.service suffix) | `auth.service.ts`, `booking.service.ts` |
| Utilities  | camelCase                   | `validation.ts`, `formatting.ts`        |
| Constants  | SCREAMING_SNAKE_CASE        | `CACHE_TTL`, `NETWORK_CONFIG`           |
| Types      | PascalCase                  | `User`, `Highlight`, `ApiResponse<T>`   |

### Directory Structure

```
src/
├── features/
│   ├── auth/
│   │   ├── auth.service.ts        # Service layer
│   │   ├── screens/
│   │   │   └── LoginScreen.tsx    # Screen component
│   │   └── hooks/
│   │       └── useAuth.ts         # Feature hook
│   └── highlights/
│       ├── highlight.service.ts
│       ├── components/
│       │   └── HighlightCard.tsx  # Feature component
│       └── hooks/
│           └── useHighlights.ts
├── shared/
│   ├── components/                # Reusable components
│   ├── constants/                 # Constants
│   └── utils/                     # Utilities
└── lib/                           # Core utilities
```

## TypeScript Guidelines

### Types vs Interfaces

- **Use `interface`** for object shapes
- **Use `type`** for unions, intersections, primitives

```typescript
// ✅ Interface for object shapes
interface User {
    id: string;
    name: string;
    email: string;
}

// ✅ Type for unions
type Status = "pending" | "active" | "completed";

// ✅ Type for intersections
type UserWithRole = User & { role: "admin" | "user" };
```

### No `any` Type

```typescript
// ❌ Never use `any`
function processData(data: any) {
    return data.value;
}

// ✅ Use `unknown` when type is truly unknown
function processData(data: unknown) {
    if (typeof data === "object" && data !== null && "value" in data) {
        return (data as { value: string }).value;
    }
    throw new Error("Invalid data");
}

// ✅ Better: Use generics
function processData<T extends { value: string }>(data: T) {
    return data.value;
}
```

### Explicit Return Types

```typescript
// ✅ Always specify return types for exported functions
export function calculateTotal(items: CartItem[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
}

export async function fetchUser(id: string): Promise<User | null> {
    const result = await supabase.from("users").select("*").eq("id", id).single();
    return result.data;
}
```

### Export Types Separately

```typescript
// ✅ Export types from component files
export interface ButtonProps {
    title: string;
    onPress: () => void;
    disabled?: boolean;
}

export const Button: FC<ButtonProps> = ({ title, onPress, disabled }) => {
    // Component logic
};
```

## Styling

### Inline Styles (< 100 lines)

```typescript
import { StyleSheet } from "react-native";
import type { SxProps, Theme } from "@mui/material"; // If using MUI

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: "#fff",
    },
    title: {
        fontSize: 24,
        fontWeight: "bold",
    },
});

// Or for web with MUI
const styles: Record<string, SxProps<Theme>> = {
    container: {
        p: 2,
        backgroundColor: (theme) => theme.palette.background.default,
    },
};
```

### Separate Styles File (> 100 lines)

```typescript
// MyComponent.styles.ts
export const styles = StyleSheet.create({
    container: {
        /* ... */
    },
    // ... many styles
});

// MyComponent.tsx
import { styles } from "./MyComponent.styles";
```

### Use Theme Constants

```typescript
import { colors, spacing, fontSize } from "@/shared/constants/theme";

const styles = StyleSheet.create({
    container: {
        padding: spacing.md,
        backgroundColor: colors.background,
    },
    title: {
        fontSize: fontSize.xl,
        color: colors.text,
    },
});
```

## Error Handling

### Service Layer

```typescript
export const HighlightService = {
    async getHighlights(limit: number): Promise<ApiResponse<Highlight[]>> {
        try {
            const { data, error } = await supabase.from("highlights").select("*").limit(limit);

            if (error) {
                console.error("[HighlightService] Fetch error:", error);
                return { success: false, data: [], error: error.message };
            }

            return { success: true, data: data || [] };
        } catch (error) {
            console.error("[HighlightService] Unexpected error:", error);
            return { success: false, data: [], error: "Unexpected error" };
        }
    },
};
```

### Component Layer

```typescript
const { data, isError, error } = useQuery({
    queryKey: ["highlights"],
    queryFn: () => HighlightService.getHighlights(10),
});

if (isError) {
    return <ErrorState message="Không thể tải highlights" />;
}
```

## Code Quality Tools

### ESLint

```bash
# Run linter
npm run lint

# Auto-fix issues
npm run lint:fix
```

### Prettier

```bash
# Format all files
npm run format
```

### TypeScript

```bash
# Type check without emitting
npm run type-check
```

### Pre-commit Hooks

Husky automatically runs:

- ESLint on `.ts` and `.tsx` files
- Prettier on all staged files
- Before each commit

## Common Patterns

### API Response Type

```typescript
export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error?: string;
}
```

### React Query Hooks

```typescript
export function useHighlights(limit: number = 20) {
    return useQuery({
        queryKey: ["highlights", limit],
        queryFn: async () => {
            const result = await HighlightService.getHighlights(limit);
            if (!result.success) throw new Error(result.error);
            return result.data;
        },
        staleTime: CACHE_TTL.FREQUENT,
    });
}
```

### Zustand Store

```typescript
interface AuthState {
    user: User | null;
    setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    setUser: (user) => set({ user }),
}));
```

## Documentation

### JSDoc for Complex Functions

```typescript
/**
 * Validates email format using RFC 5322 regex
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid") // false
 */
export function isValidEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
}
```

### Component Documentation

```typescript
/**
 * Button component with haptic feedback
 * @example
 * <Button onPress={handlePress} disabled={isLoading}>
 *     Submit
 * </Button>
 */
export const Button: FC<ButtonProps> = ({ children, onPress, disabled }) => {
    // Implementation
};
```

## Performance

### Optimize Re-renders

```typescript
// ✅ Memoize callbacks
const handlePress = useCallback(() => {
    console.log("Pressed");
}, []);

// ✅ Memoize expensive computations
const sortedItems = useMemo(
    () => items.sort((a, b) => a.name.localeCompare(b.name)),
    [items]
);

// ✅ Memoize components
export const ExpensiveList = React.memo(({ items }) => {
    return items.map((item) => <ExpensiveItem key={item.id} item={item} />);
});
```

### Lazy Loading

```typescript
// For heavy components
const HeavyComponent = React.lazy(() => import("./HeavyComponent"));

function MyScreen() {
    return (
        <Suspense fallback={<Loading />}>
            <HeavyComponent />
        </Suspense>
    );
}
```

## Summary

- **Import order**: External → Internal → Relative → Types
- **TypeScript**: Use `interface` for objects, `type` for unions
- **No `any`**: Use `unknown` or generics
- **File naming**: PascalCase for components, camelCase for utilities
- **Memoize**: Callbacks and expensive computations
- **Error handling**: Try-catch in services, handle in components
- **Documentation**: JSDoc for complex functions

## References

- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [React Hooks Guide](https://react.dev/reference/react)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)
