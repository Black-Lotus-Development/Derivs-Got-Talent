import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Rect, Line, Circle, G, Defs, LinearGradient, Stop, Path } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

function SystemNode({ x, y, label, color, icon }) {
  return (
    <G>
      {/* Node Body with Toy Shadow */}
      <Rect x={x - 20} y={y - 20} width={40} height={40} rx={10} fill={color} />
      <Rect x={x - 20} y={y - 16} width={40} height={4} rx={2} fill="rgba(0,0,0,0.1)" />
      
      <MaterialCommunityIcons name={icon} size={20} color="#FFF" style={{ position: 'absolute', left: x - 10, top: y - 10 }} />
      <Text style={[styles.nodeLabel, { position: 'absolute', left: x - 40, top: y + 24, width: 80, textAlign: 'center', color: colors.textPrimary }]}>
        {label}
      </Text>
    </G>
  );
}

export default function SystemArchitecture({ blocks }) {
  const systems = useMemo(() => {
    if (!blocks || blocks.length === 0) return null;
    
    return {
      entry: blocks.filter(b => b.category === 'entry'),
      defense: blocks.filter(b => b.category === 'defense'),
      sizing: blocks.filter(b => b.category === 'sizing'),
    };
  }, [blocks]);

  if (!blocks || blocks.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="molecule" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>PIPELINE_OFFLINE</Text>
        <Text style={styles.emptySub}>Awaiting module initialization...</Text>
      </View>
    );
  }

  const CX = 160;
  const CY = 130;
  const CORE_R = 35;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Routine Schematic</Text>
          <Text style={styles.subtitle}>How your talent flows</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Live</Text>
        </View>
      </View>
      
      <View style={styles.svgWrapper}>
        <Svg width="100%" height={280} viewBox="0 0 320 280">
          {/* Central Core */}
          <G>
            <Circle cx={CX} cy={CY} r={CORE_R} fill={colors.primary} />
            <Circle cx={CX} cy={CY} r={CORE_R - 5} fill="rgba(255,255,255,0.2)" />
            <MaterialCommunityIcons name="star-face" size={32} color="#FFF" style={{ position: 'absolute', left: CX - 16, top: CY - 16 }} />
          </G>

          {/* Connections with rounded paths */}
          {systems.entry.map((_, i) => {
            const angle = 180 + (i * 35) - ((systems.entry.length - 1) * 17.5);
            const rad = angle * (Math.PI / 180);
            const x = CX + Math.cos(rad) * 90;
            const y = CY + Math.sin(rad) * 90;
            return (
              <G key={`path-entry-${i}`}>
                <Path d={`M ${x} ${y} Q ${CX - 50} ${y} ${CX - CORE_R} ${CY}`} fill="none" stroke={colors.success} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              </G>
            );
          })}

          {/* Core to Defense */}
          {systems.defense.map((_, i) => {
            const angle = 0 + (i * 35) - ((systems.defense.length - 1) * 17.5);
            const rad = angle * (Math.PI / 180);
            const x = CX + Math.cos(rad) * 90;
            const y = CY + Math.sin(rad) * 90;
            return (
              <G key={`path-def-${i}`}>
                <Path d={`M ${CX + CORE_R} ${CY} Q ${CX + 50} ${y} ${x} ${y}`} fill="none" stroke={colors.danger} strokeWidth="3" strokeLinecap="round" opacity="0.3" />
              </G>
            );
          })}

          {/* Nodes */}
          {systems.entry.map((block, i) => {
            const angle = 180 + (i * 35) - ((systems.entry.length - 1) * 17.5);
            const rad = angle * (Math.PI / 180);
            const x = CX + Math.cos(rad) * 90;
            const y = CY + Math.sin(rad) * 90;
            return <SystemNode key={`node-e-${i}`} x={x} y={y} label={block.name.split(' ')[0]} color={colors.success} icon={block.icon} />;
          })}

          {systems.defense.map((block, i) => {
            const angle = 0 + (i * 35) - ((systems.defense.length - 1) * 17.5);
            const rad = angle * (Math.PI / 180);
            const x = CX + Math.cos(rad) * 90;
            const y = CY + Math.sin(rad) * 90;
            return <SystemNode key={`node-d-${i}`} x={x} y={y} label={block.name.split(' ')[0]} color={colors.danger} icon={block.icon} />;
          })}

          {systems.sizing.map((block, i) => {
            const y = CY - 100 - (i * 30);
            return <SystemNode key={`node-s-${i}`} x={CX} y={y} label="Sizing" color={colors.warning} icon={block.icon} />;
          })}
        </Svg>
      </View>

      {/* Analytics Footer */}
      <View style={styles.footer}>
        <View style={styles.footerMetric}>
          <Text style={styles.metricLabel}>Total Steps</Text>
          <Text style={styles.metricValue}>{blocks.length}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerMetric}>
          <Text style={styles.metricLabel}>Vibe Check</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>Perfect</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.bgCard,
  },
  headerLeft: {
    gap: 2,
  },
  title: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.caption,
    color: colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.success + '10',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.success,
  },
  statusText: {
    ...typography.bodyBold,
    color: colors.success,
    fontSize: 10,
  },
  svgWrapper: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  nodeLabel: {
    ...typography.caption,
    fontSize: 10,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.bgCard,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricLabel: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
  },
  metricValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
  footerDivider: {
    width: 1,
    height: 20,
    backgroundColor: colors.divider,
  },
  empty: {
    height: 240,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyText: {
    ...typography.label,
    color: colors.textSecondary,
    fontSize: 14,
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.mono,
    color: colors.textMuted,
    fontSize: 9,
  },
});
