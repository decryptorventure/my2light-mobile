# Testing Guide

## Coverage Requirements

### Target Coverage

- **Overall**: 60%+
- **Critical Services**: 70%+ (auth, booking, payment)
- **Hooks**: 60%+
- **Current**: 25% (as of Phase 3)

### Coverage by Category

| Category   | Current | Target | Priority |
| ---------- | ------- | ------ | -------- |
| Services   | 25%     | 70%    | High     |
| Hooks      | 0%      | 60%    | Medium   |
| Components | 0%      | 40%    | Low      |
| Utils      | 55%     | 80%    | Medium   |

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Watch mode (auto-rerun on changes)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Run specific test file
npm test booking.service.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should create booking"
```

### Coverage Reports

After running `npm test -- --coverage`:

- **Terminal**: Summary table
- **HTML Report**: `coverage/lcov-report/index.html`
- **Coverage Files**: `coverage/` (added to `.gitignore`)

## Writing Tests

### Service Tests

Services interact with Supabase. Mock the Supabase client.

```typescript
import { HighlightService } from "@/features/highlights/highlight.service";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase");

describe("HighlightService", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("should fetch highlights successfully", async () => {
        // Arrange
        const mockData = [
            { id: "1", user_id: "user1", likes: 10 },
            { id: "2", user_id: "user2", likes: 5 },
        ];

        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue({
                data: mockData,
                error: null,
            }),
        });

        // Act
        const result = await HighlightService.getHighlights(10);

        // Assert
        expect(result.success).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(supabase.from).toHaveBeenCalledWith("highlights");
    });

    it("should handle fetch errors", async () => {
        // Arrange
        (supabase.from as jest.Mock).mockReturnValue({
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockResolvedValue({
                data: null,
                error: { message: "Network error" },
            }),
        });

        // Act
        const result = await HighlightService.getHighlights(10);

        // Assert
        expect(result.success).toBe(false);
        expect(result.data).toEqual([]);
    });
});
```

### Hook Tests

Hooks require React Query wrapper.

```typescript
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useHighlights } from "@/features/highlights/hooks/useHighlights";
import { HighlightService } from "@/features/highlights/highlight.service";

jest.mock("@/features/highlights/highlight.service");

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
};

describe("useHighlights", () => {
    it("should fetch highlights", async () => {
        // Arrange
        const mockHighlights = [
            { id: "1", userId: "user1", likes: 10 },
        ];

        (HighlightService.getHighlights as jest.Mock).mockResolvedValue({
            success: true,
            data: mockHighlights,
        });

        // Act
        const { result } = renderHook(() => useHighlights(10), {
            wrapper: createWrapper(),
        });

        // Assert
        await waitFor(() => {
            expect(result.current.data).toEqual(mockHighlights);
        });
    });
});
```

### Component Tests

Test user interactions and rendering.

```typescript
import { render, fireEvent } from "@testing-library/react-native";
import { Button } from "@/components/ui/Button";

describe("Button", () => {
    it("should render with text", () => {
        const { getByText } = render(<Button>Click Me</Button>);
        expect(getByText("Click Me")).toBeTruthy();
    });

    it("should call onPress when pressed", () => {
        const onPressMock = jest.fn();
        const { getByText } = render(
            <Button onPress={onPressMock}>Click Me</Button>
        );

        fireEvent.press(getByText("Click Me"));
        expect(onPressMock).toHaveBeenCalledTimes(1);
    });

    it("should be disabled when disabled prop is true", () => {
        const { getByText } = render(
            <Button disabled>Disabled</Button>
        );

        const button = getByText("Disabled").parent;
        expect(button?.props.accessibilityState?.disabled).toBe(true);
    });
});
```

## Test Setup

### Mocking Supabase

Global mock in `tests/setup.ts`:

```typescript
jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => ({
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            delete: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            order: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
        })),
        auth: {
            getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
            getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
    },
}));
```

### Test Data Factories

Create reusable test data:

```typescript
// tests/factories/highlight.factory.ts
export const createMockHighlight = (overrides = {}) => ({
    id: "highlight-1",
    userId: "user-1",
    courtId: "court-1",
    videoUrl: "https://example.com/video.mp4",
    likes: 0,
    views: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
});

// Usage in tests
const highlight = createMockHighlight({ likes: 10 });
```

## Testing Best Practices

### Arrange-Act-Assert Pattern

```typescript
it("should do something", () => {
    // Arrange: Set up test data and mocks
    const input = "test";
    const expectedOutput = "TEST";

    // Act: Execute the code under test
    const result = myFunction(input);

    // Assert: Verify the results
    expect(result).toBe(expectedOutput);
});
```

### Test Naming

```typescript
// ✅ Good: Descriptive, clear intent
it("should return error when email is invalid");
it("should update cache after successful booking");

// ❌ Bad: Vague, unclear
it("test email");
it("works correctly");
```

### One Assertion Per Test

```typescript
// ✅ Good: Single responsibility
it("should validate email format", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
});

it("should reject empty email", () => {
    expect(isValidEmail("")).toBe(false);
});

// ❌ Bad: Multiple unrelated assertions
it("should handle emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("invalid")).toBe(false);
});
```

### Cleanup After Tests

```typescript
describe("AuthService", () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Clear mock call history
    });

    afterEach(() => {
        // Reset any global state
        localStorage.clear();
    });
});
```

## Continuous Integration

### GitHub Actions

Tests run automatically on:

- Pull requests
- Pushes to `master`
- Daily scheduled runs

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
    test:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3
            - uses: actions/setup-node@v3
              with:
                  node-version: "18"
            - run: npm ci
            - run: npm test -- --coverage
```

## Troubleshooting

### Common Issues

**Issue**: `Cannot find module '@/lib/supabase'`

**Solution**: Check `tsconfig.json` path mappings and `jest.config.cjs` moduleNameMapper

**Issue**: `ReferenceError: React is not defined`

**Solution**: Import React in test files or configure Jest preset

**Issue**: Tests hang indefinitely

**Solution**: Ensure all async operations are properly awaited or mocked

### Debug Mode

```bash
# Run tests with verbose output
npm test -- --verbose

# Run single test in debug mode
node --inspect-brk node_modules/.bin/jest booking.service.test.ts
```

## Next Steps

1. **Phase 3 Completion**: Reach 60% overall coverage
2. **Hook Tests**: Add tests for `useApi`, `useBookingRealtime`, `useNetwork`
3. **Integration Tests**: Test complete user flows
4. **E2E Tests**: Consider Detox for critical paths

## References

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
