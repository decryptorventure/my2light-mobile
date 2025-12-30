// ESLint 9 Flat Config for React Native + TypeScript
// @see https://eslint.org/docs/latest/use/configure/configuration-files

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactNativePlugin from "eslint-plugin-react-native";
import prettierConfig from "eslint-config-prettier";

export default [
    // Base recommended configs
    js.configs.recommended,
    ...tseslint.configs.recommended,

    // Main configuration
    {
        files: ["**/*.{ts,tsx,js,jsx}"],
        plugins: {
            react: reactPlugin,
            "react-native": reactNativePlugin,
        },
        languageOptions: {
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            globals: {
                __DEV__: "readonly",
                console: "readonly",
                process: "readonly",
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                Buffer: "readonly",
            },
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // React Rules
            "react/react-in-jsx-scope": "off", // Not needed in React 17+
            "react/prop-types": "off", // Using TypeScript instead
            "react/display-name": "off",
            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "error",

            // React Native Rules
            // Note: Some react-native plugin rules are disabled due to ESLint 9 incompatibility
            "react-native/no-unused-styles": "off", // Disabled - incompatible with ESLint 9
            "react-native/no-inline-styles": "off", // Allow inline styles for now
            "react-native/no-color-literals": "off", // Allow color literals
            "react-native/split-platform-components": "off",

            // TypeScript Rules
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-empty-function": "off",
            "@typescript-eslint/ban-ts-comment": "warn",
            "@typescript-eslint/no-non-null-assertion": "warn",

            // General Rules
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "no-debugger": "warn",
            "no-alert": "warn",
            "no-eval": "error",
            "no-implied-eval": "error",
            "no-new-func": "error",
            "no-var": "error",
            "prefer-const": "warn",
            "prefer-arrow-callback": "warn",
            "no-duplicate-imports": "error",

            // Code Quality
            eqeqeq: ["error", "always", { null: "ignore" }],
            curly: ["error", "all"],
            "no-throw-literal": "error",
            "prefer-template": "warn",
            "no-useless-concat": "warn",
            "no-useless-return": "warn",
        },
    },

    // Ignore patterns
    {
        ignores: [
            "node_modules/**",
            ".expo/**",
            ".expo-shared/**",
            "dist/**",
            "build/**",
            "coverage/**",
            "android/**",
            "ios/**",
            "*.config.js",
            "*.config.ts",
            ".husky/**",
            ".claude/**",
            "babel.config.js",
            "metro.config.js",
        ],
    },

    // Prettier config must be last to override formatting rules
    prettierConfig,
];
