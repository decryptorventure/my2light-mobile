# Phase 2: Code Quality Tooling

**Priority:** HIGH | **Status:** pending | **Effort:** 4h | **Date:** 2025-12-30

[← Back to Plan](plan.md)

---

## Context

Project currently lacks ESLint and Prettier configuration, leading to inconsistent code style and potential bugs. TypeScript strict mode is enabled but not fully utilized. Pre-commit hooks missing.

**Source:** [Scout Analysis](../../reports/scout-251230-1314-codebase-analysis.md), [Best Practices Research](../../reports/researcher-251230-1321-mobile-quality-security-architecture.md)

**Current State:**
- ✗ No ESLint configuration
- ✗ No Prettier configuration
- ✓ TypeScript strict mode enabled
- ✗ No pre-commit hooks
- ✗ Inconsistent code style

---

## Key Insights

### Why This Matters
1. **Bug Prevention** - ESLint catches common React/TypeScript errors
2. **Code Consistency** - Prettier eliminates style debates
3. **Developer Experience** - Auto-format on save
4. **CI/CD Integration** - Catch issues before merge
5. **Team Scalability** - Onboarding easier with enforced standards

### Research Findings
- ESLint 9+ with flat config is 2025 standard
- Prettier as final ESLint config prevents conflicts
- Husky + lint-staged provides instant feedback
- TypeScript strict mode catches 40% more bugs

---

## Requirements

### Must Have
- [ ] ESLint 9+ with flat config
- [ ] Prettier integration
- [ ] Pre-commit hooks (Husky + lint-staged)
- [ ] TypeScript strict mode verification
- [ ] CI lint check

### Should Have
- [ ] VS Code settings for auto-format
- [ ] ESLint React Native plugin
- [ ] Import sorting
- [ ] Unused imports removal

### Nice to Have
- [ ] Commitlint for conventional commits
- [ ] Editor config file
- [ ] Code spell checker

---

## Architecture Considerations

### ESLint 9 Flat Config Structure
```javascript
// eslint.config.js (new flat config format)
export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    reactPlugin.configs.recommended,
    reactNativePlugin.configs.recommended,
    prettierConfig,
];
```

### Prettier + ESLint Integration
**Key:** Prettier runs AFTER ESLint to avoid conflicts
```json
{
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:react/recommended",
        "prettier" // ← Must be last
    ]
}
```

### Pre-commit Hook Flow
```
git commit
  ↓
Husky pre-commit
  ↓
lint-staged
  ↓
  ├─ ESLint (*.ts, *.tsx)
  ├─ Prettier (*.ts, *.tsx, *.json, *.md)
  └─ TypeScript check
  ↓
Commit succeeds/fails
```

---

## Related Code Files

### Files to Create
- `/eslint.config.js` - ESLint 9 flat config
- `/.prettierrc` - Prettier configuration
- `/.prettierignore` - Files to skip
- `/.husky/pre-commit` - Pre-commit hook
- `/.vscode/settings.json` - Editor settings
- `/.editorconfig` - Cross-editor config

### Files to Modify
- `/package.json` - Add scripts and dependencies
- `/tsconfig.json` - Verify strict mode
- `/.gitignore` - Add .husky/_

### Dependencies to Install
```json
{
    "devDependencies": {
        "eslint": "^9.0.0",
        "@eslint/js": "^9.0.0",
        "typescript-eslint": "^7.0.0",
        "eslint-plugin-react": "^7.34.0",
        "eslint-plugin-react-native": "^4.1.0",
        "eslint-config-prettier": "^9.1.0",
        "prettier": "^3.2.0",
        "husky": "^9.0.0",
        "lint-staged": "^15.2.0"
    }
}
```

---

## Implementation Steps

### Step 1: Install Dependencies (0.5h)

**1.1 Install ESLint + TypeScript plugins**
```bash
npm install --save-dev \
    eslint@^9.0.0 \
    @eslint/js@^9.0.0 \
    typescript-eslint@^7.0.0 \
    eslint-plugin-react@^7.34.0 \
    eslint-plugin-react-native@^4.1.0 \
    eslint-config-prettier@^9.1.0
```

**1.2 Install Prettier**
```bash
npm install --save-dev prettier@^3.2.0
```

**1.3 Install Git hooks**
```bash
npm install --save-dev husky@^9.0.0 lint-staged@^15.2.0
npx husky init
```

---

### Step 2: Configure ESLint (1h)

**2.1 Create eslint.config.js**
```javascript
// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactNativePlugin from 'eslint-plugin-react-native';
import prettierConfig from 'eslint-config-prettier';

export default [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['**/*.{ts,tsx}'],
        plugins: {
            react: reactPlugin,
            'react-native': reactNativePlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },
        settings: {
            react: {
                version: 'detect',
            },
        },
        rules: {
            // React
            'react/react-in-jsx-scope': 'off', // Not needed in React 17+
            'react/prop-types': 'off', // Using TypeScript
            'react/display-name': 'off',

            // React Native
            'react-native/no-unused-styles': 'warn',
            'react-native/no-inline-styles': 'warn',
            'react-native/no-color-literals': 'off',

            // TypeScript
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            // General
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    {
        ignores: [
            'node_modules/**',
            '.expo/**',
            'dist/**',
            'build/**',
            'coverage/**',
            '*.config.js',
        ],
    },
    prettierConfig, // Must be last
];
```

**2.2 Add scripts to package.json**
```json
{
    "scripts": {
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "lint:check": "eslint . --max-warnings=0"
    }
}
```

**2.3 Test ESLint**
```bash
npm run lint
# Should report errors/warnings

npm run lint:fix
# Should auto-fix issues
```

---

### Step 3: Configure Prettier (0.5h)

**3.1 Create .prettierrc**
```json
{
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": false,
    "printWidth": 100,
    "tabWidth": 4,
    "arrowParens": "always",
    "endOfLine": "lf"
}
```

**3.2 Create .prettierignore**
```
# Dependencies
node_modules/
.expo/
.expo-shared/

# Build
dist/
build/
coverage/

# Generated
*.generated.ts
*.d.ts

# Config
package-lock.json
yarn.lock
```

**3.3 Add Prettier scripts**
```json
{
    "scripts": {
        "format": "prettier --write .",
        "format:check": "prettier --check ."
    }
}
```

**3.4 Test Prettier**
```bash
npm run format:check
# Shows files needing formatting

npm run format
# Formats all files
```

---

### Step 4: Setup Pre-commit Hooks (1h)

**4.1 Create .husky/pre-commit**
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**4.2 Configure lint-staged in package.json**
```json
{
    "lint-staged": {
        "*.{ts,tsx}": [
            "eslint --fix",
            "prettier --write"
        ],
        "*.{json,md}": [
            "prettier --write"
        ]
    }
}
```

**4.3 Test pre-commit hook**
```bash
# Make a change
echo "test" >> test.ts

# Try to commit (should trigger hooks)
git add test.ts
git commit -m "test"

# Should run ESLint + Prettier
```

**4.4 Optional: Add pre-push hook**
```bash
# .husky/pre-push
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint:check
npm run format:check
npm run type-check
```

---

### Step 5: VS Code Integration (0.5h)

**5.1 Create .vscode/settings.json**
```json
{
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit"
    },
    "eslint.validate": [
        "javascript",
        "javascriptreact",
        "typescript",
        "typescriptreact"
    ],
    "typescript.tsdk": "node_modules/typescript/lib",
    "typescript.enablePromptUseWorkspaceTsdk": true,
    "[typescript]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    },
    "[typescriptreact]": {
        "editor.defaultFormatter": "esbenp.prettier-vscode"
    }
}
```

**5.2 Create .vscode/extensions.json**
```json
{
    "recommendations": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "editorconfig.editorconfig"
    ]
}
```

**5.3 Create .editorconfig**
```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 4
insert_final_newline = true
trim_trailing_whitespace = true

[*.{json,yml,yaml}]
indent_size = 2

[*.md]
trim_trailing_whitespace = false
```

---

### Step 6: TypeScript Strict Mode Verification (0.5h)

**6.1 Review tsconfig.json**
```json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitReturns": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true,
        "noFallthroughCasesInSwitch": true,
        "forceConsistentCasingInFileNames": true,
        "exactOptionalPropertyTypes": true
    }
}
```

**6.2 Add type-check script**
```json
{
    "scripts": {
        "type-check": "tsc --noEmit"
    }
}
```

**6.3 Test TypeScript**
```bash
npm run type-check
# Should report any type errors
```

---

### Step 7: CI Integration (0.5h)

**7.1 Create .github/workflows/lint.yml** (if using GitHub Actions)
```yaml
name: Lint

on:
    pull_request:
        branches: [master, main]
    push:
        branches: [master, main]

jobs:
    lint:
        runs-on: ubuntu-latest

        steps:
            - uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: '18'
                  cache: 'npm'

            - name: Install dependencies
              run: npm ci --legacy-peer-deps

            - name: Run ESLint
              run: npm run lint:check

            - name: Run Prettier
              run: npm run format:check

            - name: Run TypeScript
              run: npm run type-check
```

**7.2 Test CI locally**
```bash
# Simulate CI environment
npm ci --legacy-peer-deps
npm run lint:check
npm run format:check
npm run type-check
```

---

## Todo Checklist

### Dependencies
- [ ] Install ESLint 9 + plugins
- [ ] Install Prettier
- [ ] Install Husky + lint-staged
- [ ] Verify all peer dependencies

### ESLint Configuration
- [ ] Create eslint.config.js
- [ ] Add lint scripts to package.json
- [ ] Test ESLint on codebase
- [ ] Fix all auto-fixable issues
- [ ] Review and fix remaining warnings

### Prettier Configuration
- [ ] Create .prettierrc
- [ ] Create .prettierignore
- [ ] Add format scripts
- [ ] Run Prettier on entire codebase
- [ ] Commit formatted code

### Git Hooks
- [ ] Initialize Husky
- [ ] Create pre-commit hook
- [ ] Configure lint-staged
- [ ] Test hook with sample commit
- [ ] Optional: Add pre-push hook

### Editor Integration
- [ ] Create .vscode/settings.json
- [ ] Create .vscode/extensions.json
- [ ] Create .editorconfig
- [ ] Test auto-format on save
- [ ] Document editor setup in README

### TypeScript
- [ ] Verify strict mode enabled
- [ ] Add type-check script
- [ ] Run type-check
- [ ] Fix type errors
- [ ] Document type standards

### CI/CD
- [ ] Create lint workflow
- [ ] Test workflow locally
- [ ] Add status badge to README
- [ ] Configure branch protection rules

---

## Success Criteria

- [ ] ESLint runs without errors on entire codebase
- [ ] Prettier formats all code consistently
- [ ] Pre-commit hook blocks commits with lint errors
- [ ] Type-check passes with zero errors
- [ ] CI lint check integrated
- [ ] VS Code auto-formats on save
- [ ] Team can clone and setup in <5 minutes

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Breaking existing code | Commit before applying auto-fixes |
| Team resistance to formatting | Demo benefits, enforce via hooks |
| CI build time increase | Cache node_modules, run lint in parallel |
| Editor conflicts | Provide .vscode config, document setup |

---

## Security Considerations

### Linting Rules for Security
```javascript
rules: {
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
}
```

### Pre-commit Security Checks
- Block commits with console.log in production files
- Warn on hardcoded secrets (future: use secret scanning tool)
- Enforce import order (prevents circular dependencies)

---

## Next Steps

After Phase 2 completion:
1. Run full lint + format on codebase
2. Commit changes with "chore: setup ESLint, Prettier, Husky"
3. Document code style guide
4. Proceed to Phase 3 (Testing Infrastructure)

---

## Unresolved Questions

1. Should we enforce conventional commits with commitlint?
2. Import order preference (absolute vs relative)?
3. Line length limit (100 or 120)?
4. Should we add spell checker to CI?
5. Pre-push hook too aggressive?

---

**Estimated Effort:** 4 hours
**Can Run in Parallel With:** Phase 3, Phase 4
**Depends On:** None (can start immediately after Phase 1)
