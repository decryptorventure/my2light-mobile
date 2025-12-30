# Contributing to My2Light Mobile

Thank you for contributing to My2Light Mobile! This guide will help you set up your development environment and follow our workflow.

## Getting Started

### Prerequisites

- **Node.js** 18+
- **npm** or **yarn**
- **Git**
- **Expo CLI** (`npm install -g expo-cli`)
- **iOS Simulator** (macOS) or **Android Emulator**

### Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/my2light-mobile.git
cd my2light-mobile

# Install dependencies
npm install --legacy-peer-deps

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npx expo start
```

## Development Workflow

### 1. Create a Branch

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or bug fix branch
git checkout -b fix/issue-description
```

**Branch Naming:**

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions/updates

### 2. Make Changes

Follow our code standards (see [docs/code-standards.md](./docs/code-standards.md)):

- Use TypeScript strict mode
- Follow import order: External → Internal → Relative → Types
- Use path aliases (`@/`, `@/features/*`, etc.)
- No `any` types - use `unknown` or generics
- Memoize callbacks with `useCallback`
- Memoize expensive computations with `useMemo`

### 3. Before Committing

**REQUIRED CHECKLIST** - Run these commands before every commit:

```bash
# 1. Lint and auto-fix
npm run lint:fix

# 2. Format code
npm run format

# 3. Type check
npm run type-check

# 4. Run tests
npm test

# 5. Verify all pass
# ✅ ESLint: No errors
# ✅ Prettier: Code formatted
# ✅ TypeScript: No type errors
# ✅ Tests: All passing
```

**Husky Pre-commit Hooks** will automatically run:

- ESLint on staged `.ts` and `.tsx` files
- Prettier on all staged files
- TypeScript compilation check

If hooks fail, fix the issues before committing.

### 4. Commit Changes

Follow conventional commit format:

```bash
# Format: <type>(<scope>): <subject>

git commit -m "feat(auth): add biometric login support"
git commit -m "fix(booking): resolve court availability bug"
git commit -m "refactor(highlights): optimize video loading"
git commit -m "docs(readme): update installation instructions"
git commit -m "test(services): add booking service tests"
```

**Commit Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `docs` - Documentation
- `test` - Tests
- `chore` - Maintenance
- `perf` - Performance improvement
- `style` - Formatting (not CSS)

### 5. Push and Create Pull Request

```bash
# Push branch
git push origin feature/your-feature-name

# Create PR on GitHub
# Use the PR template if available
```

## Pull Request Guidelines

### PR Title

Use conventional commit format:

```
feat(auth): Add biometric authentication
fix(booking): Resolve double booking issue
refactor(highlights): Improve video feed performance
```

### PR Description

Include:

1. **Summary**: What does this PR do?
2. **Motivation**: Why is this change needed?
3. **Changes**: List of changes made
4. **Testing**: How was this tested?
5. **Screenshots**: For UI changes
6. **Related Issues**: Closes #123

**Example:**

```markdown
## Summary

Adds biometric authentication (Face ID/Touch ID) for iOS users.

## Motivation

Users requested faster login without typing password every time.

## Changes

- Added `expo-local-authentication` dependency
- Created biometric auth service
- Updated login screen with biometric option
- Added settings to enable/disable biometric login

## Testing

- Tested on iPhone 14 simulator with Face ID
- Tested fallback to password login
- Added unit tests for biometric service
- Manual testing on physical device

## Screenshots

[Attach screenshots of login screen with biometric option]

## Related Issues

Closes #234
```

### Before Submitting PR

**Checklist:**

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted with Prettier (`npm run format`)
- [ ] Added tests for new features
- [ ] Updated documentation if needed
- [ ] Checked for console errors in Expo
- [ ] Tested on iOS Simulator (required)
- [ ] Tested on Android Emulator (if applicable)

## Code Review Process

### What Reviewers Check

1. **Code Quality**
    - Follows [code-standards.md](./docs/code-standards.md)
    - No `any` types
    - Proper error handling
    - Memoization where needed

2. **Testing**
    - Adequate test coverage
    - Edge cases covered
    - Tests pass

3. **Security**
    - No hardcoded credentials
    - Input validation
    - Proper authentication checks
    - See [security-practices.md](./docs/security-practices.md)

4. **Performance**
    - No performance regressions
    - Optimized queries
    - Proper caching

5. **Documentation**
    - Code comments where needed
    - Updated docs if applicable
    - Clear commit messages

### Addressing Feedback

- Respond to all comments
- Push additional commits to address feedback
- Re-request review when ready
- Don't force push unless necessary

### Approval Requirements

- At least **1 approval** required
- All CI checks must pass
- No unresolved conversations
- Up-to-date with `master` branch

## Testing

See [docs/testing-guide.md](./docs/testing-guide.md) for detailed testing guidelines.

### Coverage Requirements

- **Overall**: 60%+
- **Critical Services**: 70%+ (auth, booking, payment)
- **Hooks**: 60%+

### Writing Tests

```typescript
// Service test example
describe("BookingService", () => {
    it("should create booking successfully", async () => {
        // Arrange
        const bookingData = { courtId: "1", userId: "user1" };

        // Act
        const result = await BookingService.createBooking(bookingData);

        // Assert
        expect(result.success).toBe(true);
    });
});
```

## Project Structure

```
my2light-mobile/
├── app/                    # Expo Router screens
├── src/
│   ├── features/           # Feature modules
│   ├── shared/             # Shared components
│   └── lib/                # Core utilities
├── components/ui/          # UI components
├── services/               # API services
├── stores/                 # Zustand stores
├── types/                  # TypeScript types
└── tests/                  # Jest tests
```

See [docs/system-architecture.md](./docs/system-architecture.md) for details.

## Common Issues

### Install Errors

```bash
# Use legacy peer deps
npm install --legacy-peer-deps

# Clear cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### TypeScript Errors

```bash
# Check tsconfig.json paths
# Ensure imports use correct aliases
npm run type-check
```

### Test Failures

```bash
# Run specific test
npm test booking.service.test.ts

# Run with coverage
npm test -- --coverage

# Clear Jest cache
npm test -- --clearCache
```

### Husky Hook Failures

```bash
# Run manually to see errors
npm run lint:fix
npm run format
npm run type-check
```

## Getting Help

- **Documentation**: Read [DOCS.md](./DOCS.md) for full project context
- **Code Standards**: See [docs/code-standards.md](./docs/code-standards.md)
- **Security**: See [docs/security-practices.md](./docs/security-practices.md)
- **Testing**: See [docs/testing-guide.md](./docs/testing-guide.md)
- **Architecture**: See [docs/system-architecture.md](./docs/system-architecture.md)

## License

Private - © 2024-2025 My2Light
