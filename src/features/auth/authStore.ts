import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabase } from "@/lib/supabase";
import { zustandStorage } from "@/lib/storage";
import type { User, Session } from "@supabase/supabase-js";

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

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
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
                    supabase.auth.onAuthStateChange((_event, session) => {
                        set({
                            session,
                            user: session?.user || null,
                        });
                    });
                } catch (error) {
                    console.error("Auth initialization error:", error);
                    set({ loading: false, initialized: true });
                }
            },

            signIn: async (email: string, password: string) => {
                set({ loading: true });
                try {
                    const { data, error } = await supabase.auth.signInWithPassword({
                        email,
                        password,
                    });

                    if (error) throw error;

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
                    const { data, error } = await supabase.auth.signUp({
                        email,
                        password,
                    });

                    if (error) throw error;

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
        }),
        {
            name: 'auth-storage',
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                user: state.user,
                session: state.session,
            }),
        }
    )
);
