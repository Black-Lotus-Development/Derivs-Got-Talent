import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Modal, Portal, TextInput, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

export default function ParamEditor({ visible, block, paramKey, onDismiss, onSave }) {
  const currentValue = block?.params?.[paramKey] ?? '';
  const [value, setValue] = useState(String(currentValue));

  useEffect(() => {
    if (visible) {
      setValue(String(block?.params?.[paramKey] ?? ''));
    }
  }, [visible, block, paramKey]);

  const handleSave = () => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onSave(numValue);
    }
    onDismiss();
  };

  if (!block || !paramKey) return null;

  const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.card}>
          <View style={styles.body}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconBox, { backgroundColor: meta.color + '10' }]}>
                <MaterialCommunityIcons name={block.icon} size={24} color={meta.color} />
              </View>
              <View style={styles.headerInfo}>
                <Text style={styles.headerLabel}>Module Settings</Text>
                <Text style={styles.blockName}>{block.name}</Text>
              </View>
            </View>

            {/* Parameter Section */}
            <View style={styles.paramSection}>
              <View style={styles.paramLabelRow}>
                <Text style={styles.paramLabel}>{paramKey}</Text>
                <Text style={styles.paramType}>Value</Text>
              </View>
              <TextInput
                mode="outlined"
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                style={styles.input}
                outlineColor={colors.divider}
                activeOutlineColor={meta.color}
                textColor={colors.textPrimary}
                autoFocus
                dense
              />
              <Text style={styles.paramDesc}>Adjust the slider or type a new value for this part of your routine.</Text>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable onPress={onDismiss} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable 
                onPress={handleSave} 
                style={({ pressed }) => [
                  styles.saveBtn, 
                  { backgroundColor: meta.color },
                  shadows.toy(meta.dark),
                  pressed && { transform: [{ scale: 0.96 }] }
                ]}
              >
                <Text style={styles.saveText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
          
          {/* Footer Decor */}
          <View style={[styles.footerDecor, { backgroundColor: meta.color + '20' }]}>
            <View style={[styles.accentBar, { backgroundColor: meta.color }]} />
          </View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modal: {
    margin: spacing.xl,
  },
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadows.elevated,
  },
  body: {
    padding: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  headerLabel: {
    ...typography.caption,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  blockName: {
    ...typography.h2,
    color: colors.textPrimary,
    fontSize: 20,
  },
  paramSection: {
    marginBottom: spacing.xl,
  },
  paramLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  paramLabel: {
    ...typography.bodyBold,
    color: colors.textSecondary,
    fontSize: 14,
  },
  paramType: {
    ...typography.caption,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.bg,
    fontSize: 16,
    fontWeight: '600',
  },
  paramDesc: {
    ...typography.body,
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cancelText: {
    ...typography.bodyBold,
    color: colors.textMuted,
  },
  saveBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveText: {
    ...typography.bodyBold,
    color: '#FFF',
  },
  footerDecor: {
    height: 4,
    width: '100%',
  },
  accentBar: {
    height: 4,
    width: '30%',
  },
});
