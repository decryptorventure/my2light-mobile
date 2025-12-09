/**
 * Logger utility for My2Light
 * - In development: logs everything to console
 * - In production: logs only warnings and errors, no sensitive data
 */

const isDev = __DEV__;

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
    /** Optional tag/module name for the log */
    tag?: string;
    /** If true, log even in production (for critical errors) */
    forceLog?: boolean;
}

const formatMessage = (level: LogLevel, message: string, tag?: string): string => {
    const timestamp = new Date().toISOString().slice(11, 23);
    const prefix = tag ? `[${tag}]` : '';
    return `${timestamp} ${level.toUpperCase()} ${prefix} ${message}`;
};

const sanitize = (data: any): any => {
    if (!data) return data;
    if (typeof data === 'string') {
        // Mask potential sensitive fields
        return data
            .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]*/g, '[JWT_MASKED]')
            .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, '[UUID]');
    }
    if (typeof data === 'object') {
        const sanitized: any = Array.isArray(data) ? [] : {};
        for (const key in data) {
            const lowerKey = key.toLowerCase();
            if (
                lowerKey.includes('password') ||
                lowerKey.includes('token') ||
                lowerKey.includes('secret') ||
                lowerKey.includes('key') ||
                lowerKey.includes('authorization')
            ) {
                sanitized[key] = '[REDACTED]';
            } else {
                sanitized[key] = sanitize(data[key]);
            }
        }
        return sanitized;
    }
    return data;
};

export const logger = {
    /**
     * Debug logs - only shown in development
     */
    debug: (message: string, data?: any, options?: LoggerOptions) => {
        if (!isDev) return;
        const formatted = formatMessage('debug', message, options?.tag);
        if (data !== undefined) {
            console.log(formatted, data);
        } else {
            console.log(formatted);
        }
    },

    /**
     * Info logs - shown in dev, sanitized in production if forceLog
     */
    info: (message: string, data?: any, options?: LoggerOptions) => {
        if (!isDev && !options?.forceLog) return;
        const formatted = formatMessage('info', message, options?.tag);
        const safeData = isDev ? data : sanitize(data);
        if (safeData !== undefined) {
            console.log(formatted, safeData);
        } else {
            console.log(formatted);
        }
    },

    /**
     * Warning logs - always shown, sanitized in production
     */
    warn: (message: string, data?: any, options?: LoggerOptions) => {
        const formatted = formatMessage('warn', message, options?.tag);
        const safeData = isDev ? data : sanitize(data);
        if (safeData !== undefined) {
            console.warn(formatted, safeData);
        } else {
            console.warn(formatted);
        }
    },

    /**
     * Error logs - always shown, sanitized in production
     * These should be sent to Sentry in production
     */
    error: (message: string, error?: any, options?: LoggerOptions) => {
        const formatted = formatMessage('error', message, options?.tag);
        const safeError = isDev ? error : sanitize(error);
        if (safeError !== undefined) {
            console.error(formatted, safeError);
        } else {
            console.error(formatted);
        }

        // TODO: Send to Sentry in production
        // if (!isDev && Sentry) {
        //   Sentry.captureException(error);
        // }
    },

    /**
     * Create a tagged logger instance for a specific module
     */
    create: (tag: string) => ({
        debug: (message: string, data?: any) => logger.debug(message, data, { tag }),
        info: (message: string, data?: any, forceLog?: boolean) =>
            logger.info(message, data, { tag, forceLog }),
        warn: (message: string, data?: any) => logger.warn(message, data, { tag }),
        error: (message: string, error?: any) => logger.error(message, error, { tag }),
    }),
};

// Pre-created loggers for common modules
export const authLogger = logger.create('Auth');
export const uploadLogger = logger.create('Upload');
export const apiLogger = logger.create('API');
export const storageLogger = logger.create('Storage');
