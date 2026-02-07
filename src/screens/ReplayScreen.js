import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { submitScore } from '../api/supabase';
import { colors, spacing, radius, typography, shadows } from '../theme';

const victoryAnim = require('../../assets/animations/victory.json');
const defeatAnim = require('../../assets/animations/defeat.json');

export default function ReplayScreen({ route, navigation }) {
  const result = route?.params?.result || {
    strategyName: 'OPERATIONAL BLUEPRINT',
    pnl: 0,
    tradeCount: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpe: 0,
    trades: [],
  };

  const isWin = result.pnl > 0;
  const accentColor = isWin ? colors.success : colors.danger;
  const viewShotRef = useRef();

  useEffect(() => {
    submitScore({
      name: result.strategyName,
      pnl: result.pnl,
      win_rate: result.winRate,
      trades: result.tradeCount,
      sharpe: result.sharpe,
    }).catch(() => { });
  }, []);

  const handleShare = async () => {
    try {
      if (Platform.OS === 'web') return;
      const uri = await viewShotRef.current.capture();
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: `Deriv's Got Talent — ${result.strategyName}`,
        });
      }
    } catch (e) {
      console.warn('Share failed:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Judges' Final Scores</Text>
            <Text style={styles.strategyLabel}>{result.strategyName}</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Result Banner */}
        <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 0.9 }}>
          <Animated.View entering={FadeInDown.duration(600)}>
            <View style={[styles.resultCard, { borderColor: accentColor + '30' }]}>
              <View style={styles.resultBody}>
                <View style={styles.lottieWrap}>
                  <LottieView
                    source={isWin ? victoryAnim : defeatAnim}
                    autoPlay
                    loop={false}
                    style={styles.lottie}
                  />
                </View>
                <View style={[styles.resultIconBox, { backgroundColor: accentColor + '10' }]}>
                  <MaterialCommunityIcons
                    name={isWin ? "trending-up" : "trending-down"}
                    size={48}
                    color={accentColor}
                  />
                </View>
                <Text style={[styles.resultTitle, { color: accentColor }]}>
                  {isWin ? 'A Standing Ovation!' : 'A Tough Crowd!'}
                </Text>
                <View style={[styles.pnlBadge, { backgroundColor: accentColor }]}>
                  <Text style={styles.pnlText}>
                    {isWin ? '+' : ''}${result.pnl.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.resultStatus}>
                  {isWin ? 'You absolutely nailed that performance!' : 'Keep practicing, you will get there!'}
                </Text>
              </View>
            </View>
          </Animated.View>
        </ViewShot>

        {/* Stats Grid */}
        <Animated.View entering={FadeIn.delay(200)}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="chart-box-outline" size={20} color={colors.warning} />
            <Text style={styles.sectionTitle}>The Score Card</Text>
          </View>
          <View style={styles.statsGrid}>
            {[
              { value: result.tradeCount, label: 'ACTS', icon: 'play-box-multiple-outline' },
              { value: `${result.winRate}%`, label: 'HIT RATE', icon: 'target' },
              { value: `${result.maxDrawdown}%`, label: 'ENERGY LOSS', icon: 'battery-alert-variant-outline' },
              { value: result.sharpe.toFixed(2), label: 'TALENT SCORE', icon: 'medal-outline' },
            ].map((stat, i) => (
              <View key={i} style={[styles.statCard, shadows.toy(colors.divider)]}>
                <View style={styles.statHeader}>
                  <MaterialCommunityIcons name={stat.icon} size={20} color={colors.primary} />
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Trade Log */}
        <Animated.View entering={FadeIn.delay(400)}>
          <View style={styles.tradeLogHeader}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="history" size={20} color={colors.accent} />
              <Text style={styles.sectionTitle}>Performance History</Text>
            </View>
            <Text style={styles.tradeCount}>{result.trades.length} Moments</Text>
          </View>

          {result.trades.length === 0 ? (
            <View style={[styles.emptyCard, shadows.toy(colors.divider)]}>
              <Text style={styles.emptyText}>No moments captured yet! Take the stage to see your history here.</Text>
            </View>
          ) : (
            <View style={[styles.tradeList, shadows.toy(colors.divider)]}>
              {result.trades.map((trade, index) => (
                <View key={index} style={styles.tradeRow}>
                  <View style={[styles.tradeDot, {
                    backgroundColor: trade.action === 'ENTER' ? colors.success : colors.danger
                  }]} />
                  <Text style={styles.tradeAction}>{trade.action === 'ENTER' ? 'Entry' : 'Exit'}</Text>
                  <Text style={styles.tradePrice}>${trade.price?.toLocaleString()}</Text>
                  {trade.pnl !== undefined && (
                    <Text style={[styles.tradePnl, { color: trade.pnl >= 0 ? colors.success : colors.danger }]}>
                      {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable
            onPress={() => navigation.navigate('Builder')}
            style={({ pressed }) => [
              styles.primaryBtn,
              shadows.toy(colors.warningDark),
              pressed && styles.btnPressed
            ]}
          >
            <View style={[styles.primaryBtnInner, { backgroundColor: colors.warning }]}>
              <MaterialCommunityIcons name="auto-fix" size={24} color="#FFF" />
              <Text style={styles.primaryBtnText}>Polish Your Routine</Text>
            </View>
          </Pressable>

          {Platform.OS !== 'web' && (
            <Pressable
              onPress={handleShare}
              style={({ pressed }) => [
                styles.shareBtn,
                shadows.toy(colors.accentDark),
                pressed && styles.btnPressed
              ]}
            >
              <View style={[styles.shareBtnInner, { backgroundColor: colors.accent }]}>
                <MaterialCommunityIcons name="share-variant" size={22} color="#FFF" />
                <Text style={styles.shareBtnText}>Share the Talent</Text>
              </View>
            </Pressable>
          )}

          <Pressable
            onPress={() => navigation.navigate('Home')}
            style={({ pressed }) => [
              styles.secondaryBtn,
              pressed && styles.btnPressed
            ]}
          >
            <Text style={styles.secondaryBtnText}>Back to the Stage Door</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gameBg,
  },
  header: {
    backgroundColor: colors.gameSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
    paddingTop: 60,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: spacing.md,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textMuted,
  },
  strategyLabel: {
    ...typography.h2,
    color: '#FFF',
    fontSize: 18,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  resultCard: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    marginBottom: spacing.xl,
    padding: spacing.xl,
    borderWidth: 1,
    ...shadows.card,
  },
  resultBody: {
    alignItems: 'center',
  },
  resultIconBox: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    zIndex: 1,
  },
  resultTitle: {
    ...typography.h1,
    fontSize: 24,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pnlBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.xl,
    marginBottom: spacing.lg,
  },
  pnlText: {
    ...typography.stat,
    fontSize: 32,
    color: '#FFF',
  },
  resultStatus: {
    ...typography.bodyBold,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: '#FFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    ...typography.stat,
    fontSize: 22,
    color: '#FFF',
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  tradeLogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  tradeCount: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emptyText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tradeList: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
    gap: spacing.md,
  },
  tradeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tradeAction: {
    ...typography.bodyBold,
    color: '#FFF',
    width: 60,
  },
  tradePrice: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
  },
  tradePnl: {
    ...typography.bodyBold,
    fontSize: 14,
    textAlign: 'right',
  },
  actions: {
    gap: spacing.lg,
  },
  primaryBtn: {
    borderRadius: radius.xl,
  },
  primaryBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  primaryBtnText: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 18,
  },
  shareBtn: {
    borderRadius: radius.xl,
  },
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: 16,
    borderRadius: radius.xl,
  },
  shareBtnText: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 18,
  },
  secondaryBtn: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    ...typography.bodyBold,
    color: colors.textMuted,
    fontSize: 14,
  },
  btnPressed: {
    transform: [{ scale: 0.96 }],
  },
  lottieWrap: {
    position: 'absolute',
    top: -40,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  lottie: {
    width: 240,
    height: 240,
  },
});
