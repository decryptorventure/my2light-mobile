import { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";
import { isSupabaseConfigured } from "../../lib/supabase";
import { Button, Input } from "../../components/ui";
import { colors, fontSize, fontWeight, spacing } from "../../constants/theme";

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { signIn, signUp, loading } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = "Vui lòng nhập email";
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email không hợp lệ";
        }

        if (!password) {
            newErrors.password = "Vui lòng nhập mật khẩu";
        } else if (password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!isSupabaseConfigured()) {
            Alert.alert(
                "Chưa cấu hình",
                "Vui lòng cấu hình Supabase URL và Anon Key trong file .env"
            );
            return;
        }

        if (!validate()) return;

        const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password);

        if (error) {
            Alert.alert("Lỗi", error.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={[
                    styles.scrollContent,
                    { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 20 },
                ]}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo & Title */}
                <View style={styles.header}>
                    <Text style={styles.logo}>⚽</Text>
                    <Text style={styles.title}>My2Light</Text>
                    <Text style={styles.subtitle}>
                        {isSignUp ? "Tạo tài khoản mới" : "Đăng nhập để tiếp tục"}
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Input
                        label="Email"
                        placeholder="Nhập email của bạn"
                        value={email}
                        onChangeText={(text) => {
                            setEmail(text);
                            if (errors.email) setErrors({ ...errors, email: undefined });
                        }}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        leftIcon="mail-outline"
                        error={errors.email}
                    />

                    <Input
                        label="Mật khẩu"
                        placeholder="Nhập mật khẩu"
                        value={password}
                        onChangeText={(text) => {
                            setPassword(text);
                            if (errors.password) setErrors({ ...errors, password: undefined });
                        }}
                        secureTextEntry
                        leftIcon="lock-closed-outline"
                        error={errors.password}
                    />

                    <Button
                        title={isSignUp ? "Đăng ký" : "Đăng nhập"}
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        size="lg"
                        style={{ marginTop: spacing.sm }}
                    />

                    <Button
                        title={
                            isSignUp ? "Đã có tài khoản? Đăng nhập" : "Chưa có tài khoản? Đăng ký"
                        }
                        onPress={() => setIsSignUp(!isSignUp)}
                        variant="ghost"
                        fullWidth
                    />
                </View>

                {/* Demo Mode Notice */}
                {!isSupabaseConfigured() && (
                    <View style={styles.demoNotice}>
                        <Text style={styles.demoText}>⚠️ Demo Mode: Chưa cấu hình Supabase</Text>
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        alignItems: "center",
        marginBottom: spacing.xxl,
    },
    logo: {
        fontSize: 72,
        marginBottom: spacing.md,
    },
    title: {
        fontSize: fontSize.xxxl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    subtitle: {
        fontSize: fontSize.lg,
        color: colors.textMuted,
        marginTop: spacing.sm,
    },
    form: {
        gap: spacing.xs,
    },
    demoNotice: {
        marginTop: spacing.xxl,
        backgroundColor: "#fef3c7",
        padding: spacing.md,
        borderRadius: 8,
        alignItems: "center",
    },
    demoText: {
        color: "#92400e",
        fontSize: fontSize.sm,
    },
});
