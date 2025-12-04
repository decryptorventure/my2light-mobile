/**
 * Recording Store - Zustand store for recording session state
 * @module stores/recordingStore
 */

import { create } from 'zustand';

export interface HighlightMarker {
    id: string;
    timestamp: number; // seconds from recording start
    duration: number;  // highlight duration in seconds
    name: string;
}

export interface RecordingSettings {
    voiceCommandEnabled: boolean;
    highlightDuration: number; // 0-60 seconds
}

interface RecordingState {
    // Settings
    settings: RecordingSettings;
    setVoiceCommandEnabled: (enabled: boolean) => void;
    setHighlightDuration: (duration: number) => void;

    // Recording session
    isRecording: boolean;
    recordingStartTime: number | null;
    elapsedTime: number;
    highlights: HighlightMarker[];
    videoUri: string | null;

    // Actions
    startRecording: () => void;
    stopRecording: (videoUri: string) => void;
    addHighlight: () => void;
    removeHighlight: (id: string) => void;
    resetSession: () => void;
    updateElapsedTime: (time: number) => void;

    // Selected highlights for upload
    selectedHighlightIds: string[];
    toggleHighlightSelection: (id: string) => void;
    selectAllHighlights: () => void;
    clearSelection: () => void;
}

export const useRecordingStore = create<RecordingState>((set, get) => ({
    // Default settings
    settings: {
        voiceCommandEnabled: false,
        highlightDuration: 10, // Default 10 seconds
    },

    setVoiceCommandEnabled: (enabled) =>
        set((state) => ({
            settings: { ...state.settings, voiceCommandEnabled: enabled }
        })),

    setHighlightDuration: (duration) =>
        set((state) => ({
            settings: { ...state.settings, highlightDuration: duration }
        })),

    // Recording state
    isRecording: false,
    recordingStartTime: null,
    elapsedTime: 0,
    highlights: [],
    videoUri: null,

    startRecording: () => set({
        isRecording: true,
        recordingStartTime: Date.now(),
        elapsedTime: 0,
        highlights: [],
        videoUri: null,
    }),

    stopRecording: (videoUri) => set({
        isRecording: false,
        videoUri,
    }),

    addHighlight: () => {
        const state = get();
        const currentTime = state.elapsedTime;
        const duration = state.settings.highlightDuration;
        const highlightNumber = state.highlights.length + 1;

        // Calculate start time (go back X seconds from current time)
        const startTime = Math.max(0, currentTime - duration);

        const newHighlight: HighlightMarker = {
            id: `highlight_${Date.now()}`,
            timestamp: startTime,
            duration: Math.min(duration, currentTime), // Don't exceed video length
            name: `Highlight ${highlightNumber}`,
        };

        set({ highlights: [...state.highlights, newHighlight] });
    },

    removeHighlight: (id) => set((state) => ({
        highlights: state.highlights.filter((h) => h.id !== id),
    })),

    resetSession: () => set({
        isRecording: false,
        recordingStartTime: null,
        elapsedTime: 0,
        highlights: [],
        videoUri: null,
        selectedHighlightIds: [],
    }),

    updateElapsedTime: (time) => set({ elapsedTime: time }),

    // Selection state
    selectedHighlightIds: [],

    toggleHighlightSelection: (id) => set((state) => {
        const isSelected = state.selectedHighlightIds.includes(id);
        return {
            selectedHighlightIds: isSelected
                ? state.selectedHighlightIds.filter((hId) => hId !== id)
                : [...state.selectedHighlightIds, id],
        };
    }),

    selectAllHighlights: () => set((state) => ({
        selectedHighlightIds: state.highlights.map((h) => h.id),
    })),

    clearSelection: () => set({ selectedHighlightIds: [] }),
}));
