import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

function PlacedBlock({ block, index, totalBlocks, onRemove, onEdit, drag, isActive }) {
  const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;

  return (
    <ScaleDecorator>
      <View style={[styles.placedBlock, isActive && styles.placedBlockActive]}>
        {/* Connector Line (Inbound) */}
        {index > 0 && (
          <View style={styles.inboundConnector}>
            <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
          </View>
        )}

        <View style={[
          styles.blockCard, 
          { backgroundColor: meta.color },
          shadows.toy(meta.dark)
        ]}>
          {/* Drag handle */}
          <Pressable onLongPress={drag} style={styles.dragHandle}>
            <MaterialCommunityIcons name="drag-vertical" size={24} color="rgba(255, 255, 255, 0.6)" />
          </Pressable>

          <View style={styles.blockBody}>
            <View style={styles.blockHeader}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name={block.icon} size={22} color="#FFF" />
              </View>
              <View style={styles.blockInfo}>
                <Text style={styles.blockLabel}>{meta.label}</Text>
                <Text style={styles.blockName}>{block.name}</Text>
              </View>
              <Pressable
                onPress={() => onRemove(index)}
                style={styles.removeBtn}
                hitSlop={8}
              >
                <MaterialCommunityIcons name="close-circle" size={22} color="rgba(255, 255, 255, 0.7)" />
              </Pressable>
            </View>

            <View style={styles.paramsContainer}>
              {Object.entries(block.params).map(([key, value]) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.paramEntry, pressed && styles.paramEntryPressed]}
                  onPress={() => onEdit(index, key)}
                >
                  <View style={styles.paramTextContainer}>
                    <Text style={styles.paramKey}>{key}</Text>
                    <Text style={styles.paramValue}>{value}</Text>
                  </View>
                  <MaterialCommunityIcons name="pencil" size={12} color="#FFF" />
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Connector Line (Outbound) */}
        {index < totalBlocks - 1 && (
          <View style={styles.outboundConnector}>
            <View style={[styles.connectorLine, { backgroundColor: colors.border }]} />
            <View style={[styles.connectorDot, { backgroundColor: colors.border }]} />
          </View>
        )}
      </View>
    </ScaleDecorator>
  );
}

export default function StrategyCanvas({ blocks, onRemoveBlock, onEditBlock, onReorderBlocks }) {
  const renderItem = useCallback(({ item, getIndex, drag, isActive }) => {
    const index = getIndex();
    return (
      <PlacedBlock
        block={item}
        index={index}
        totalBlocks={blocks.length}
        onRemove={onRemoveBlock}
        onEdit={onEditBlock}
        drag={drag}
        isActive={isActive}
      />
    );
  }, [blocks.length, onRemoveBlock, onEditBlock]);

  const keyExtractor = useCallback((item) => item.instanceId, []);

  if (blocks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrap}>
          <MaterialCommunityIcons name="puzzle-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.emptyTitle}>Your stage is empty!</Text>
        <Text style={styles.emptyText}>
          Add some tools from the toolkit above to start building your winning routine.
        </Text>
        <View style={styles.emptyHints}>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: colors.success }]} />
            <Text style={styles.hintText}>Green blocks start the show</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: colors.danger }]} />
            <Text style={styles.hintText}>Red blocks keep you safe</Text>
          </View>
          <View style={styles.hintRow}>
            <View style={[styles.hintDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.hintText}>Gold blocks manage your space</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.canvas}>
      <View style={styles.canvasHeader}>
        <View style={styles.canvasHeaderLeft}>
          <MaterialCommunityIcons name="playlist-star" size={20} color={colors.primary} />
          <Text style={styles.canvasLabel}>Your Routine</Text>
        </View>
        <Text style={styles.canvasHint}>Hold & drag to reorder</Text>
      </View>
      <DraggableFlatList
        data={blocks}
        onDragEnd={({ data }) => onReorderBlocks(data)}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.canvasContent}
        containerStyle={styles.canvasList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  canvasHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    backgroundColor: colors.bgCard,
  },
  canvasHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  canvasLabel: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  canvasHint: {
    ...typography.caption,
    color: colors.textMuted,
  },
  canvasList: {
    flex: 1,
  },
  canvasContent: {
    padding: spacing.lg,
    paddingBottom: 140,
  },
  placedBlock: {
    alignItems: 'center',
  },
  placedBlockActive: {
    transform: [{ scale: 1.04 }],
  },
  blockCard: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  dragHandle: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  blockBody: {
    flex: 1,
    padding: spacing.lg,
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  blockInfo: {
    flex: 1,
  },
  blockLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '700',
  },
  blockName: {
    ...typography.h2,
    color: '#FFF',
    fontSize: 18,
  },
  removeBtn: {
    padding: 4,
  },
  paramsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.lg,
    paddingLeft: 0,
  },
  paramEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 10,
  },
  paramEntryPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  paramTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paramKey: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '700',
  },
  paramValue: {
    ...typography.bodyBold,
    color: '#FFF',
    fontSize: 14,
  },
  inboundConnector: {
    height: 16,
    alignItems: 'center',
  },
  outboundConnector: {
    height: 16,
    alignItems: 'center',
  },
  connectorLine: {
    width: 3,
    height: '100%',
    borderRadius: 1.5,
  },
  connectorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: -4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxxl,
    backgroundColor: colors.bg,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: '#FFF',
    ...shadows.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  emptyTitle: {
    ...typography.h1,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxl,
    maxWidth: 260,
  },
  emptyHints: {
    gap: spacing.md,
    width: '100%',
    maxWidth: 300,
    padding: spacing.xl,
    borderRadius: radius.lg,
    backgroundColor: '#FFF',
    ...shadows.card,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  hintDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  hintText: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 14,
  },
});
