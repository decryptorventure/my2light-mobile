# /types - TypeScript Type Definitions

## Overview

Centralized TypeScript types and interfaces for the entire application.

## Core Types

### User

```typescript
interface User {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    totalHighlights: number;
    hoursPlayed: number;
    courtsVisited: number;
    credits: number;
    membershipTier: "free" | "pro" | "elite";
    role?: "player" | "court_owner" | "both";
    bio?: string;
    isPublic?: boolean;
    followersCount?: number;
    followingCount?: number;
}
```

### Highlight

```typescript
interface Highlight {
    id: string;
    userId: string;
    courtId?: string;
    thumbnailUrl: string;
    videoUrl: string;
    durationSec: number;
    createdAt: string;
    likes: number;
    views: number;
    courtName?: string;
    userAvatar?: string;
    userName?: string;
    isLiked: boolean;
    isPublic: boolean;
    comments: number;
    highlightEvents?: HighlightEvent[];
}
```

### Court

```typescript
interface Court {
    id: string;
    name: string;
    address: string;
    status: "live" | "busy" | "available" | "maintenance";
    thumbnailUrl: string;
    distanceKm: number;
    pricePerHour: number;
    rating: number;
    images: string[];
    facilities: string[];
    description?: string;
    openTime?: string;
    closeTime?: string;
    totalReviews: number;
}
```

### Booking

```typescript
interface Booking {
    id: string;
    userId: string;
    courtId: string;
    packageId?: string;
    startTime: number;
    endTime: number;
    status: "pending" | "confirmed" | "active" | "completed" | "cancelled";
    totalAmount: number;
    courtName?: string;
    packageName?: string;
    packageType?: "standard" | "full_match";
}
```

### MatchRequest

```typescript
interface MatchRequest {
    id: string;
    userId: string;
    courtId?: string;
    preferredTime?: string;
    skillLevel: "beginner" | "intermediate" | "advanced" | "pro";
    matchType: "singles" | "doubles" | "mixed";
    gender?: "male" | "female" | "any";
    status: "open" | "matched" | "cancelled" | "expired";
    description?: string;
    createdAt: string;
    profile?: { name: string; avatar: string };
}
```

### Package

```typescript
interface Package {
    id: string;
    name: string;
    description: string;
    durationMinutes: number;
    price: number;
    type: "standard" | "full_match";
    isBestValue?: boolean;
}
```

### ApiResponse

```typescript
interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}
```

## Usage

```typescript
import type { User, Highlight, Court } from '@/types';

function renderUser(user: User) {
  return <Text>{user.name}</Text>;
}
```

## Naming Conventions

- **Interfaces**: PascalCase, singular (e.g., `User`, `Highlight`)
- **Enums**: PascalCase with uppercase members
- **Type aliases**: PascalCase
- **Props interfaces**: ComponentNameProps (e.g., `ButtonProps`)

## Adding New Types

1. Add interface/type to `/types/index.ts`
2. Export from the file
3. Update this README
4. Use `type` import in other files:
    ```typescript
    import type { MyNewType } from "@/types";
    ```
