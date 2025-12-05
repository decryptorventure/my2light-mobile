import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

// Debug: Log configuration (remove in production)
console.log("🔧 Supabase URL:", supabaseUrl ? supabaseUrl.substring(0, 30) + "..." : "MISSING!");
console.log("🔧 Supabase Key:", supabaseAnonKey ? "eyJhbGc..." + supabaseAnonKey.slice(-10) : "MISSING!");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error("❌ CRITICAL: Supabase credentials missing! Check .env file");
}

// Custom storage with logging for debugging
const customStorage = {
    getItem: async (key: string) => {
        const value = await AsyncStorage.getItem(key);
        console.log("🔑 Storage GET:", key, value ? "found" : "null");
        return value;
    },
    setItem: async (key: string, value: string) => {
        console.log("🔑 Storage SET:", key);
        await AsyncStorage.setItem(key, value);
    },
    removeItem: async (key: string) => {
        console.log("🔑 Storage REMOVE:", key);
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
            console.log("✅ Session ready after", Date.now() - start, "ms");
            return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log("❌ Session timeout after", timeoutMs, "ms");
    return false;
};
