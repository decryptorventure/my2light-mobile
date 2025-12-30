/**
 * Security utilities for the app
 * Helps identify and prevent sensitive data leaks
 */

import { logger } from "./logger";

const securityLogger = logger.create("Security");

/**
 * Patterns that should never appear in production code or logs
 */
const SENSITIVE_PATTERNS = [
    // API Keys and Secrets
    /sk_[a-zA-Z0-9]{24,}/g, // Stripe secret keys
    /pk_[a-zA-Z0-9]{24,}/g, // Stripe public keys
    /ghp_[a-zA-Z0-9]{36}/g, // GitHub personal access tokens
    /xoxb-[a-zA-Z0-9-]{49,}/g, // Slack bot tokens
    /AIza[0-9A-Za-z-_]{35}/g, // Google API keys

    // Database/Service URLs with credentials
    /postgres:\/\/[^:]+:[^@]+@/g, // PostgreSQL connection strings
    /mongodb\+srv:\/\/[^:]+:[^@]+@/g, // MongoDB connection strings

    // JWTs and Tokens
    /eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}/g, // JWTs

    // UUIDs (user IDs, session IDs)
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,

    // Passwords in URLs or objects
    /password[\"']?\s*[:=]\s*[\"'][^\"']+[\"']/gi,
    /pwd[\"']?\s*[:=]\s*[\"'][^\"']+[\"']/gi,
    /secret[\"']?\s*[:=]\s*[\"'][^\"']+[\"']/gi,
];

/**
 * Environment variables that should only be on server
 */
const SERVER_ONLY_ENV_PREFIXES = ["SERVICE_ROLE", "ADMIN_", "PRIVATE_", "SERVER_"];

/**
 * Check if a string contains sensitive data
 */
export function containsSensitiveData(text: string): boolean {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Mask sensitive data in a string
 */
export function maskSensitiveData(text: string): string {
    let masked = text;

    for (const pattern of SENSITIVE_PATTERNS) {
        masked = masked.replace(pattern, (match) => {
            if (match.length <= 8) return "***";
            return `${match.slice(0, 4)}...${match.slice(-4)}`;
        });
    }

    return masked;
}

/**
 * Audit environment variables for security issues
 */
export function auditEnvironmentVariables(): {
    warnings: string[];
    errors: string[];
} {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Check for server-only variables exposed to client
    for (const key of Object.keys(process.env)) {
        for (const prefix of SERVER_ONLY_ENV_PREFIXES) {
            if (key.includes(prefix)) {
                errors.push(
                    `Server-only environment variable "${key}" should not be exposed to client`
                );
            }
        }
    }

    // Check for common security issues
    if (process.env.EXPO_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) {
        errors.push("SERVICE_ROLE_KEY should NEVER be exposed to client - use only on server");
    }

    return { warnings, errors };
}

/**
 * Validate that only safe environment variables are used
 */
export function validateClientEnv(): void {
    const { warnings, errors } = auditEnvironmentVariables();

    warnings.forEach((w) => securityLogger.warn(w));
    errors.forEach((e) => securityLogger.error(e));

    if (errors.length > 0 && !__DEV__) {
        throw new Error("Security audit failed - check logs for details");
    }
}

/**
 * Safe JSON stringify that masks sensitive data
 */
export function safeStringify(obj: any, indent?: number): string {
    try {
        const text = JSON.stringify(obj, null, indent);
        return maskSensitiveData(text);
    } catch {
        return "[Unable to stringify]";
    }
}

/**
 * Headers that should be redacted in logs
 */
export const SENSITIVE_HEADERS = [
    "authorization",
    "x-api-key",
    "cookie",
    "set-cookie",
    "x-auth-token",
];

/**
 * Mask headers for logging
 */
export function maskHeaders(headers: Record<string, string>): Record<string, string> {
    const masked: Record<string, string> = {};

    for (const [key, value] of Object.entries(headers)) {
        if (SENSITIVE_HEADERS.includes(key.toLowerCase())) {
            masked[key] = "***REDACTED***";
        } else {
            masked[key] = maskSensitiveData(value);
        }
    }

    return masked;
}
