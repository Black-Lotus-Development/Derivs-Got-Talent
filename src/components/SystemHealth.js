import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ProgressBar, Text } from 'react-native-paper';
import Animated, { FadeIn } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';

const STATUS_CODES = [
  { min: 0, code: 'SYS-CLR', text: 'Operational' },
  { min: 5, code: 'WARN-01', text: 'Minor Volatility detected' },
  { min: 20, code: 'WARN-02', text: 'Structural degradation' },
  { min: 40, code: 'CRIT-01', text: 'Subsystem failure' },
  { min: 60, code: 'CRIT-02', text: 'Core integrity compromised' },
  { min: 80, code: 'FATAL-ERR', text: 'Imminent collapse' },
];

function StrategyCard({ strategy, damage }) {
  const health = Math.max(0, 100 - (damage || 0));
  const healthColor = health > 60 ? colors.success : health > 30 ? colors.warning : colors.danger;
  const healthColorDark = health > 60 ? colors.successDark : health > 30 ? colors.warningDark : colors.dangerDark;
  const activeStatus = STATUS_CODES.filter((t) => damage >= t.min).pop() || STATUS_CODES[0];

  return (
    <Animated.View entering={FadeIn.duration(500)}>
      <View style={[
        styles.card, 
        shadows.toy(colors.divider)
      ]}>
        <View style={styles.cardBody}>
          {/* Name row */}
          <View style={styles.nameRow}>
            <View style={styles.nameLeft}>
              <View style={[styles.iconBox, { backgroundColor: healthColor + '20' }]}>
                <MaterialCommunityIcons name="star-shooting" size={28} color={healthColor} />
              </View>
              <View>
                <Text style={styles.strategyName}>{strategy.name}</Text>
                <Text style={styles.strategyMeta}>{strategy.blocks?.length || 0} Talent Modules Active</Text>
              </View>
            </View>
            <View style={[styles.healthBadge, { backgroundColor: healthColor }]}>
              <Text style={styles.healthValue}>{Math.round(health)}%</Text>
            </View>
          </View>

          {/* Status Row */}
          <View style={styles.statusRow}>
            <View style={[styles.statusCodeBox, { backgroundColor: healthColor + '15' }]}>
              <Text style={[styles.statusCode, { color: healthColor }]}>{activeStatus.code}</Text>
            </View>
            <Text style={styles.statusText}>{activeStatus.text}</Text>
          </View>

          {/* Health bar */}
          <View style={styles.healthContainer}>
            <ProgressBar
              progress={health / 100}
              color={healthColor}
              style={styles.healthBar}
            />
          </View>

          {/* Stats grid */}
          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{strategy.tradeCount || 0}</Text>
              <Text style={styles.statLabel}>Acts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, {
                color: (strategy.pnl || 0) >= 0 ? colors.success : colors.danger
              }]}>
                {(strategy.pnl || 0) >= 0 ? '+' : ''}${(strategy.pnl || 0).toFixed(2)}
              </Text>
              <Text style={styles.statLabel}>Earnings</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${(strategy.balance || 10000).toFixed(0)}</Text>
              <Text style={styles.statLabel}>Budget</Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function SystemHealth({ strategies, damage }) {
  return (
    <View style={styles.container}>
      {strategies.map((strategy, index) => (
        <StrategyCard
          key={index}
          strategy={strategy}
          damage={damage[strategy.name] || 0}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
  },
  card: {
    marginBottom: spacing.md,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  cardBody: {
    padding: spacing.lg,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nameLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  strategyName: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 18,
  },
  strategyMeta: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  healthBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  healthValue: {
    ...typography.bodyBold,
    color: '#FFF',
    fontSize: 14,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  statusCodeBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusCode: {
    ...typography.bodyBold,
    fontSize: 12,
  },
  statusText: {
    ...typography.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  healthContainer: {
    marginTop: spacing.md,
  },
  healthBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.bg,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.divider,
  },
  statValue: {
    ...typography.h3,
    color: colors.textPrimary,
    fontSize: 18,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
});
