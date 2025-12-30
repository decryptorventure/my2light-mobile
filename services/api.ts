import { AuthService } from "./auth.service";
import { CourtService } from "./court.service";
import { HighlightService } from "./highlight.service";
import { BookingService } from "./booking.service";
import { MatchService } from "./match.service";
import { NotificationService } from "./notification.service";
import { TransactionService } from "./transaction.service";

// Re-export everything for backward compatibility
export const ApiService = {
    ...AuthService,
    ...CourtService,
    ...HighlightService,
    ...BookingService,
    ...MatchService,
    ...NotificationService,
    ...TransactionService,
};

// Export individual service namespaces for backward compatibility
export const authService = {
    getCurrentUser: AuthService.getCurrentUser,
    updateProfile: AuthService.updateUserProfile,
};

export const courtsService = {
    getCourts: CourtService.getCourts,
    getCourtById: CourtService.getCourtById,
};

export const highlightsService = {
    getHighlights: HighlightService.getHighlights,
    getUserHighlights: HighlightService.getUserHighlights,
    createHighlight: HighlightService.createHighlight,
    toggleLike: HighlightService.toggleLike,
};

export const bookingsService = {
    getBookingHistory: BookingService.getBookingHistory,
    getActiveBooking: BookingService.getActiveBooking,
};

export const matchService = {
    getMatchRequests: MatchService.getMatchRequests,
    createMatchRequest: MatchService.createMatchRequest,
};

export const notificationsService = {
    getNotifications: NotificationService.getNotifications,
    markRead: NotificationService.markNotificationRead,
    markAllRead: NotificationService.markAllNotificationsRead,
    getUnreadCount: NotificationService.getUnreadNotificationCount,
};

export const transactionsService = {
    getTransactions: TransactionService.getTransactions,
    getUserCredits: TransactionService.getUserCredits,
};
