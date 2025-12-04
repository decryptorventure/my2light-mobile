# /hooks - React Query Hooks

## Overview
Custom React hooks using TanStack React Query for data fetching, caching, and state management.

## Architecture

### Query Keys
All query keys are centralized in `queryKeys` object for cache management:

```typescript
queryKeys.highlights.list(limit)  // ['highlights', 'list', { limit }]
queryKeys.user.current            // ['user', 'current']
queryKeys.notifications.list()    // ['notifications', 'list']
```

### Cache Configuration
- **staleTime**: How long data is considered fresh (default: 60s)
- **retry**: Number of retry attempts on failure (default: 2)
- **refetchOnWindowFocus**: Disabled for mobile

## Available Hooks

### User Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useCurrentUser()` | Get current user profile | 5 min |
| `useUserCredits()` | Get user credit balance | 1 min |
| `useUpdateUserProfile()` | Mutation to update profile | - |

### Highlight Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useHighlights(limit)` | Get highlights feed | 1 min |
| `useUserHighlights(userId)` | Get user's highlights | 1 min |
| `useCreateHighlight()` | Mutation to create highlight | - |
| `useToggleLike()` | Mutation to like/unlike | - |

### Court Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useCourts()` | Get all courts | 5 min |
| `useCourtById(id)` | Get court details | 5 min |

### Booking Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useBookingHistory()` | Get booking history | 1 min |
| `useActiveBooking()` | Get active booking | 30s |

### Match Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useMatchRequests()` | Get open matches | 1 min |
| `useCreateMatchRequest()` | Mutation to create match | - |

### Notification Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useNotifications(limit)` | Get notifications | 30s |
| `useUnreadNotificationCount()` | Get unread count | 30s |
| `useMarkNotificationRead()` | Mark as read mutation | - |
| `useMarkAllNotificationsRead()` | Mark all read mutation | - |

### Transaction Hooks
| Hook | Description | staleTime |
|------|-------------|-----------|
| `useTransactions(limit)` | Get transaction history | 1 min |

## Usage Examples

```typescript
import { useCurrentUser, useHighlights } from '@/hooks/useApi';

function MyComponent() {
  // Query hook - auto fetches and caches
  const { data: user, isLoading, error, refetch } = useCurrentUser();
  
  // With parameters
  const { data: highlights } = useHighlights(20);
  
  // Pull-to-refresh
  const onRefresh = async () => {
    await refetch();
  };
}
```

### Using Mutations
```typescript
import { useCreateMatchRequest } from '@/hooks/useApi';

function CreateMatch() {
  const { mutate, isPending } = useCreateMatchRequest();
  
  const handleSubmit = () => {
    mutate({
      skillLevel: 'intermediate',
      matchType: 'singles',
      preferredTime: new Date().toISOString()
    });
  };
}
```

## Adding New Hooks

1. Add query key to `queryKeys` object
2. Create hook using `useQuery` or `useMutation`
3. Include `queryClient.invalidateQueries` in mutation `onSuccess`
4. Update this README
