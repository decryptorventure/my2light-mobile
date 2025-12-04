// Theme constants matching web app design
export const colors = {
    // Backgrounds
    background: "#0f172a",      // slate-900
    surface: "#1e293b",         // slate-800
    surfaceLight: "#334155",    // slate-700

    // Primary
    primary: "#0866FF",         // Facebook blue
    primaryLight: "#3b82f6",    // blue-500

    // Accent (lime from web)
    accent: "#a3e635",          // lime-400
    accentDark: "#65a30d",      // lime-600

    // Text
    text: "#f1f5f9",            // slate-100
    textSecondary: "#94a3b8",   // slate-400
    textMuted: "#64748b",       // slate-500

    // Status
    success: "#22c55e",         // green-500
    warning: "#f59e0b",         // amber-500
    error: "#ef4444",           // red-500

    // Borders
    border: "#334155",          // slate-700
    borderLight: "#475569",     // slate-600
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const borderRadius = {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
};

export const fontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 24,
    xxxl: 32,
};

export const fontWeight = {
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
};
