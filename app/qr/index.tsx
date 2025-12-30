import { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../constants/theme";

export default function QRScannerScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        return (
            <View style={styles.container}>
                <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={[styles.container, styles.permissionContainer]}>
                <Ionicons name="qr-code-outline" size={64} color={colors.textMuted} />
                <Text style={styles.permissionTitle}>Cần quyền Camera</Text>
                <Text style={styles.permissionText}>
                    Để quét mã QR, ứng dụng cần quyền truy cập Camera
                </Text>
                <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
                    <Text style={styles.permissionButtonText}>Cấp quyền</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
        if (scanned) return;
        setScanned(true);

        // Handle QR code data
        Alert.alert("Quét thành công!", `Mã: ${data}`, [
            {
                text: "Quét lại",
                onPress: () => setScanned(false),
            },
            {
                text: "Xác nhận",
                onPress: () => {
                    // TODO: Process check-in with QR code
                    router.back();
                },
            },
        ]);
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr"],
                }}
            >
                {/* Header */}
                <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <Ionicons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Quét QR vào sân</Text>
                    <View style={styles.placeholder} />
                </View>

                {/* Scan Frame */}
                <View style={styles.scanArea}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                </View>

                {/* Instructions */}
                <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.xl }]}>
                    <Text style={styles.instruction}>Đưa camera vào mã QR tại sân để check-in</Text>
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    loadingText: {
        color: colors.text,
        textAlign: "center",
        marginTop: 100,
    },
    permissionContainer: {
        justifyContent: "center",
        alignItems: "center",
        padding: spacing.xl,
    },
    permissionTitle: {
        color: colors.text,
        fontSize: fontSize.xl,
        fontWeight: fontWeight.bold,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    permissionText: {
        color: colors.textMuted,
        fontSize: fontSize.md,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    permissionButton: {
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.md,
    },
    permissionButtonText: {
        color: colors.background,
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
    },
    backButton: {
        marginTop: spacing.md,
        padding: spacing.md,
    },
    backButtonText: {
        color: colors.primary,
        fontSize: fontSize.md,
    },
    camera: {
        flex: 1,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: spacing.lg,
    },
    closeButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        color: "#fff",
        fontSize: fontSize.lg,
        fontWeight: fontWeight.semibold,
    },
    placeholder: {
        width: 44,
    },
    scanArea: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    scanFrame: {
        width: 250,
        height: 250,
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 40,
        height: 40,
        borderColor: colors.accent,
    },
    cornerTL: {
        top: 0,
        left: 0,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderTopLeftRadius: 12,
    },
    cornerTR: {
        top: 0,
        right: 0,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderTopRightRadius: 12,
    },
    cornerBL: {
        bottom: 0,
        left: 0,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderBottomLeftRadius: 12,
    },
    cornerBR: {
        bottom: 0,
        right: 0,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderBottomRightRadius: 12,
    },
    footer: {
        alignItems: "center",
        paddingHorizontal: spacing.xl,
    },
    instruction: {
        color: "rgba(255,255,255,0.8)",
        fontSize: fontSize.md,
        textAlign: "center",
    },
});
