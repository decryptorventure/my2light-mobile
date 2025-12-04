import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: "#1a1a1a",
                    borderTopWidth: 0.5,
                    borderTopColor: "#333",
                    height: 50 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
                tabBarActiveTintColor: "#0866FF", // Facebook blue
                tabBarInactiveTintColor: "#B0B3B8",
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: "600",
                    marginTop: -4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Trang chủ",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "home" : "home-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="social"
                options={{
                    title: "Cộng đồng",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "people" : "people-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="match"
                options={{
                    title: "Tìm kèo",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "tennisball" : "tennisball-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="library"
                options={{
                    title: "Thư viện",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "play-circle" : "play-circle-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Cá nhân",
                    tabBarIcon: ({ focused, color, size }) => (
                        <Ionicons
                            name={focused ? "person-circle" : "person-circle-outline"}
                            size={26}
                            color={color}
                        />
                    ),
                }}
            />
        </Tabs>
    );
}
