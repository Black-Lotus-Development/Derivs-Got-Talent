import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable, Modal, Dimensions } from 'react-native';
import { Text, Portal } from 'react-native-paper';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Ellipse, Path, Line } from 'react-native-svg';
import { colors, spacing, radius, typography, shadows } from '../theme';

// ─── Judge definitions ───────────────────────────────────────────────────────
const ANALYSTS = {
  rita: {
    name: 'Judge Rita',
    title: 'Style & Elegance',
    icon: 'star-shooting',
    color: colors.rita,
    seatX: 0.17,
  },
  yang: {
    name: 'Judge Yang',
    title: 'High Energy',
    icon: 'lightning-bolt',
    color: colors.yang,
    seatX: 0.5,
  },
  sharpe: {
    name: 'Judge Sharpe',
    title: 'Technical Merit',
    icon: 'certificate',
    color: colors.sharpe,
    seatX: 0.83,
  },
};

const ANALYST_IDS = ['rita', 'yang', 'sharpe'];

// ─── SVG Judge Character ─────────────────────────────────────────────────────
// ─── Human Judge Character ────────────────────────────────────────────────────
function HumanJudge({ id, x, y, color, speaking }) {
  // Common dimensions
  const scale = 1.0;

  // Character-specific features
  const getHair = () => {
    switch (id) {
      case 'rita': // Elegant Bun
        return (
          <Path
            d="M-14,-18 C-18,-18 -20,-14 -20,-8 L-20,0 C-20,8 -12,12 -8,12 L8,12 C12,12 20,8 20,0 L20,-8 C20,-14 18,-18 14,-18 M-8,-18 C-10,-24 -6,-28 0,-28 C6,-28 10,-24 8,-18"
            fill={color}
            transform={`translate(${x}, ${y}) scale(${scale})`}
          />
        );
      case 'yang': // Spiky / Energetic
        return (
          <Path
            d="M-15,-5 L-18,-15 L-10,-12 L-6,-22 L0,-14 L6,-22 L10,-12 L18,-15 L15,-5 Z"
            fill={color}
            transform={`translate(${x}, ${y}) scale(${scale})`}
          />
        );
      case 'sharpe': // Neat side part
        return (
          <Path
            d="M-15,0 C-15,-10 -10,-18 0,-18 C12,-18 16,-10 16,0 L16,4 L-15,4 Z"
            fill={color}
            transform={`translate(${x}, ${y}) scale(${scale})`}
          />
        );
      default: return null;
    }
  };

  return (
    <>
      {/* Body / Shoulders */}
      <Path
        d="M-18,22 C-18,12 -12,10 -8,8 L8,8 C12,10 18,12 18,22 L18,30 L-18,30 Z"
        fill={color}
        opacity={speaking ? 1 : 0.8}
        transform={`translate(${x}, ${y}) scale(${scale})`}
      />

      {/* Neck */}
      <Rect x={x - 4} y={y + 5} width={8} height={6} fill="#FCA5A5" />

      {/* Head Base (Skin) */}
      <Ellipse cx={x} cy={y - 2} rx={11} ry={13} fill="#FCA5A5" />

      {/* Hair */}
      {getHair()}

      {/* Eyes */}
      <Circle cx={x - 4} cy={y - 2} r={1.5} fill="#1E293B" />
      <Circle cx={x + 4} cy={y - 2} r={1.5} fill="#1E293B" />

      {/* Mouth */}
      {speaking ? (
        <Ellipse cx={x} cy={y + 5} rx={3} ry={2} fill="#1E293B" opacity={0.6} />
      ) : (
        <Path d={`M${x - 3},${y + 5} Q${x},${y + 7} ${x + 3},${y + 5}`} stroke="#1E293B" strokeWidth={1} fill="none" opacity={0.5} />
      )}

      {/* Speaking Glow */}
      {speaking && (
        <Circle cx={x} cy={y} r={28} fill={color} opacity={0.15} />
      )}
    </>
  );
}

// ─── Stage ───────────────────────────────────────────────────────────────────
function Stage({ latestByJudge, stageWidth }) {
  const H = 130;
  const tableY = H * 0.55;
  const charY = tableY - 15; // Adjusted up for new bodies

  return (
    <View style={styles.stageWrap}>
      <Svg width={stageWidth} height={H} viewBox={`0 0 ${stageWidth} ${H}`}>
        {/* Stage floor */}
        <Rect x={0} y={tableY + 18} width={stageWidth} height={H - tableY - 18} rx={0} fill="#1E1E1E" />
        {/* Table */}
        <Rect
          x={stageWidth * 0.08}
          y={tableY}
          width={stageWidth * 0.84}
          height={20}
          rx={10}
          fill="#6C5CE7"
          opacity={0.2}
        />
        <Rect
          x={stageWidth * 0.08}
          y={tableY}
          width={stageWidth * 0.84}
          height={4}
          rx={2}
          fill="#6C5CE7"
          opacity={0.35}
        />
        {/* Judges */}
        {ANALYST_IDS.map((id) => {
          const a = ANALYSTS[id];
          const cx = stageWidth * a.seatX;
          const isSpeaking = !!latestByJudge[id];
          return (
            <HumanJudge
              key={id}
              id={id}
              x={cx}
              y={charY}
              color={a.color}
              speaking={isSpeaking}
            />
          );
        })}
        {/* Spotlights */}
        {ANALYST_IDS.map((id) => {
          const a = ANALYSTS[id];
          const cx = stageWidth * a.seatX;
          return (
            <Ellipse
              key={`spot-${id}`}
              cx={cx}
              cy={tableY + 28}
              rx={22}
              ry={6}
              fill={a.color}
              opacity={0.12}
            />
          );
        })}
      </Svg>

      {/* Chat bubbles over characters — each in its own column third */}
      {ANALYST_IDS.map((id, idx) => {
        const a = ANALYSTS[id];
        const comment = latestByJudge[id];
        if (!comment) return null;
        const colW = stageWidth / 3;
        const bubbleW = Math.min(colW - 8, 140);
        const leftPos = idx * colW + (colW - bubbleW) / 2;
        return (
          <Animated.View
            key={`bubble-${id}-${comment.timestamp}`}
            entering={FadeInUp.duration(300)}
            style={[
              styles.chatBubble,
              {
                left: leftPos,
                width: bubbleW,
                bottom: H - (charY - 28),
                borderColor: a.color + '50',
              },
            ]}
          >
            <Text style={styles.bubbleName}>{a.name.split(' ')[1]}</Text>
            <Text style={styles.bubbleText} numberOfLines={2}>{comment.text}</Text>
          </Animated.View>
        );
      })}
    </View>
  );
}

// ─── Chat Log Modal ──────────────────────────────────────────────────────────
function ChatLogModal({ visible, onClose, comments }) {
  const scrollRef = useRef();

  useEffect(() => {
    if (visible && comments.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [visible, comments.length]);

  return (
    <Portal>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.modalOverlay} onPress={onClose}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color={colors.accent} />
              <Text style={styles.modalTitle}>Chat Log</Text>
              <Pressable onPress={onClose} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={22} color={colors.textSecondary} />
              </Pressable>
            </View>
            <ScrollView
              ref={scrollRef}
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {comments.length === 0 ? (
                <Text style={styles.modalEmpty}>No comments yet.</Text>
              ) : (
                comments.map((comment, i) => {
                  const a = ANALYSTS[comment.analyst] || ANALYSTS.sharpe;
                  return (
                    <View key={`log-${i}`} style={[styles.logItem, { borderLeftColor: a.color }]}>
                      <View style={styles.logHeader}>
                        <View style={[styles.logDot, { backgroundColor: a.color }]} />
                        <Text style={[styles.logName, { color: a.color }]}>{a.name}</Text>
                        <Text style={styles.logTime}>
                          {new Date(comment.timestamp || Date.now()).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </Text>
                      </View>
                      <Text style={styles.logText}>{comment.text}</Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </Portal>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function AnalystPanel({ comments }) {
  const [showLog, setShowLog] = useState(false);
  const [stageWidth, setStageWidth] = useState(300);

  // Latest comment per judge
  const latestByJudge = useMemo(() => {
    const map = {};
    comments.forEach((c) => { map[c.analyst] = c; });
    return map;
  }, [comments]);

  const panel = (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="microphone-variant" size={18} color={colors.accent} />
          <Text style={styles.headerTitle}>The Judges' Table</Text>
        </View>
        <Pressable
          onPress={() => setShowLog(true)}
          style={styles.logBtn}
        >
          <MaterialCommunityIcons name="message-text-clock-outline" size={16} color={colors.accent} />
          <Text style={styles.logBtnText}>Log ({comments.length})</Text>
        </Pressable>
      </View>

      {/* Stage with SVG judges */}
      <View
        style={styles.stageContainer}
        onLayout={(e) => setStageWidth(e.nativeEvent.layout.width)}
      >
        {comments.length === 0 ? (
          <View style={styles.emptyState}>
            <Stage latestByJudge={{}} stageWidth={stageWidth} />
            <Text style={styles.emptyText}>The judges are watching...</Text>
            <Text style={styles.emptyHint}>Start your performance to hear their thoughts!</Text>
          </View>
        ) : (
          <Stage latestByJudge={latestByJudge} stageWidth={stageWidth} />
        )}
      </View>
    </View>
  );

  return (
    <>
      {panel}
      <ChatLogModal
        visible={showLog}
        onClose={() => setShowLog(false)}
        comments={comments}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    margin: spacing.md,
    ...shadows.card,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  logBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
  },
  logBtnText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '700',
  },
  stageContainer: {
    paddingBottom: spacing.sm,
  },
  stageWrap: {
    position: 'relative',
  },
  chatBubble: {
    position: 'absolute',
    width: 140,
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1.5,
    ...shadows.card,
  },
  bubbleName: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  bubbleText: {
    ...typography.body,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textPrimary,
  },
  emptyState: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  emptyText: {
    ...typography.h3,
    color: colors.textSecondary,
  },
  emptyHint: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
  // ─── Chat Log Modal ──────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.bgCard,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: Dimensions.get('window').height * 0.75,
    minHeight: 300,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalScrollContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  modalEmpty: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xxl,
  },
  logItem: {
    backgroundColor: colors.bg,
    borderLeftWidth: 3,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: spacing.xs,
  },
  logDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logName: {
    ...typography.bodyBold,
    fontSize: 13,
    flex: 1,
  },
  logTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
  },
  logText: {
    ...typography.body,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});
