import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { storageLogger } from "./logger";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Only log configuration status in development
storageLogger.debug("Supabase config status", {
    urlConfigured: !!supabaseUrl,
    keyConfigured: !!supabaseAnonKey,
});

if (!supabaseUrl || !supabaseAnonKey) {
    storageLogger.error("CRITICAL: Supabase credentials missing! Check .env file");
}

// Custom storage with development-only logging
const customStorage = {
    getItem: async (key: string) => {
        const value = await AsyncStorage.getItem(key);
        storageLogger.debug(`Storage GET: ${key}`, { found: !!value });
        return value;
    },
    setItem: async (key: string, value: string) => {
        storageLogger.debug(`Storage SET: ${key}`);
        await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        storageLogger.debug(`Storage REMOVE: ${key}`);
        await AsyncStorage.removeItem(key);
    },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: customStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // Important for React Native
        flowType: 'pkce', // Recommended for mobile
    },
});

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => {
    return supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
};

// Helper to wait for session persistence
export const waitForSession = async (timeoutMs = 3000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            storageLogger.debug(`Session ready after ${Date.now() - start}ms`);
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    storageLogger.warn(`Session timeout after ${timeoutMs}ms`);
    return false;
};
