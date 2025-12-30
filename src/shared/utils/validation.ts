/**
 * Input validation utilities for security and data integrity
 * @module shared/utils/validation
 */

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

/**
 * Validate email using RFC 5322 simplified pattern
 * Prevents common injection attacks and ensures basic format correctness
 *
 * @param email - Email address to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateEmail(email: string): ValidationResult {
    // RFC 5322 simplified - prevents most invalid formats
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    if (!email || email.trim().length === 0) {
        return { valid: false, error: 'Email is required' };
    }

    const trimmedEmail = email.trim();

    // Check length constraints
    if (trimmedEmail.length > 254) {
        return { valid: false, error: 'Email is too long (max 254 characters)' };
    }

    // Validate format
    if (!emailRegex.test(trimmedEmail)) {
        return { valid: false, error: 'Invalid email format' };
    }

    // Additional checks
    const [localPart, domain] = trimmedEmail.split('@');

    if (localPart.length > 64) {
        return { valid: false, error: 'Email local part is too long' };
    }

    if (!domain || domain.length === 0) {
        return { valid: false, error: 'Invalid email domain' };
    }

    return { valid: true };
}

/**
 * Validate password strength according to security requirements
 * Requirements: 12+ characters, uppercase, lowercase, numbers
 *
 * @param password - Password to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validatePassword(password: string): ValidationResult {
    const minLength = 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!password || password.length === 0) {
        return { valid: false, error: 'Password is required' };
    }

    if (password.length < minLength) {
        return {
            valid: false,
            error: `Password must be at least ${minLength} characters`,
        };
    }

    if (!hasUppercase) {
        return {
            valid: false,
            error: 'Password must include at least one uppercase letter',
        };
    }

    if (!hasLowercase) {
        return {
            valid: false,
            error: 'Password must include at least one lowercase letter',
        };
    }

    if (!hasNumbers) {
        return {
            valid: false,
            error: 'Password must include at least one number',
        };
    }

    return { valid: true };
}

/**
 * Validate password confirmation matches original
 *
 * @param password - Original password
 * @param confirmPassword - Password confirmation
 * @returns ValidationResult with valid flag and optional error message
 */
export function validatePasswordConfirmation(
    password: string,
    confirmPassword: string
): ValidationResult {
    if (!confirmPassword || confirmPassword.length === 0) {
        return { valid: false, error: 'Password confirmation is required' };
    }

    if (password !== confirmPassword) {
        return { valid: false, error: 'Passwords do not match' };
    }

    return { valid: true };
}

/**
 * Sanitize user input to prevent XSS and injection attacks
 * Escapes HTML special characters and trims whitespace
 *
 * @param input - User input string
 * @returns Sanitized string safe for display
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';

    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .trim();
}

/**
 * Validate phone number (international format)
 * Supports: +1234567890, (123) 456-7890, 123-456-7890
 *
 * @param phone - Phone number to validate
 * @returns ValidationResult with valid flag and optional error message
 */
export function validatePhoneNumber(phone: string): ValidationResult {
    if (!phone || phone.trim().length === 0) {
        return { valid: false, error: 'Phone number is required' };
    }

    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');

    // Check if it has 10-15 digits (international format)
    if (digitsOnly.length < 10 || digitsOnly.length > 15) {
        return {
            valid: false,
            error: 'Phone number must be between 10-15 digits',
        };
    }

    return { valid: true };
}

/**
 * Validate required field (non-empty string)
 *
 * @param value - Value to validate
 * @param fieldName - Name of field for error message
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateRequired(
    value: string,
    fieldName: string = 'This field'
): ValidationResult {
    if (!value || value.trim().length === 0) {
        return { valid: false, error: `${fieldName} is required` };
    }

    return { valid: true };
}

/**
 * Validate string length constraints
 *
 * @param value - String to validate
 * @param min - Minimum length
 * @param max - Maximum length
 * @param fieldName - Name of field for error message
 * @returns ValidationResult with valid flag and optional error message
 */
export function validateLength(
    value: string,
    min: number,
    max: number,
    fieldName: string = 'This field'
): ValidationResult {
    if (!value) {
        return { valid: false, error: `${fieldName} is required` };
    }

    if (value.length < min) {
        return {
            valid: false,
            error: `${fieldName} must be at least ${min} characters`,
        };
    }

    if (value.length > max) {
        return {
            valid: false,
            error: `${fieldName} must be at most ${max} characters`,
        };
    }

    return { valid: true };
}
