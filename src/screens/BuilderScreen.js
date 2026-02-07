import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, ScrollView, Platform, Share } from 'react-native';
import { TextInput, Portal, Modal, Snackbar, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BlockPalette from '../components/BlockPalette';
import SystemArchitecture from '../components/SystemArchitecture';
import SystemArchitecture3D from '../components/SystemArchitecture3D';
import ParamEditor from '../components/ParamEditor';
import { saveStrategy, loadLastStrategy } from '../api/storage';
import { exportToDerivBotXML, getExportFilename } from '../api/deriv/xmlExporter';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

export default function BuilderScreen({ navigation, route }) {
  const [blocks, setBlocks] = useState([]);
  const [strategyName, setStrategyName] = useState('ALPHA-OMEGA');
  const [show3D, setShow3D] = useState(false);
  const [editingParam, setEditingParam] = useState(null);
  const [snackMessage, setSnackMessage] = useState('');

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

  const handleSave = async () => {
    const strategy = { name: strategyName, blocks, timestamp: Date.now() };
    const ok = await saveStrategy(strategy);
    setSnackMessage(ok ? 'BLUEPRINT ARCHIVED' : 'SYNC ERROR');
  };

  const handleExportXML = useCallback(async () => {
    if (blocks.length === 0) return;

    try {
      const xml = exportToDerivBotXML(blocks, strategyName);
      const filename = getExportFilename(strategyName);

      if (Platform.OS === 'web') {
        // Download as file on web
        const blob = new Blob([xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setSnackMessage('EXPORTED TO DERIV BOT');
      } else {
        // Share on native
        await Share.share({
          message: xml,
          title: filename,
        });
        setSnackMessage('EXPORTED TO DERIV BOT');
      }
    } catch (err) {
      setSnackMessage('EXPORT FAILED');
    }
  }, [blocks, strategyName]);

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
            <Pressable onPress={handleExportXML} style={styles.headerAction} disabled={blocks.length === 0}>
              <MaterialCommunityIcons
                name="robot-outline"
                size={22}
                color={blocks.length === 0 ? colors.textMuted : colors.success}
              />
            </Pressable>
            <Pressable onPress={handleSave} style={styles.headerAction} disabled={blocks.length === 0}>
              <MaterialCommunityIcons
                name="heart-outline"
                size={22}
                color={blocks.length === 0 ? colors.textMuted : colors.primary}
              />
            </Pressable>
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

      {/* Block Palette */}
      <BlockPalette onBlockSelect={handleBlockSelect} />

      {/* Routine Preview + Open Button */}
      <ScrollView style={styles.routinePreviewScroll} contentContainerStyle={styles.routinePreviewContent}>
        {blocks.length === 0 ? (
          <View style={styles.emptyRoutine}>
            <MaterialCommunityIcons name="puzzle-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyRoutineTitle}>No pieces yet</Text>
            <Text style={styles.emptyRoutineText}>
              Add talent modules from the toolkit above to start composing your routine.
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={() => navigation.navigate('Routine', { blocks, strategyName })}
            style={({ pressed }) => [styles.routineCard, pressed && { transform: [{ scale: 0.98 }] }]}
          >
            <View style={styles.routineCardHeader}>
              <MaterialCommunityIcons name="playlist-star" size={20} color={colors.primary} />
              <Text style={styles.routineCardTitle}>Your Routine</Text>
              <View style={styles.routineBadge}>
                <Text style={styles.routineBadgeText}>{blocks.length} pieces</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textMuted} />
            </View>
            <View style={styles.miniPieces}>
              {blocks.map((block, i) => {
                const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;
                return (
                  <View key={block.instanceId} style={styles.miniPieceRow}>
                    <View style={[styles.miniPieceDot, { backgroundColor: meta.color }]} />
                    <Text style={styles.miniPieceName} numberOfLines={1}>{block.name}</Text>
                    {i < blocks.length - 1 && (
                      <View style={[styles.miniConnector, { borderColor: meta.color + '40' }]} />
                    )}
                  </View>
                );
              })}
            </View>
            <View style={styles.routineCardFooter}>
              <MaterialCommunityIcons name="puzzle-edit-outline" size={16} color={colors.primary} />
              <Text style={styles.routineCardFooterText}>Tap to arrange and edit pieces</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

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
  routinePreviewScroll: {
    flex: 1,
  },
  routinePreviewContent: {
    padding: spacing.lg,
    paddingBottom: 120,
  },
  emptyRoutine: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl,
    gap: spacing.sm,
  },
  emptyRoutineTitle: {
    ...typography.h3,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  emptyRoutineText: {
    ...typography.caption,
    color: colors.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
  routineCard: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.gameBorder,
    overflow: 'hidden',
  },
  routineCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
  },
  routineCardTitle: {
    ...typography.h3,
    color: '#FFF',
    flex: 1,
  },
  routineBadge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.round,
  },
  routineBadgeText: {
    ...typography.micro,
    color: '#FFF',
  },
  miniPieces: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  miniPieceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  miniPieceDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  miniPieceName: {
    ...typography.bodyBold,
    color: colors.textMuted,
    flex: 1,
  },
  miniConnector: {
    position: 'absolute',
    left: 4,
    top: 14,
    width: 1,
    height: 16,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
  routineCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  routineCardFooterText: {
    ...typography.micro,
    color: colors.gameAccent,
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
