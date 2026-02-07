/**
 * Login Screen
 * OAuth login flow for Deriv authentication.
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable, Linking, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../theme';
import { useDerivAuth } from '../context/DerivAuthContext';

export default function LoginScreen({ navigation }) {
    const { getLoginURL, handleOAuthCallback, isLoading, error } = useDerivAuth();
    const [showDemo, setShowDemo] = useState(false);

    const handleLogin = useCallback(async () => {
        const url = getLoginURL();

        if (Platform.OS === 'web') {
            // For web, open in new window and listen for callback
            const popup = window.open(url, 'deriv_oauth', 'width=500,height=600');

            // Listen for OAuth callback
            const handleMessage = async (event) => {
                if (event.data?.type === 'deriv_oauth_callback') {
                    window.removeEventListener('message', handleMessage);
                    try {
                        await handleOAuthCallback(event.data.url);
                        navigation.replace('Home');
                    } catch (err) {
                        console.error('OAuth callback error:', err);
                    }
                }
            };
            window.addEventListener('message', handleMessage);
        } else {
            // For native, use Linking
            await Linking.openURL(url);
        }
    }, [getLoginURL, handleOAuthCallback, navigation]);

    const handleDemoMode = useCallback(() => {
        // Skip login and use simulation mode
        navigation.replace('Home');
    }, [navigation]);

    return (
        <View style={styles.container}>
            {/* Background gradient effect */}
            <View style={styles.gradientBg} />

            {/* Logo area */}
            <Animated.View entering={FadeInDown.delay(100)} style={styles.logoSection}>
                <View style={styles.logoCircle}>
                    <MaterialCommunityIcons name="trophy-variant" size={48} color={colors.primary} />
                </View>
                <Text style={styles.appName}>TradeCraft Arena</Text>
                <Text style={styles.tagline}>Build your routine. Show your talent.</Text>
            </Animated.View>

            {/* Login options */}
            <Animated.View entering={FadeInUp.delay(300)} style={styles.loginSection}>
                <Text style={styles.sectionTitle}>Connect to Trade</Text>

                {/* Deriv Login Button */}
                <Pressable
                    onPress={handleLogin}
                    disabled={isLoading}
                    style={({ pressed }) => [
                        styles.loginButton,
                        styles.derivButton,
                        shadows.toy(colors.primaryDark),
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <View style={styles.buttonContent}>
                        <MaterialCommunityIcons name="connection" size={24} color="#FFF" />
                        <View style={styles.buttonText}>
                            <Text style={styles.buttonTitle}>Connect with Deriv</Text>
                            <Text style={styles.buttonSubtitle}>Trade with real or demo account</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color="rgba(255,255,255,0.6)" />
                    </View>
                </Pressable>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Demo Mode Button */}
                <Pressable
                    onPress={handleDemoMode}
                    style={({ pressed }) => [
                        styles.loginButton,
                        styles.demoButton,
                        pressed && styles.buttonPressed,
                    ]}
                >
                    <View style={styles.buttonContent}>
                        <MaterialCommunityIcons name="play-circle-outline" size={24} color={colors.primary} />
                        <View style={styles.buttonText}>
                            <Text style={[styles.buttonTitle, { color: colors.textPrimary }]}>Rehearsal Mode</Text>
                            <Text style={styles.buttonSubtitle}>Practice with simulated data</Text>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textMuted} />
                    </View>
                </Pressable>

                {/* Error display */}
                {error && (
                    <View style={styles.errorBox}>
                        <MaterialCommunityIcons name="alert-circle" size={18} color={colors.danger} />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}
            </Animated.View>

            {/* Footer */}
            <View style={styles.footer}>
                <Text style={styles.footerText}>
                    By connecting, you agree to Deriv's terms of service
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.gameBg,
    },
    gradientBg: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.gameBg,
    },
    logoSection: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.gameSurface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: colors.primary + '40',
        marginBottom: spacing.lg,
    },
    appName: {
        ...typography.h1,
        color: '#FFF',
        fontSize: 28,
        marginBottom: spacing.xs,
    },
    tagline: {
        ...typography.body,
        color: colors.textMuted,
    },
    loginSection: {
        padding: spacing.xl,
        paddingBottom: 40,
    },
    sectionTitle: {
        ...typography.h3,
        color: colors.textMuted,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    loginButton: {
        borderRadius: radius.lg,
        marginBottom: spacing.md,
        overflow: 'hidden',
    },
    derivButton: {
        backgroundColor: colors.primary,
        borderWidth: 1,
        borderColor: colors.primaryDark,
    },
    demoButton: {
        backgroundColor: colors.gameSurface,
        borderWidth: 1,
        borderColor: colors.gameBorder,
    },
    buttonPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        gap: spacing.md,
    },
    buttonText: {
        flex: 1,
    },
    buttonTitle: {
        ...typography.h3,
        color: '#FFF',
        fontSize: 16,
    },
    buttonSubtitle: {
        ...typography.caption,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 2,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.lg,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: colors.gameBorder,
    },
    dividerText: {
        ...typography.caption,
        color: colors.textMuted,
        paddingHorizontal: spacing.md,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.danger + '15',
        padding: spacing.md,
        borderRadius: radius.md,
        marginTop: spacing.md,
    },
    errorText: {
        ...typography.body,
        color: colors.danger,
        flex: 1,
    },
    footer: {
        padding: spacing.lg,
        alignItems: 'center',
    },
    footerText: {
        ...typography.micro,
        color: colors.textMuted,
        textAlign: 'center',
    },
});
