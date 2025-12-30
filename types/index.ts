// Core types from web app - adapted for mobile

export interface User {
    id: string;
    name: string;
    avatar: string;
    phone: string;
    totalHighlights: number;
    hoursPlayed: number;
    courtsVisited: number;
    credits: number; // Wallet balance (VND)
    membershipTier: "free" | "pro" | "elite";
    role?: "player" | "court_owner" | "both";
    // Social fields
    bio?: string;
    isPublic?: boolean;
    followersCount?: number;
    followingCount?: number;
    hasOnboarded?: boolean; // Track if user completed onboarding
}

export interface Court {
    id: string;
    name: string;
    address: string;
    status: "live" | "busy" | "available" | "maintenance";
    thumbnailUrl: string;
    distanceKm: number;
    pricePerHour: number;
    rating: number;
    // Optional fields for CourtDetail page
    images?: string[];
    facilities?: string[];
    description?: string;
    openTime?: string;
    closeTime?: string;
    totalReviews?: number;
    features?: string[];
}

export interface HighlightEvent {
    timestamp: number;
    description?: string;
}

export interface Highlight {
    id: string;
    userId: string;
    courtId: string;
    thumbnailUrl: string;
    videoUrl: string;
    durationSec: number;
    createdAt: string; // ISO String
    likes: number;
    views: number;
    courtName?: string; // Joined data
    userAvatar?: string; // Joined data
    userName?: string; // Joined data
    isLiked?: boolean; // Client state
    isPublic?: boolean; // Privacy setting
    description?: string; // Video description
    title?: string; // Video title
    comments?: number; // Comment count
    highlightEvents?: { id: string; timestamp: number }[]; // Highlight timestamps
}

export interface Package {
    id: string;
    name: string;
    price: number;
    durationMinutes: number;
    description: string;
    isBestValue?: boolean;
    features: string[];
    type?: "per_booking" | "monthly" | "session_pack" | "fixed_slot";
    sessionCount?: number;
    validityDays?: number;
}

export interface Booking {
    id: string;
    userId: string;
    courtId: string;
    packageId: string;
    startTime: number; // timestamp
    endTime: number; // timestamp
    status: "pending" | "approved" | "active" | "completed" | "cancelled" | "rejected";
    totalAmount: number;
    courtName?: string; // Expanded for UI
    packageName?: string; // Expanded for UI
    packageType?: "standard" | "full_match";
}

export interface MatchRequest {
    id: string;
    userId: string;
    courtId?: string;
    preferredTime: string;
    skillLevel: "beginner" | "intermediate" | "advanced" | "pro";
    matchType: "singles" | "doubles" | "any";
    gender: "male" | "female" | "mixed" | "any";
    status: "open" | "matched" | "cancelled" | "expired";
    description?: string;
    createdAt: string;
    profile?: {
        name?: string;
        avatar?: string;
    };
}

export interface UserMembership {
    id: string;
    userId: string;
    packageId: string;
    remainingSessions: number;
    startDate: string;
    endDate?: string;
    status: "active" | "expired" | "used_up";
    package?: Package;
}

export interface ApiResponse<T> {
    data: T;
    success: boolean;
    message?: string;
    error?: string;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    title: string;
    message?: string;
    data?: any;
    isRead: boolean;
    createdAt: string;
}

export interface VideoSegment {
    id: string;
    recordingSessionId: string;
    userId: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: "pending" | "uploaded" | "processed" | "failed";
    createdAt: string;
    videoUrl?: string;
    thumbnailUrl?: string;
    isSelected?: boolean; // Client-side only
}

export interface VideoProcessingJob {
    id: string;
    userId: string;
    status: "pending" | "processing" | "completed" | "failed";
    createdAt: string;
    updatedAt: string;
    resultUrl?: string;
    error?: string;
    metadata?: any;
}

// Transaction type for Wallet
export interface Transaction {
    id: string;
    type: "topup" | "booking" | "refund";
    amount: number;
    description: string;
    timestamp: number;
    status: "completed" | "pending" | "failed";
}
