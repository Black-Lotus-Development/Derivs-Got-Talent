import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Svg, { Polyline, Rect, Line as SvgLine, Defs, LinearGradient as SvgGradient, Stop, Polygon, Text as SvgText } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows } from '../theme';

const CHART_HEIGHT = 220;
const CHART_PADDING = { top: 16, bottom: 24, left: 48, right: 12 };

function SVGChart({ data, isPositive }) {
  const closes = data.map(d => d.close);
  const min = Math.min(...closes);
  const max = Math.max(...closes);
  const range = max - min || 1;
  const svgW = 320;
  const svgH = CHART_HEIGHT;
  const plotW = svgW - CHART_PADDING.left - CHART_PADDING.right;
  const plotH = svgH - CHART_PADDING.top - CHART_PADDING.bottom;

  const divisor = closes.length > 1 ? closes.length - 1 : 1;
  const points = closes.map((v, i) => {
    const x = CHART_PADDING.left + (i / divisor) * plotW;
    const y = CHART_PADDING.top + (1 - (v - min) / range) * plotH;
    return `${x},${y}`;
  });

  const lineColor = isPositive ? colors.success : colors.danger;
  const fillColor = isPositive ? colors.success : colors.danger;

  const areaPoints = [
    `${CHART_PADDING.left},${CHART_PADDING.top + plotH}`,
    ...points,
    `${CHART_PADDING.left + plotW},${CHART_PADDING.top + plotH}`,
  ].join(' ');

  const yTicks = 4;
  const yLabels = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = min + (range * i) / yTicks;
    return { val, y: CHART_PADDING.top + (1 - i / yTicks) * plotH };
  });

  return (
    <Svg width="100%" height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
      <Defs>
        <SvgGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={fillColor} stopOpacity="0.15" />
          <Stop offset="100%" stopColor={fillColor} stopOpacity="0.01" />
        </SvgGradient>
      </Defs>

      {yLabels.map((tick, i) => (
        <React.Fragment key={i}>
          <SvgLine x1={CHART_PADDING.left} y1={tick.y} x2={svgW - CHART_PADDING.right} y2={tick.y} stroke={colors.border} strokeWidth="0.5" strokeDasharray="4 3" />
          <SvgText x={4} y={tick.y + 3} fontSize={8} fontFamily="monospace" fill={colors.textMuted}>
            {tick.val >= 1000 ? `$${(tick.val / 1000).toFixed(1)}K` : `$${tick.val.toFixed(0)}`}
          </SvgText>
        </React.Fragment>
      ))}

      <Polygon points={areaPoints} fill="url(#areaFill)" />
      <Polyline points={points.join(' ')} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />

      {closes.length > 0 && (() => {
        const lastX = CHART_PADDING.left + ((closes.length - 1) / divisor) * plotW;
        const lastY = CHART_PADDING.top + (1 - (closes[closes.length - 1] - min) / range) * plotH;
        return (
          <>
            <Rect x={lastX - 3} y={lastY - 3} width={6} height={6} rx={1} fill={lineColor} />
          </>
        );
      })()}
    </Svg>
  );
}

export default function LiveChart({ data }) {
  const latestPrice = data && data.length > 0 ? data[data.length - 1].close : null;
  const prevPrice = data && data.length > 1 ? data[data.length - 2].close : latestPrice;
  const priceChange = latestPrice && prevPrice ? latestPrice - prevPrice : 0;
  const priceChangePct = prevPrice ? ((priceChange / prevPrice) * 100).toFixed(2) : '0.00';
  const isPositive = priceChange >= 0;

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.pair}>Waiting for the music...</Text>
        </View>
        <View style={styles.emptyChart}>
          <MaterialCommunityIcons name="music-note-plus" size={40} color={colors.textMuted} />
          <Text style={styles.emptyText}>Ready to start the show?</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with price info */}
      <View style={styles.header}>
        <View>
          <Text style={styles.pair}>Today's Performance</Text>
          <View style={styles.priceRow}>
            {latestPrice && (
              <Text style={styles.price}>${latestPrice.toLocaleString()}</Text>
            )}
            <View style={[styles.changeBadge, { backgroundColor: isPositive ? colors.success + '20' : colors.danger + '20' }]}>
              <MaterialCommunityIcons name={isPositive ? "trending-up" : "trending-down"} size={14} color={isPositive ? colors.success : colors.danger} />
              <Text style={[styles.changeText, { color: isPositive ? colors.success : colors.danger }]}>
                {isPositive ? '+' : ''}{priceChangePct}%
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.timeframeBox}>
            <Text style={styles.timeframe}>Live Beat</Text>
          </View>
          <Text style={styles.candleCount}>{data.length} Moments</Text>
        </View>
      </View>

      {/* SVG Chart — works on all platforms without Skia */}
      <View style={styles.chartWrap}>
        <SVGChart data={data} isPositive={isPositive} />
      </View>

      {/* Price range bar */}
      <View style={styles.rangeBar}>
        <View style={styles.rangeInfo}>
          <Text style={styles.rangeLabel}>Low Point</Text>
          <Text style={styles.rangeValue}>${Math.min(...data.map(d => d.low)).toLocaleString()}</Text>
        </View>
        <View style={styles.rangeLine}>
          <View style={[styles.rangeProgress, {
            backgroundColor: colors.divider,
            width: '100%',
            position: 'absolute',
          }]} />
          <View style={[styles.rangeProgress, {
            backgroundColor: isPositive ? colors.success : colors.danger,
            width: '60%',
            marginLeft: '20%',
          }]} />
        </View>
        <View style={styles.rangeInfo}>
          <Text style={styles.rangeLabel}>High Point</Text>
          <Text style={styles.rangeValue}>${Math.max(...data.map(d => d.high)).toLocaleString()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    margin: spacing.md,
    borderRadius: radius.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    backgroundColor: colors.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  pair: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: 4,
  },
  price: {
    ...typography.stat,
    fontSize: 24,
    color: colors.textPrimary,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.round,
    gap: 4,
  },
  changeText: {
    ...typography.bodyBold,
    fontSize: 12,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  candleCount: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
  },
  timeframeBox: {
    backgroundColor: colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.divider,
  },
  timeframe: {
    ...typography.caption,
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  chartWrap: {
    height: CHART_HEIGHT,
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
  },
  emptyChart: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  rangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.bg + '50',
  },
  rangeInfo: {
    alignItems: 'center',
  },
  rangeLabel: {
    ...typography.caption,
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
  },
  rangeValue: {
    ...typography.bodyBold,
    fontSize: 12,
    color: colors.textSecondary,
  },
  rangeLine: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  rangeProgress: {
    height: 6,
    borderRadius: 4,
  },
});
