import { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/shared/constants/theme";
import { Input, Button } from "../components/ui";

type MatchType = "single" | "double";
type Level = "beginner" | "intermediate" | "advanced";
type Gender = "any" | "male" | "female";

export default function CreateMatchScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [matchType, setMatchType] = useState<MatchType>("single");
    const [level, setLevel] = useState<Level>("beginner");
    const [gender, setGender] = useState<Gender>("any");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [location, setLocation] = useState("");
    const [note, setNote] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!date || !time || !location) {
            Alert.alert("Lỗi", "Vui lòng điền đầy đủ thông tin");
            return;
        }

        setLoading(true);
        // TODO: Create match in Supabase
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Thành công", "Đã tạo kèo thành công!", [
                { text: "OK", onPress: () => router.back() },
            ]);
        }, 1000);
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.title}>Tạo kèo mới</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Match Type */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Loại kèo</Text>
                    <View style={styles.optionsRow}>
                        <TouchableOpacity
                            style={[styles.option, matchType === "single" && styles.optionActive]}
                            onPress={() => setMatchType("single")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    matchType === "single" && styles.optionTextActive,
                                ]}
                            >
                                Đánh đơn
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.option, matchType === "double" && styles.optionActive]}
                            onPress={() => setMatchType("double")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    matchType === "double" && styles.optionTextActive,
                                ]}
                            >
                                Đánh đôi
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Skill Level */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Trình độ</Text>
                    <View style={styles.optionsRow}>
                        <TouchableOpacity
                            style={[
                                styles.optionSmall,
                                level === "beginner" && styles.optionActive,
                            ]}
                            onPress={() => setLevel("beginner")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    level === "beginner" && styles.optionTextActive,
                                ]}
                            >
                                Beginner
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionSmall,
                                level === "intermediate" && styles.optionActive,
                            ]}
                            onPress={() => setLevel("intermediate")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    level === "intermediate" && styles.optionTextActive,
                                ]}
                            >
                                Intermediate
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.optionSmall,
                                level === "advanced" && styles.optionActive,
                            ]}
                            onPress={() => setLevel("advanced")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    level === "advanced" && styles.optionTextActive,
                                ]}
                            >
                                Advanced
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Gender */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Giới tính đối thủ</Text>
                    <View style={styles.optionsRow}>
                        <TouchableOpacity
                            style={[styles.optionSmall, gender === "any" && styles.optionActive]}
                            onPress={() => setGender("any")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    gender === "any" && styles.optionTextActive,
                                ]}
                            >
                                Bất kỳ
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.optionSmall, gender === "male" && styles.optionActive]}
                            onPress={() => setGender("male")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    gender === "male" && styles.optionTextActive,
                                ]}
                            >
                                Nam
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.optionSmall, gender === "female" && styles.optionActive]}
                            onPress={() => setGender("female")}
                        >
                            <Text
                                style={[
                                    styles.optionText,
                                    gender === "female" && styles.optionTextActive,
                                ]}
                            >
                                Nữ
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Date & Time */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Thời gian</Text>
                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Input
                                placeholder="DD/MM/YYYY"
                                value={date}
                                onChangeText={setDate}
                                leftIcon="calendar-outline"
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Input
                                placeholder="HH:MM"
                                value={time}
                                onChangeText={setTime}
                                leftIcon="time-outline"
                            />
                        </View>
                    </View>
                </View>

                {/* Location */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Địa điểm</Text>
                    <Input
                        placeholder="Tên sân hoặc địa chỉ"
                        value={location}
                        onChangeText={setLocation}
                        leftIcon="location-outline"
                    />
                </View>

                {/* Note */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Ghi chú (tùy chọn)</Text>
                    <Input
                        placeholder="VD: Giao lưu nhẹ nhàng"
                        value={note}
                        onChangeText={setNote}
                        multiline
                    />
                </View>

                {/* Submit Button */}
                <Button
                    title="Tạo kèo"
                    onPress={handleCreate}
                    loading={loading}
                    fullWidth
                    size="lg"
                    style={styles.submitButton}
                />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
        color: colors.text,
    },
    placeholder: {
        width: 28,
    },
    scrollContent: {
        padding: spacing.lg,
        paddingBottom: 100,
    },
    section: {
        marginBottom: spacing.xl,
    },
    sectionTitle: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.textMuted,
        marginBottom: spacing.md,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    optionsRow: {
        flexDirection: "row",
        gap: spacing.sm,
    },
    option: {
        flex: 1,
        paddingVertical: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    optionSmall: {
        flex: 1,
        paddingVertical: spacing.sm,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md,
        alignItems: "center",
        borderWidth: 2,
        borderColor: "transparent",
    },
    optionActive: {
        borderColor: colors.accent,
        backgroundColor: "rgba(163, 230, 53, 0.1)",
    },
    optionText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        fontWeight: fontWeight.medium,
    },
    optionTextActive: {
        color: colors.accent,
    },
    row: {
        flexDirection: "row",
        gap: spacing.md,
    },
    halfInput: {
        flex: 1,
    },
    submitButton: {
        marginTop: spacing.lg,
    },
});
