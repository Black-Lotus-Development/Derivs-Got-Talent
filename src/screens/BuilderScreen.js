import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform } from 'react-native';
import { TextInput, Portal, Modal, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlockPalette from '../components/BlockPalette';
import SystemArchitecture from '../components/SystemArchitecture';
import SystemArchitecture3D from '../components/SystemArchitecture3D';
import ParamEditor from '../components/ParamEditor';
import { loadLastStrategy } from '../api/storage';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

export default function BuilderScreen({ navigation, route }) {
  const [blocks, setBlocks] = useState([]);
  const [strategyName, setStrategyName] = useState('ALPHA-OMEGA');
  const [show3D, setShow3D] = useState(false);
  const [editingParam, setEditingParam] = useState(null);
  const [snackMessage, setSnackMessage] = useState('');
  const [routineCollapsed, setRoutineCollapsed] = useState(true);

  const blurActiveElement = useCallback(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const el = document.activeElement;
      if (el && typeof el.blur === 'function') el.blur();
    }
  }, []);

  const dismiss3DModal = useCallback(() => {
    blurActiveElement();
    setShow3D(false);
  }, [blurActiveElement]);

  const dismissParamEditor = useCallback(() => {
    blurActiveElement();
    setEditingParam(null);
  }, [blurActiveElement]);

  const dismissSnackbar = useCallback(() => {
    blurActiveElement();
    setSnackMessage('');
  }, [blurActiveElement]);

  useEffect(() => {
    loadLastStrategy().then((saved) => {
      if (saved && saved.blocks && saved.blocks.length > 0) {
        setBlocks(saved.blocks);
        setStrategyName(saved.name || 'ALPHA-OMEGA');
      }
    });
  }, []);

  // Handle blocks returned from RoutineScreen
  useEffect(() => {
    if (route?.params?.updatedBlocks) {
      setBlocks(route.params.updatedBlocks);
      if (route.params.strategyName) {
        setStrategyName(route.params.strategyName);
      }
      if (route.params.editRequest) {
        setEditingParam(route.params.editRequest);
      }
    }
  }, [route?.params?.updatedBlocks]);

  useEffect(() => {
    if (route?.params?.openValidation && blocks.length > 0) {
      navigation.navigate('StrategyValidation', { strategyName, blocks });
      navigation.setParams({ openValidation: undefined });
    }
  }, [route?.params?.openValidation, blocks.length, navigation, strategyName, blocks]);

  const handleBlockSelect = useCallback((block) => {
    setBlocks((prev) => [
      ...prev,
      {
        ...block,
        instanceId: `${block.id}-${Date.now()}`,
        params: { ...block.params },
      },
    ]);
  }, []);

  const handleRemoveBlock = useCallback((index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleReorderBlocks = useCallback((reordered) => {
    setBlocks(reordered);
  }, []);

  const handleEditBlock = useCallback((index, paramKey) => {
    setEditingParam({ index, paramKey });
  }, []);

  const handleSaveParam = useCallback((value) => {
    if (editingParam === null) return;
    setBlocks((prev) => {
      const updated = [...prev];
      updated[editingParam.index] = {
        ...updated[editingParam.index],
        params: {
          ...updated[editingParam.index].params,
          [editingParam.paramKey]: value,
        },
      };
      return updated;
    });
    setEditingParam(null);
  }, [editingParam]);



  const entryCount = blocks.filter((b) => b.category === 'entry').length;
  const defenseCount = blocks.filter((b) => b.category === 'defense').length;
  const sizingCount = blocks.filter((b) => b.category === 'sizing').length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>The Workshop</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => setShow3D(true)}
              style={styles.headerAction}
              disabled={blocks.length === 0}
            >
              <MaterialCommunityIcons
                name="cube-scan"
                size={22}
                color={blocks.length === 0 ? colors.textMuted : colors.accent}
              />
            </Pressable>
          </View>
        </View>

        {/* Strategy name + stats bar */}
        <View style={styles.nameRow}>
          <View style={styles.inputContainer}>
            <TextInput
              mode="flat"
              placeholder="Give your routine a name..."
              value={strategyName}
              onChangeText={setStrategyName}
              style={styles.nameInput}
              underlineColor="transparent"
              activeUnderlineColor={colors.primary}
              textColor={colors.textPrimary}
              placeholderTextColor={colors.textMuted}
              dense
            />
            <MaterialCommunityIcons name="pencil" size={16} color={colors.textMuted} style={styles.inputIcon} />
          </View>

          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: colors.success + '15' }]}>
              <Text style={[styles.statText, { color: colors.success }]}>{entryCount}</Text>
              <MaterialCommunityIcons name="star" size={14} color={colors.success} />
            </View>
            <View style={[styles.statBadge, { backgroundColor: colors.danger + '15' }]}>
              <Text style={[styles.statText, { color: colors.danger }]}>{defenseCount}</Text>
              <MaterialCommunityIcons name="heart" size={14} color={colors.danger} />
            </View>
          </View>
        </View>
      </View>

      {/* Main Content Area: Block Palette takes precedence */}
      <View style={styles.mainContent}>
        <BlockPalette onBlockSelect={handleBlockSelect} />
      </View>

      {/* Collapsible Routine Section */}
      <View style={[styles.routineDrawer, !routineCollapsed && styles.routineDrawerExpanded]}>
        <Pressable
          style={styles.routineHeader}
          onPress={() => setRoutineCollapsed(!routineCollapsed)}
        >
          <View style={styles.routineHeaderLeft}>
            <MaterialCommunityIcons name="playlist-star" size={20} color={colors.primary} />
            <Text style={styles.routineHeaderTitle}>Your Routine</Text>
            <View style={styles.routineBadge}>
              <Text style={styles.routineBadgeText}>{blocks.length}</Text>
            </View>
          </View>
          <MaterialCommunityIcons
            name={routineCollapsed ? "chevron-up" : "chevron-down"}
            size={24}
            color={colors.textMuted}
          />
        </Pressable>

        <View style={styles.routineContent}>
          {blocks.length === 0 ? (
            <View style={styles.emptyRoutine}>
              <Text style={styles.emptyRoutineTitle}>No pieces yet</Text>
              <Text style={styles.emptyRoutineText}>Select tools from above</Text>
            </View>
          ) : (
            <ScrollView
              style={styles.routineScroll}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routineScrollContent}
            >
              {blocks.map((block, i) => {
                const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;
                return (
                  <View key={block.instanceId} style={styles.routinePieceChip}>
                    <View style={[styles.routinePieceDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.routinePieceName} numberOfLines={1}>{block.name}</Text>
                    <Pressable
                      onPress={() => handleRemoveBlock(i)}
                      style={styles.routinePieceRemove}
                      hitSlop={8}
                    >
                      <MaterialCommunityIcons name="close-circle" size={18} color={colors.danger} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {!routineCollapsed && blocks.length > 0 && (
            <Pressable
              onPress={() => navigation.navigate('Routine', { blocks, strategyName })}
              style={styles.openStudioBtn}
            >
              <Text style={styles.openStudioText}>Open Studio View</Text>
              <MaterialCommunityIcons name="arrow-expand" size={16} color="#FFF" />
            </Pressable>
          )}
        </View>
      </View>

      {/* System Architecture Preview Modal */}
      <Portal>
        <Modal
          visible={show3D}
          onDismiss={dismiss3DModal}
          contentContainerStyle={styles.modal}
        >
          <Text style={styles.modalTitle}>System Architecture</Text>
          <Text style={styles.modalSubtitle}>A live view of how your routine flows through the judges.</Text>
          <View style={{ height: spacing.md }} />
          <SystemArchitecture3D blocks={blocks} />
          <View style={{ height: spacing.md }} />
          <SystemArchitecture blocks={blocks} />
        </Modal>
      </Portal>

      {/* Param Editor Modal */}
      <ParamEditor
        visible={editingParam !== null}
        block={editingParam !== null ? blocks[editingParam.index] : null}
        paramKey={editingParam?.paramKey}
        onDismiss={dismissParamEditor}
        onSave={handleSaveParam}
      />

      {/* Snackbar */}
      <Snackbar
        visible={!!snackMessage}
        onDismiss={dismissSnackbar}
        duration={2000}
        style={styles.snackbar}
      >
        <Text style={styles.snackText}>{snackMessage}</Text>
      </Snackbar>
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
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
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
    color: colors.gameText,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: radius.md,
    paddingRight: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  nameInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 44,
    ...typography.bodyBold,
    color: '#FFF',
  },
  inputIcon: {
    opacity: 0.6,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.md,
  },
  statText: {
    ...typography.bodyBold,
  },
  mainContent: {
    flex: 1,
  },
  routineDrawer: {
    backgroundColor: colors.gameSurface,
    borderTopWidth: 1,
    borderTopColor: colors.gameBorder,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
    position: 'absolute', // Make it overlay or stick to bottom? Let's stick it at bottom of flex container by not making it absolute, but it needs to collapse.
    // Actually, making it absolute or just last child with standard flow?
    // Let's use standard flow but control height
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    ...shadows.elevated,
  },
  routineDrawerExpanded: {
    height: 200, // or some max height
  },
  routineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.gameSurface, // ensure opacity covers content behind
  },
  routineHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  routineHeaderTitle: {
    ...typography.h3,
    color: '#FFF',
  },
  routineBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  routineBadgeText: {
    ...typography.micro,
    color: '#FFF',
  },
  routineContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  emptyRoutine: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    gap: 4,
  },
  emptyRoutineTitle: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  emptyRoutineText: {
    ...typography.caption,
    color: colors.textMuted,
    opacity: 0.7,
  },
  routineScroll: {
    maxHeight: 60,
  },
  routineScrollContent: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  routinePreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.gameBg,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  routinePieceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.gameBg,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  routinePieceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routinePieceName: {
    ...typography.caption,
    color: '#FFF',
    maxWidth: 80,
  },
  routinePieceRemove: {
    padding: 2,
  },
  miniPieces: {
    flexDirection: 'row',
    gap: 4,
  },
  miniPieceItem: {
    width: 12,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniPieceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  editOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255,255,255,0.1)',
  },
  editText: {
    ...typography.caption,
    color: colors.gameAccent,
  },
  openStudioBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  openStudioText: {
    ...typography.bodyBold,
    color: '#FFF',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: spacing.xl,
    borderRadius: radius.xl,
  },
  fabDisabled: {
    opacity: 0.5,
  },
  fabPressed: {
    transform: [{ scale: 0.94 }],
  },
  fabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    gap: spacing.md,
  },
  fabLabel: {
    ...typography.button,
    color: '#FFF',
  },
  modal: {
    backgroundColor: colors.gameBg,
    padding: spacing.md,
    margin: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  modalTitle: {
    ...typography.h2,
    color: '#FFF',
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textMuted,
  },
  snackbar: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  snackText: {
    ...typography.body,
    color: '#FFF',
  },
});
