import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User, Session } from "@supabase/supabase-js";
import { authLogger } from "../lib/logger";

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
            const { data: { session } } = await supabase.auth.getSession();

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
                if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                    authLogger.debug('Auth state changed', { event });
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
            await new Promise(resolve => setTimeout(resolve, 500));

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
                hasSession: !!data.session
            });

            // Wait a moment for AsyncStorage to persist
            await new Promise(resolve => setTimeout(resolve, 500));

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
        await supabase.auth.signOut();
        set({
            user: null,
            session: null,
            loading: false,
        });
    },

    setUser: (user) => set({ user }),
    setSession: (session) => set({ session }),
}));
