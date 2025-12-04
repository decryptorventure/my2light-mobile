import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client with sensible defaults
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 60000, // 1 minute
            retry: 2,
            refetchOnWindowFocus: false,
        },
    },
});

function RootLayoutNav() {
    const { user, loading, initialized, initialize } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();

    // Initialize auth on app load
    useEffect(() => {
        initialize();
    }, []);

    // Handle auth state changes and navigation
    useEffect(() => {
        if (!initialized) return;

        const inAuthGroup = segments[0] === "(auth)";

        if (!user && !inAuthGroup) {
            // User is not signed in and not in auth group, redirect to login
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            // User is signed in and in auth group, redirect to main app
            router.replace("/(tabs)");
        }
    }, [user, initialized, segments]);

    // Show loading screen while initializing
    if (!initialized || loading) {
        return (
            <View style={styles.loading}>
                <StatusBar style="light" />
                <ActivityIndicator size="large" color="#a3e635" />
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="record"
                    options={{
                        presentation: "fullScreenModal",
                        animation: "slide_from_bottom",
                    }}
                />
                <Stack.Screen
                    name="notifications"
                    options={{
                        animation: "slide_from_right",
                    }}
                />
                <Stack.Screen
                    name="settings"
                    options={{
                        animation: "slide_from_right",
                    }}
                />
                <Stack.Screen
                    name="qr"
                    options={{
                        presentation: "fullScreenModal",
                        animation: "slide_from_bottom",
                    }}
                />
                <Stack.Screen
                    name="video"
                    options={{
                        presentation: "fullScreenModal",
                        animation: "fade",
                    }}
                />
                <Stack.Screen
                    name="create-match"
                    options={{
                        presentation: "modal",
                        animation: "slide_from_bottom",
                    }}
                />
            </Stack>
        </>
    );
}

export default function RootLayout() {
    return (
        <QueryClientProvider client={queryClient}>
            <RootLayoutNav />
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        backgroundColor: "#0f172a",
        justifyContent: "center",
        alignItems: "center",
    },
});
