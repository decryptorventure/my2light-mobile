export interface HighlightEvent {
    timestamp: number;
    type: "spike" | "block" | "ace" | "save";
}

export interface Highlight {
    id: string;
    userId: string;
    courtId: string;
    thumbnailUrl: string;
    videoUrl: string;
    durationSec: number;
    createdAt: string;
    likes: number;
    views: number;
    courtName: string;
    userAvatar: string;
    userName: string;
    isLiked: boolean;
    isPublic: boolean;
    comments: number;
    highlightEvents: HighlightEvent[];
}
