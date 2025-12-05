/**
 * Agenda View Screen
 * Calendar view for court owners to see bookings by day
 */

import React, { useState, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";
import { AdminService } from "../../services/admin.service";
import haptics from "../../lib/haptics";

export default function AgendaScreen() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Generate dates for the week
    const weekDates = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() + i);
        return date;
    });

    const { data: bookings, refetch, isLoading } = useQuery({
        queryKey: ["admin", "agenda", selectedDate.toDateString()],
        queryFn: async () => {
            const result = await AdminService.getCourtBookings();
            // Filter bookings for selected date
            const dayStart = new Date(selectedDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(selectedDate);
            dayEnd.setHours(23, 59, 59, 999);

            return result.data?.filter((b) => {
                const bookingDate = new Date(b.startTime);
                return bookingDate >= dayStart && bookingDate <= dayEnd;
            }) || [];
        },
        staleTime: 30000,
    });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    }, [refetch]);

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDayName = (date: Date) => {
        const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
        return days[date.getDay()];
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    // Generate time slots from 6:00 to 22:00
    const timeSlots = Array.from({ length: 17 }, (_, i) => {
        const hour = 6 + i;
        return `${hour.toString().padStart(2, "0")}:00`;
    });

    // Get booking for a specific time slot
    const getBookingForSlot = (slot: string) => {
        const [hours] = slot.split(":").map(Number);
        return bookings?.find((b) => {
            const bookingHour = new Date(b.startTime).getHours();
            return bookingHour === hours;
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Lịch đặt sân</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Date Selector */}
            <View style={styles.dateSelector}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.dateSelectorContent}
                >
                    {weekDates.map((date, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.dateItem,
                                selectedDate.toDateString() === date.toDateString() &&
                                styles.dateItemActive,
                            ]}
                            onPress={() => {
                                setSelectedDate(date);
                                haptics.light();
                            }}
                        >
                            <Text
                                style={[
                                    styles.dayName,
                                    selectedDate.toDateString() === date.toDateString() &&
                                    styles.dayNameActive,
                                    isToday(date) && styles.dayNameToday,
                                ]}
                            >
                                {getDayName(date)}
                            </Text>
                            <Text
                                style={[
                                    styles.dayNumber,
                                    selectedDate.toDateString() === date.toDateString() &&
                                    styles.dayNumberActive,
                                ]}
                            >
                                {date.getDate()}
                            </Text>
                            {isToday(date) && <View style={styles.todayDot} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Calendar View */}
            <ScrollView
                style={styles.calendarView}
                contentContainerStyle={styles.calendarContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.accent}
                    />
                }
            >
                {timeSlots.map((slot) => {
                    const booking = getBookingForSlot(slot);
                    return (
                        <View key={slot} style={styles.timeRow}>
                            <Text style={styles.timeLabel}>{slot}</Text>
                            <View style={styles.slotContainer}>
                                {booking ? (
                                    <View
                                        style={[
                                            styles.bookingBlock,
                                            booking.status === "pending" && styles.bookingPending,
                                            booking.status === "cancelled" && styles.bookingCancelled,
                                        ]}
                                    >
                                        <Text style={styles.bookingCourt}>{booking.courtName}</Text>
                                        <Text style={styles.bookingPlayer}>
                                            {booking.playerName}
                                        </Text>
                                        <Text style={styles.bookingTime}>
                                            {formatTime(booking.startTime)} -{" "}
                                            {formatTime(booking.endTime)}
                                        </Text>
                                    </View>
                                ) : (
                                    <View style={styles.emptySlot} />
                                )}
                            </View>
                        </View>
                    );
                })}
            </ScrollView>

            {/* Summary */}
            <View style={styles.summary}>
                <Text style={styles.summaryText}>
                    Tổng: {bookings?.length || 0} booking •{" "}
                    {selectedDate.toLocaleDateString("vi-VN", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                    })}
                </Text>
            </View>
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
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
    },
    headerTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    dateSelector: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    dateSelectorContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
        gap: spacing.sm,
    },
    dateItem: {
        alignItems: "center",
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        minWidth: 50,
    },
    dateItemActive: {
        backgroundColor: colors.accent,
    },
    dayName: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginBottom: 4,
    },
    dayNameActive: {
        color: colors.background,
    },
    dayNameToday: {
        color: colors.accent,
    },
    dayNumber: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    dayNumberActive: {
        color: colors.background,
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: colors.accent,
        marginTop: 4,
    },
    calendarView: {
        flex: 1,
    },
    calendarContent: {
        paddingVertical: spacing.md,
    },
    timeRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: spacing.md,
        marginBottom: spacing.xs,
    },
    timeLabel: {
        width: 50,
        fontSize: fontSize.sm,
        color: colors.textMuted,
        paddingTop: spacing.sm,
    },
    slotContainer: {
        flex: 1,
        minHeight: 50,
        borderLeftWidth: 1,
        borderLeftColor: colors.border,
        paddingLeft: spacing.md,
    },
    emptySlot: {
        height: 40,
        backgroundColor: colors.surfaceLight,
        borderRadius: borderRadius.sm,
        opacity: 0.3,
    },
    bookingBlock: {
        backgroundColor: `${colors.accent}20`,
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        borderRadius: borderRadius.md,
        padding: spacing.sm,
    },
    bookingPending: {
        backgroundColor: `${colors.warning}20`,
        borderLeftColor: colors.warning,
    },
    bookingCancelled: {
        backgroundColor: `${colors.error}20`,
        borderLeftColor: colors.error,
        opacity: 0.5,
    },
    bookingCourt: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.text,
    },
    bookingPlayer: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
    },
    bookingTime: {
        fontSize: fontSize.xs,
        color: colors.textMuted,
        marginTop: 2,
    },
    summary: {
        padding: spacing.lg,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    summaryText: {
        fontSize: fontSize.sm,
        color: colors.textSecondary,
        textAlign: "center",
    },
});
