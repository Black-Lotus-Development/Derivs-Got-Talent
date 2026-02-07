import React, { useMemo, useCallback } from 'react';
import { View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';
import { saveStrategy } from '../api/storage';

function ValidationRow({ label, ok, detail, tone = 'neutral' }) {
  const icon = ok ? 'check-circle' : 'alert-circle';
  const iconColor = ok ? colors.success : (tone === 'warn' ? colors.warning : colors.danger);
  return (
    <View style={styles.validationRow}>
      <MaterialCommunityIcons name={icon} size={18} color={iconColor} />
      <View style={styles.validationTextWrap}>
        <Text style={styles.validationLabel}>{label}</Text>
        {!!detail && <Text style={styles.validationDetail}>{detail}</Text>}
      </View>
    </View>
  );
}

export default function StrategyValidationScreen({ route, navigation }) {
  const strategyName = route?.params?.strategyName || 'ALPHA-OMEGA';
  const blocks = route?.params?.blocks || [];

  const counts = useMemo(() => {
    const byCategory = {
      entry: 0,
      defense: 0,
      sizing: 0,
      exit: 0,
    };
    blocks.forEach((b) => {
      if (byCategory[b.category] === undefined) byCategory[b.category] = 0;
      byCategory[b.category] += 1;
    });
    return byCategory;
  }, [blocks]);

  const hasAny = blocks.length > 0;
  const hasEntry = (counts.entry || 0) > 0;
  const hasDefense = (counts.defense || 0) > 0;

  const canGoLive = hasAny && hasEntry;

  const handleGoLive = useCallback(async () => {
    const strategy = { name: strategyName, blocks, timestamp: Date.now() };
    await saveStrategy(strategy);
    navigation.navigate('Deployment', { strategy });
  }, [strategyName, blocks, navigation]);

  const handleBackToWorkshop = useCallback(() => {
    navigation.navigate('Builder', { updatedBlocks: blocks, strategyName });
  }, [navigation, blocks, strategyName]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={handleBackToWorkshop} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Final Check</Text>
          <Text style={styles.headerSub}>{strategyName}</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.accent} />
            <Text style={styles.cardTitle}>Validation</Text>
          </View>

          <ValidationRow
            label="You have at least 1 piece"
            ok={hasAny}
            detail={hasAny ? `${blocks.length} pieces in your routine` : 'Add at least one piece to continue'}
          />
          <ValidationRow
            label="You have an entry signal"
            ok={hasEntry}
            detail={hasEntry ? `${counts.entry} entry piece${counts.entry === 1 ? '' : 's'}` : 'Add an entry piece so the routine can start'}
          />
          <ValidationRow
            label="You have a defense / risk check"
            ok={hasDefense}
            tone="warn"
            detail={hasDefense ? `${counts.defense} defense piece${counts.defense === 1 ? '' : 's'}` : 'Recommended: add at least 1 defense piece'}
          />
        </View>

        <View style={[styles.card, shadows.card]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="puzzle-outline" size={20} color={colors.primary} />
            <Text style={styles.cardTitle}>Routine Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            {Object.entries(counts).map(([cat, count]) => {
              if (!count) return null;
              const meta = blockCategoryMeta[cat] || blockCategoryMeta.entry;
              return (
                <View key={cat} style={[styles.pill, { backgroundColor: meta.color + '20', borderColor: meta.color + '40' }]}>
                  <View style={[styles.pillDot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.pillText, { color: meta.color }]}>{cat} × {count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <Pressable
          onPress={handleGoLive}
          disabled={!canGoLive}
          style={({ pressed }) => [
            styles.goLiveBtn,
            !canGoLive && styles.goLiveBtnDisabled,
            pressed && canGoLive && styles.goLiveBtnPressed,
            canGoLive && shadows.toy(colors.primaryDark),
          ]}
        >
          <MaterialCommunityIcons name="rocket-launch" size={22} color={canGoLive ? '#FFF' : colors.textMuted} />
          <Text style={[styles.goLiveText, { color: canGoLive ? '#FFF' : colors.textMuted }]}>Ready to Go Live</Text>
        </Pressable>

        {!canGoLive && (
          <Text style={styles.blockedHint}>
            Add an entry piece before you can go live.
          </Text>
        )}

        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    gap: spacing.sm,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  headerSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, gap: spacing.md },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cardTitle: { ...typography.h3, color: colors.textPrimary },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  validationTextWrap: { flex: 1 },
  validationLabel: { ...typography.bodyBold, color: colors.textPrimary },
  validationDetail: { ...typography.caption, color: colors.textMuted, marginTop: 2 },
  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    ...typography.caption,
    fontWeight: '800',
  },
  goLiveBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  goLiveBtnPressed: {
    transform: [{ scale: 0.98 }],
  },
  goLiveBtnDisabled: {
    backgroundColor: colors.bgSurface,
  },
  goLiveText: { ...typography.bodyBold },
  blockedHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});
