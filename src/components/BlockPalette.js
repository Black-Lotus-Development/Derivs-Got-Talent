import React, { useState } from 'react';
import { ScrollView, View, StyleSheet, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BLOCKS } from '../game/blockDefinitions';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

function BlockItem({ block, onSelect }) {
  const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;
  return (
    <Pressable
      onPress={() => onSelect(block)}
      style={({ pressed }) => [styles.blockOuter, pressed && styles.blockPressed]}
    >
      <View style={[
        styles.block,
        { backgroundColor: meta.color },
        shadows.toy(meta.dark)
      ]}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons name={block.icon} size={24} color="#FFF" />
        </View>
        <View style={styles.blockInfo}>
          <Text style={styles.name} numberOfLines={1}>{block.name}</Text>
          <Text style={styles.desc} numberOfLines={2}>{block.description}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function CategoryRow({ categoryKey, blocks, onBlockSelect }) {
  const meta = blockCategoryMeta[categoryKey];
  if (!meta) return null;
  const categoryBlocks = blocks.filter((b) => b.category === categoryKey);
  if (categoryBlocks.length === 0) return null;

  return (
    <View style={styles.categorySection}>
      <View style={styles.categoryHeader}>
        <View style={[styles.categoryIconBox, { backgroundColor: meta.color + '20' }]}>
          <MaterialCommunityIcons name={meta.icon} size={14} color={meta.color} />
        </View>
        <Text style={[styles.categoryLabel, { color: '#FFF' }]}>{meta.label}</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rowContent}
      >
        {categoryBlocks.map((block) => (
          <BlockItem key={block.id} block={block} onSelect={onBlockSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

export default function BlockPalette({ onBlockSelect }) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="toolbox-outline" size={20} color={colors.gameAccent} />
          <Text style={styles.headerTitle}>Talent Toolkit</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {Object.keys(blockCategoryMeta).map((key) => (
          <CategoryRow
            key={key}
            categoryKey={key}
            blocks={BLOCKS}
            onBlockSelect={onBlockSelect}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // fill available space
    backgroundColor: colors.gameSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
    borderTopWidth: 1,
    borderTopColor: colors.gameBorder,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gameSurface,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: '#FFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerStatus: {
    ...typography.caption,
    color: colors.gameAccent,
  },
  scroll: {
    paddingBottom: spacing.lg,
    backgroundColor: colors.gameBg, // darker background for the scroll area to make blocks pop
  },
  categorySection: {
    marginTop: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  categoryIconBox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryLabel: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  categoryLine: {
    display: 'none',
  },
  rowContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  blockOuter: {
    borderRadius: radius.md,
    width: 150,
  },
  blockPressed: {
    transform: [{ scale: 0.96 }],
  },
  block: {
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'flex-start',
    gap: spacing.sm,
    height: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockInfo: {
    gap: 2,
  },
  name: {
    ...typography.bodyBold,
    fontSize: 14,
    color: '#FFF',
  },
  desc: {
    ...typography.caption,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 14,
  },
});
