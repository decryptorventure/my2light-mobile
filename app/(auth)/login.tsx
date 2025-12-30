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
import { colors, fontSize, fontWeight, spacing } from "@/shared/constants/theme";
import { validateEmail, validatePassword } from "../../src/shared/utils/validation";

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const { signIn, signUp, loading } = useAuthStore();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignUp, setIsSignUp] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

    // Rate limiting state
    const [loginAttempts, setLoginAttempts] = useState(0);
    const [lockoutTime, setLockoutTime] = useState<number | null>(null);

    const validate = () => {
        const newErrors: { email?: string; password?: string } = {};

        // RFC 5322 email validation
        const emailResult = validateEmail(email);
        if (!emailResult.valid) {
            // Translate error to Vietnamese
            if (emailResult.error?.includes("required")) {
                newErrors.email = "Vui lòng nhập email";
            } else {
                newErrors.email = "Email không hợp lệ";
            }
        }

        // Strong password validation (12+ chars, uppercase, lowercase, numbers)
        const passwordResult = validatePassword(password);
        if (!passwordResult.valid) {
            // Translate errors to Vietnamese
            if (passwordResult.error?.includes("required")) {
                newErrors.password = "Vui lòng nhập mật khẩu";
            } else if (passwordResult.error?.includes("12 characters")) {
                newErrors.password = "Mật khẩu phải có ít nhất 12 ký tự";
            } else if (passwordResult.error?.includes("uppercase")) {
                newErrors.password = "Mật khẩu phải có ít nhất 1 chữ hoa";
            } else if (passwordResult.error?.includes("lowercase")) {
                newErrors.password = "Mật khẩu phải có ít nhất 1 chữ thường";
            } else if (passwordResult.error?.includes("number")) {
                newErrors.password = "Mật khẩu phải có ít nhất 1 số";
            } else {
                newErrors.password = passwordResult.error || "Mật khẩu không hợp lệ";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        // Check Supabase configuration
        if (!isSupabaseConfigured()) {
            Alert.alert(
                "Chưa cấu hình",
                "Vui lòng cấu hình Supabase URL và Anon Key trong file .env"
            );
            return;
        }

        // Check rate limiting lockout
        const now = Date.now();
        if (lockoutTime && now < lockoutTime) {
            const remainingSeconds = Math.ceil((lockoutTime - now) / 1000);
            Alert.alert("Quá nhiều lần thử", `Vui lòng thử lại sau ${remainingSeconds} giây`);
            return;
        }

        // Validate input
        if (!validate()) return;

        try {
            // Attempt sign in/up
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                // Increment failed attempts
                const newAttempts = loginAttempts + 1;
                setLoginAttempts(newAttempts);

                // Apply lockout after 5 failed attempts
                if (newAttempts >= 5) {
                    setLockoutTime(now + 60000); // 1 minute lockout
                    Alert.alert(
                        "Quá nhiều lần thử",
                        "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau 1 phút."
                    );
                } else {
                    Alert.alert("Lỗi", error.message);
                }
            } else {
                // Reset rate limiting on success
                setLoginAttempts(0);
                setLockoutTime(null);
            }
        } catch (error) {
            Alert.alert("Lỗi", "Đã xảy ra lỗi không mong muốn");
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
