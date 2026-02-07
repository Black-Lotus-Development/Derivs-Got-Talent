import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { fetchLeaderboard, isSupabaseConfigured } from '../api/supabase';
import { colors, spacing, radius, typography, shadows } from '../theme';

const RANK_COLORS = [colors.warning, '#A4B0BE', '#CD7F32'];

const RANK_ICONS = [
  'crown',
  'star-circle',
  'medal',
  'account-star',
  'account',
];

function LeaderboardEntry({ entry, index }) {
  const isTop3 = entry.rank <= 3;
  const rankColor = isTop3 ? RANK_COLORS[entry.rank - 1] : colors.textMuted;
  const icon = isTop3 ? RANK_ICONS[entry.rank - 1] : RANK_ICONS[3];
  const winRate = entry.winRate || entry.win_rate || 0;

  return (
    <Animated.View entering={FadeInDown.delay(index * 80).duration(400)}>
      <View style={[
        styles.entryCard,
        isTop3 && { backgroundColor: rankColor + '10', borderColor: rankColor + '30' },
        shadows.toy(isTop3 ? rankColor + '20' : colors.divider)
      ]}>
        {/* Rank Column */}
        <View style={styles.rankCol}>
          <View style={[styles.rankBadge, { backgroundColor: isTop3 ? rankColor : colors.bgSurface }]}>
            <Text style={[styles.rank, { color: isTop3 ? '#FFF' : colors.textSecondary }]}>{entry.rank}</Text>
          </View>
          <MaterialCommunityIcons name={icon} size={22} color={rankColor} />
        </View>

        {/* Info Column */}
        <View style={styles.infoCol}>
          <Text style={styles.entryName}>{entry.name}</Text>
          <View style={styles.entryMeta}>
            <View style={[styles.metaBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.metaItem, { color: colors.success }]}>{winRate}% Win Rate</Text>
            </View>
            <View style={[styles.metaBadge, { backgroundColor: colors.accent + '15' }]}>
              <Text style={[styles.metaItem, { color: colors.accent }]}>Score {entry.sharpe.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* P&L Badge */}
        <View style={[styles.pnlBadge, {
          backgroundColor: entry.pnl >= 0 ? colors.success : colors.danger,
        }]}>
          <Text style={styles.pnlText}>
            {entry.pnl >= 0 ? '+' : ''}${entry.pnl.toFixed(0)}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function LeaderboardScreen({ navigation }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('local');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchLeaderboard();
      setEntries(data);
      setSource(isSupabaseConfigured() ? 'cloud' : 'local');
    } catch (e) {
      console.warn('Leaderboard load error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Hall of Fame</Text>
            <Text style={styles.headerSub}>
              {source === 'cloud' ? 'Rising stars around the world' : 'Top local routines'}
            </Text>
          </View>
          <Pressable onPress={loadData} style={styles.refreshBtn}>
            <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Column labels */}
        <View style={styles.colLabels}>
          <Text style={[styles.colLabel, { width: 60 }]}>Stars</Text>
          <Text style={[styles.colLabel, { flex: 1 }]}>Routine Performance</Text>
          <Text style={styles.colLabel}>Score</Text>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Scouting for talent...</Text>
          </View>
        ) : (
          entries.map((entry, index) => (
            <LeaderboardEntry key={`${entry.name}-${entry.rank}`} entry={entry} index={index} />
          ))
        )}
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
    ...typography.h2,
    color: '#FFF',
  },
  headerSub: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 60,
  },
  colLabels: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  colLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  rankCol: {
    alignItems: 'center',
    width: 50,
    gap: spacing.xs,
  },
  rankBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  rank: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  infoCol: {
    flex: 1,
    marginLeft: spacing.md,
  },
  entryName: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 16,
  },
  entryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 6,
  },
  metaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  metaItem: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  pnlBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.xl,
    minWidth: 80,
    alignItems: 'center',
  },
  pnlText: {
    ...typography.bodyBold,
    color: '#FFF',
    fontSize: 14,
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.lg,
  },
  loadingText: {
    ...typography.bodyBold,
    color: colors.textMuted,
    fontSize: 16,
  },
});
