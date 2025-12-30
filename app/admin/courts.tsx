/**
 * Courts Management Screen
 * Court owners can view, add, edit, and delete their courts
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    RefreshControl,
    Image,
    Alert,
    ActionSheetIOS,
    Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService } from "../../services/admin.service";
import CourtFormModal from "../../components/admin/CourtFormModal";
import haptics from "../../lib/haptics";

export default function AdminCourtsScreen() {
    const insets = useSafeAreaInsets();
    const queryClient = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCourt, setEditingCourt] = useState<any>(null);

    const {
        data: courts,
        refetch,
        isLoading,
    } = useQuery({
        queryKey: ["admin", "courts"],
        queryFn: async () => {
            const result = await AdminService.getOwnCourts();
            return result.data;
        },
        staleTime: 60000,
    });

    const createMutation = useMutation({
        mutationFn: (data: any) =>
            AdminService.createCourt({
                name: data.name,
                address: data.address,
                description: data.description,
                pricePerHour: parseInt(data.pricePerHour, 10),
                openTime: data.openTime,
                closeTime: data.closeTime,
                facilities: data.facilities,
                images: data.images,
                isActive: data.isActive,
                autoApproveBookings: data.autoApproveBookings,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
            Alert.alert("Thành công", "Đã thêm sân mới");
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            AdminService.updateCourt(id, {
                name: data.name,
                address: data.address,
                description: data.description,
                pricePerHour: parseInt(data.pricePerHour, 10),
                openTime: data.openTime,
                closeTime: data.closeTime,
                facilities: data.facilities,
                images: data.images,
                isActive: data.isActive,
                autoApproveBookings: data.autoApproveBookings,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
            Alert.alert("Thành công", "Đã cập nhật sân");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => AdminService.deleteCourt(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
            Alert.alert("Thành công", "Đã xoá sân");
        },
    });

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            AdminService.toggleCourtStatus(id, isActive),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin", "courts"] });
        },
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const handleAddCourt = () => {
        setEditingCourt(null);
        setModalVisible(true);
        haptics.light();
    };

    const handleEditCourt = (court: any) => {
        setEditingCourt({
            name: court.name,
            address: court.address,
            description: court.description || "",
            pricePerHour: String(court.price_per_hour || ""),
            openTime: court.open_time || "06:00",
            closeTime: court.close_time || "22:00",
            facilities: court.facilities || [],
            images: court.images || [],
            isActive: court.is_active ?? true,
            autoApproveBookings: court.auto_approve_bookings ?? true,
            id: court.id,
        });
        setModalVisible(true);
    };

    const handleCourtActions = (court: any) => {
        haptics.medium();
        const options = [
            "Chỉnh sửa",
            court.is_active ? "Tạm ngưng" : "Kích hoạt",
            "Xoá sân",
            "Huỷ",
        ];

        if (Platform.OS === "ios") {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    destructiveButtonIndex: 2,
                    cancelButtonIndex: 3,
                },
                (buttonIndex) => {
                    if (buttonIndex === 0) handleEditCourt(court);
                    if (buttonIndex === 1)
                        toggleStatusMutation.mutate({ id: court.id, isActive: !court.is_active });
                    if (buttonIndex === 2) confirmDelete(court.id);
                }
            );
        } else {
            Alert.alert("Thao tác", "Chọn hành động", [
                { text: "Chỉnh sửa", onPress: () => handleEditCourt(court) },
                {
                    text: court.is_active ? "Tạm ngưng" : "Kích hoạt",
                    onPress: () =>
                        toggleStatusMutation.mutate({ id: court.id, isActive: !court.is_active }),
                },
                { text: "Xoá sân", style: "destructive", onPress: () => confirmDelete(court.id) },
                { text: "Huỷ", style: "cancel" },
            ]);
        }
    };

    const confirmDelete = (courtId: string) => {
        Alert.alert(
            "Xác nhận xoá",
            "Bạn có chắc muốn xoá sân này? Hành động này không thể hoàn tác.",
            [
                { text: "Huỷ", style: "cancel" },
                {
                    text: "Xoá",
                    style: "destructive",
                    onPress: () => deleteMutation.mutate(courtId),
                },
            ]
        );
    };

    const handleSubmit = async (data: any) => {
        if (editingCourt?.id) {
            await updateMutation.mutateAsync({ id: editingCourt.id, data });
        } else {
            await createMutation.mutateAsync(data);
        }
    };

    const renderCourtItem = ({ item }: { item: any }) => (
        <View style={styles.courtCard}>
            <Image
                source={{
                    uri:
                        item.thumbnail_url ||
                        item.images?.[0] ||
                        "https://images.unsplash.com/photo-1622163642998-1ea36b1dde3b?q=80&w=400",
                }}
                style={styles.courtImage}
            />
            <View style={styles.courtInfo}>
                <Text style={styles.courtName}>{item.name}</Text>
                <Text style={styles.courtAddress} numberOfLines={1}>
                    {item.address}
                </Text>
                <View style={styles.courtMeta}>
                    <Text style={styles.courtPrice}>
                        {(item.price_per_hour || 0).toLocaleString()}đ/h
                    </Text>
                    <View style={[styles.statusBadge, !item.is_active && styles.statusInactive]}>
                        <Text
                            style={[
                                styles.statusText,
                                !item.is_active && styles.statusTextInactive,
                            ]}
                        >
                            {item.is_active ? "Hoạt động" : "Tạm ngưng"}
                        </Text>
                    </View>
                </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={() => handleCourtActions(item)}>
                <Ionicons name="ellipsis-vertical" size={20} color={colors.textMuted} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Quản lý sân</Text>
                <TouchableOpacity style={styles.addButton} onPress={handleAddCourt}>
                    <Ionicons name="add" size={24} color={colors.background} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={courts || []}
                keyExtractor={(item) => item.id}
                renderItem={renderCourtItem}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Ionicons name="business-outline" size={64} color={colors.surfaceLight} />
                        <Text style={styles.emptyTitle}>Chưa có sân nào</Text>
                        <Text style={styles.emptyDesc}>
                            Nhấn nút + để thêm sân đầu tiên của bạn
                        </Text>
                    </View>
                }
            />

            <CourtFormModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                initialData={editingCourt || undefined}
                mode={editingCourt ? "edit" : "create"}
            />
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
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    headerTitle: {
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.accent,
        justifyContent: "center",
        alignItems: "center",
    },
    listContent: {
        padding: spacing.lg,
        paddingBottom: 120,
    },
    courtCard: {
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        overflow: "hidden",
        marginBottom: spacing.md,
    },
    courtImage: {
        width: 100,
        height: 100,
    },
    courtInfo: {
        flex: 1,
        padding: spacing.md,
        justifyContent: "center",
    },
    courtName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginBottom: 4,
    },
    courtAddress: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginBottom: spacing.xs,
    },
    courtMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.sm,
    },
    courtPrice: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.semibold,
        color: colors.accent,
    },
    statusBadge: {
        backgroundColor: `${colors.success}20`,
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.full,
    },
    statusInactive: {
        backgroundColor: `${colors.textMuted}20`,
    },
    statusText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
        color: colors.success,
    },
    statusTextInactive: {
        color: colors.textMuted,
    },
    editButton: {
        justifyContent: "center",
        paddingHorizontal: spacing.md,
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: spacing.xxl * 2,
    },
    emptyTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
        marginTop: spacing.lg,
    },
    emptyDesc: {
        fontSize: fontSize.sm,
        color: colors.textMuted,
        marginTop: spacing.xs,
        textAlign: "center",
    },
});
