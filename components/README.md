# /components - UI Components

## Overview
Reusable UI components following atomic design principles.

## Structure
```
components/
├── ui/                    # Base UI primitives
│   ├── Button.tsx         # Button variants
│   ├── Input.tsx          # Text input with validation
│   ├── Card.tsx           # Container component
│   ├── Skeleton.tsx       # Loading skeletons
│   ├── States.tsx         # Empty, error, offline states
│   └── index.ts           # Barrel export
├── features/              # Feature-specific components (TODO)
│   ├── highlights/        # Highlight cards, player
│   ├── matches/           # Match request cards
│   └── profile/           # Profile sections
└── README.md              # This file
```

## UI Components

### Button
```typescript
import { Button } from '@/components/ui';

<Button 
  title="Submit" 
  variant="primary" // 'primary' | 'secondary' | 'ghost'
  size="md"         // 'sm' | 'md' | 'lg'
  loading={false}
  disabled={false}
  onPress={() => {}}
/>
```

### Input
```typescript
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter email"
  value={email}
  onChangeText={setEmail}
  error={errors.email}
  secureTextEntry={false}
  leftIcon={<Ionicons name="mail" />}
/>
```

### Card
```typescript
import { Card } from '@/components/ui';

<Card variant="elevated" padding="md">
  <Text>Content</Text>
</Card>
```

### Skeleton (Loading States)
```typescript
import { Skeleton, HighlightCardSkeleton, ProfileSkeleton } from '@/components/ui';

// Generic skeleton
<Skeleton width={100} height={20} />

// Pre-built layouts
<HighlightCardSkeleton />
<ProfileSkeleton />
<ListItemSkeleton />
<MatchCardSkeleton />
```

### State Components
```typescript
import { ErrorState, EmptyState, OfflineIndicator } from '@/components/ui';

// Error with retry
<ErrorState 
  message="Failed to load" 
  onRetry={() => refetch()} 
/>

// Empty state with action
<EmptyState
  icon="videocam-outline"
  title="No videos yet"
  message="Record your first highlight!"
  actionLabel="Start Recording"
  onAction={() => router.push('/record')}
/>

// Offline bar
<OfflineIndicator />
```

## Design Tokens

All components use tokens from `/constants/theme.ts`:

```typescript
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/constants/theme';

// Colors
colors.background  // #0f172a
colors.surface     // #1e293b
colors.accent      // #a3e635
colors.text        // #f1f5f9

// Spacing (4px base)
spacing.xs  // 4
spacing.sm  // 8
spacing.md  // 16
spacing.lg  // 24
spacing.xl  // 32

// Typography
fontSize.xs  // 12
fontSize.sm  // 14
fontSize.md  // 16
fontSize.lg  // 18
fontSize.xl  // 24
```

## Adding New Components

1. Create component in appropriate folder
2. Use TypeScript interfaces for props
3. Include JSDoc comments
4. Export from `index.ts`
5. Update this README

### Template
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '@/constants/theme';

interface MyComponentProps {
  /** Component title */
  title: string;
  /** Optional callback */
  onPress?: () => void;
}

/**
 * MyComponent - Description of what it does
 * @example
 * <MyComponent title="Hello" onPress={() => alert('Hi')} />
 */
export function MyComponent({ title, onPress }: MyComponentProps) {
  return (
    <View style={styles.container}>
      <Text>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
  },
});
```
