import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { authLogger } from "../lib/logger";
import { getStorage } from "../src/lib/storage";

interface AuthState {
    user: User | null;
    session: Session | null;
    loading: boolean;
    initialized: boolean;

    // Actions
    initialize: () => Promise<void>;
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
    signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
    signOut: () => Promise<void>;
    setUser: (user: User | null) => void;
    setSession: (session: Session | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    session: null,
    loading: true,
    initialized: false,

    initialize: async () => {
        try {
            // Get initial session
            const {
                data: { session },
            } = await supabase.auth.getSession();

            // Check token expiry (security enhancement)
            if (session?.expires_at) {
                const expiryTime = session.expires_at * 1000; // Convert to milliseconds
                const now = Date.now();

                if (expiryTime < now) {
                    authLogger.warn("Session token expired, signing out");
                    await supabase.auth.signOut();
                    set({ loading: false, initialized: true });
                    return;
                }
            }

            set({
                session,
                user: session?.user || null,
                loading: false,
                initialized: true,
            });

            // Listen for auth changes
            supabase.auth.onAuthStateChange((event, session) => {
                set({
                    session,
                    user: session?.user || null,
                });

                // Clear any cached user data when auth state changes
                if (event === "SIGNED_OUT" || event === "USER_UPDATED") {
                    authLogger.debug("Auth state changed", { event });
                }
            });
        } catch (error) {
            authLogger.error("Auth initialization error", error);
            set({ loading: false, initialized: true });
        }
    },

    signIn: async (email: string, password: string) => {
        set({ loading: true });
        try {
            authLogger.debug("signIn: Starting login");

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                authLogger.error("signIn error", { message: error.message });
                throw error;
            }

            authLogger.debug("signIn: Success", { hasSession: !!data.session });

            // Wait a moment for AsyncStorage to persist
            await new Promise((resolve) => setTimeout(resolve, 500));

            set({
                user: data.user,
                session: data.session,
                loading: false,
            });

            return { error: null };
        } catch (error) {
            set({ loading: false });
            return { error: error as Error };
        }
    },

    signUp: async (email: string, password: string) => {
        set({ loading: true });
        try {
            authLogger.debug("signUp: Starting registration");

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            if (error) {
                authLogger.error("signUp error", { message: error.message });
                throw error;
            }

            authLogger.debug("signUp: Success", {
                hasUser: !!data.user,
                hasSession: !!data.session,
            });

            // Wait a moment for AsyncStorage to persist
            await new Promise((resolve) => setTimeout(resolve, 500));

            set({
                user: data.user,
                session: data.session,
                loading: false,
            });

            return { error: null };
        } catch (error) {
            authLogger.error("signUp exception", error);
            set({ loading: false });
            return { error: error as Error };
        }
    },

    signOut: async () => {
        set({ loading: true });

        try {
            // Sign out from Supabase
            await supabase.auth.signOut();

            // Explicit storage cleanup (security enhancement)
            try {
                const storage = getStorage();
                const keys = storage.getAllKeys();

                // Clear all auth-related storage keys
                keys.forEach((key: string) => {
                    if (
                        key.includes("auth") ||
                        key.includes("session") ||
                        key.includes("user") ||
                        key.includes("token")
                    ) {
                        storage.remove(key);
                        authLogger.debug("Cleared storage key on logout", { key });
                    }
                });
            } catch (storageError) {
                authLogger.error("Storage cleanup error during logout", storageError);
            }

            // Clear state
            set({
                user: null,
                session: null,
                loading: false,
            });

            authLogger.debug("User signed out successfully");
        } catch (error) {
            authLogger.error("Sign out error", error);
            set({ loading: false });
        }
    },

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
}));
