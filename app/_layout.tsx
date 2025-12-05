import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { useAuthStore } from "../stores/authStore";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthService } from "../services/auth.service";

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
    const [checkingOnboarding, setCheckingOnboarding] = useState(false);

    // Initialize auth on app load
    useEffect(() => {
        initialize();
    }, []);

    // Handle auth state changes and navigation
    useEffect(() => {
        if (!initialized) return;

        // Clear cache when user signs out
        if (!user) {
            queryClient.clear();
        }

        const inAuthGroup = segments[0] === "(auth)";
        const inOnboarding = segments[0] === "onboarding";

        const checkOnboarding = async () => {
            if (user && !inAuthGroup && !inOnboarding) {
                setCheckingOnboarding(true);
                try {
                    const result = await AuthService.getCurrentUser();
                    if (result.success && result.data) {
                        // Check if user needs onboarding
                        const profile = result.data;
                        if (!profile.name || profile.name === "") {
                            // New user without name = needs onboarding
                            router.replace("/onboarding");
                            return;
                        }
                    }
                } catch (error) {
                    console.log("Error checking onboarding:", error);
                } finally {
                    setCheckingOnboarding(false);
                }
            }
        };

        if (!user && !inAuthGroup) {
            // User is not signed in and not in auth group, redirect to login
            router.replace("/(auth)/login");
        } else if (user && inAuthGroup) {
            // User is signed in and in auth group, check onboarding first
            setCheckingOnboarding(true);
            AuthService.getCurrentUser().then((result) => {
                if (result.success && result.data) {
                    const profile = result.data;
                    // Check hasOnboarded flag instead of name
                    if (!profile.hasOnboarded) {
                        // New user hasn't completed onboarding
                        router.replace("/onboarding");
                    } else {
                        // Has completed onboarding, go to tabs
                        router.replace("/(tabs)");
                    }
                } else {
                    // No profile = needs onboarding
                    router.replace("/onboarding");
                }
            }).catch((error) => {
                console.log("Error checking onboarding:", error);
                router.replace("/(tabs)");
            }).finally(() => {
                setCheckingOnboarding(false);
            });
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
                <Stack.Screen
                    name="onboarding"
                    options={{
                        animation: "fade",
                    }}
                />
                <Stack.Screen
                    name="feed"
                    options={{
                        presentation: "fullScreenModal",
                        animation: "fade",
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
