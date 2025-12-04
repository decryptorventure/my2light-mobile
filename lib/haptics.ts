import * as Haptics from "expo-haptics";

/**
 * Haptic feedback utilities for a native feel
 */
export const haptics = {
    /**
     * Light tap - for toggles, selection changes
     */
    light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

    /**
     * Medium tap - for button presses
     */
    medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

    /**
     * Heavy tap - for important actions
     */
    heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

    /**
     * Success feedback - for completed actions
     */
    success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

    /**
     * Warning feedback - for attention needed
     */
    warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

    /**
     * Error feedback - for failures
     */
    error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

    /**
     * Selection change - for scroll pickers, tabs
     */
    selection: () => Haptics.selectionAsync(),
};

export default haptics;
