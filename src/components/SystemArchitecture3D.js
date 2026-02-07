import React, { useRef, useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

const IS_WEB = Platform.OS === 'web';

const CATEGORY_COLORS = {
  entry: colors.success,
  defense: colors.danger,
  sizing: colors.warning,
  utility: colors.accent,
};

function RotatingGroup({ children }) {
  const ref = useRef();
  if (useFrame) {
    useFrame((_, delta) => {
      if (ref.current) {
        ref.current.rotation.y += delta * 0.1;
      }
    });
  }
  return <group ref={ref}>{children}</group>;
}

function NodeMesh({ position, color, scale = 1 }) {
  const meshRef = useRef();
  const tilt = useMemo(() => [Math.random() * 0.4, Math.random() * 0.6, 0], []);

  if (useFrame) {
    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5 + position[0]) * 0.08;
        meshRef.current.rotation.x = tilt[0] + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
        meshRef.current.rotation.y = tilt[1] + state.clock.elapsedTime * 0.3;
      }
    });
  }

  return (
    <group>
      {/* Solid box with soft toy look */}
      <mesh ref={meshRef} position={position} scale={scale}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {/* Glossy highlight layer */}
      <mesh position={position} scale={scale * 1.02}>
        <boxGeometry args={[0.45, 0.45, 0.45]} />
        <meshStandardMaterial color="#FFF" transparent opacity={0.1} roughness={0} metalness={1} />
      </mesh>
    </group>
  );
}

function CoreMesh({ position }) {
  const meshRef = useRef();
  const ringRef = useRef();

  if (useFrame) {
    useFrame((state) => {
      if (meshRef.current) {
        meshRef.current.rotation.x = state.clock.elapsedTime * 0.3;
        meshRef.current.rotation.z = state.clock.elapsedTime * 0.2;
      }
      if (ringRef.current) {
        ringRef.current.rotation.y = -state.clock.elapsedTime * 0.5;
      }
    });
  }

  return (
    <group>
      {/* Primary Talent Core */}
      <mesh ref={meshRef} position={position}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={colors.primary}
          emissive={colors.primary}
          emissiveIntensity={0.2}
          roughness={0.3}
        />
      </mesh>
      {/* Floating ring */}
      <mesh ref={ringRef} position={position}>
        <torusGeometry args={[0.6, 0.02, 16, 32]} />
        <meshStandardMaterial color={colors.warning} emissive={colors.warning} emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

function ConnectionLine({ start, end, color }) {
  const points = useMemo(() => [
    new THREE.Vector3(...start),
    new THREE.Vector3(...end),
  ], [start, end]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.4} />
    </line>
  );
}

function GridFloor() {
  return (
    <gridHelper args={[8, 16, '#D1D5DB', '#E2E5EB']} position={[0, -1.5, 0]} />
  );
}

function Label({ position, text, color }) {
  return null;
}

function ArrowLine({ start, end, color }) {
  const mid = useMemo(() => [
    (start[0] + end[0]) / 2,
    (start[1] + end[1]) / 2 + 0.15,
    (start[2] + end[2]) / 2,
  ], [start, end]);

  return (
    <group>
      <ConnectionLine start={start} end={mid} color={color} />
      <ConnectionLine start={mid} end={end} color={color} />
      <mesh position={mid}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function Scene3D({ blocks }) {
  const entryBlocks = blocks.filter(b => b.category === 'entry');
  const defenseBlocks = blocks.filter(b => b.category === 'defense');
  const sizingBlocks = blocks.filter(b => b.category === 'sizing');
  const utilityBlocks = blocks.filter(b => b.category === 'utility');

  // Pipeline layout: left-to-right flow
  // X axis = pipeline stage, Z axis = spread within stage, Y axis = vertical
  const STAGE_X = { entry: -2.2, core: 0, sizing: 0, defense: 2.2 };

  const spreadZ = (count, i) => {
    if (count <= 1) return 0;
    const span = Math.min(count - 1, 3) * 0.9;
    return -span / 2 + (i / (count - 1)) * span;
  };

  const entryPositions = entryBlocks.map((_, i) => [STAGE_X.entry, 0, spreadZ(entryBlocks.length, i)]);
  const defensePositions = defenseBlocks.map((_, i) => [STAGE_X.defense, 0, spreadZ(defenseBlocks.length, i)]);
  const sizingPositions = sizingBlocks.map((_, i) => [0, 1.2 + i * 0.7, 0]);
  const utilityPositions = utilityBlocks.map((_, i) => [0, -(1.0 + i * 0.7), 0]);

  const corePos = [STAGE_X.core, 0, 0];

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} color="#FFFFFF" castShadow />
      <directionalLight position={[-4, 3, -2]} intensity={0.3} color="#FF444F" />
      <pointLight position={[0, -2, 0]} intensity={0.2} color="#C4811A" />

      <RotatingGroup>
        {/* === STAGE 1: Entry signals (left) === */}
        {entryPositions.map((pos, i) => (
          <React.Fragment key={`entry-${i}`}>
            <NodeMesh position={pos} color={CATEGORY_COLORS.entry} />
            <ArrowLine start={pos} end={corePos} color={CATEGORY_COLORS.entry} />
          </React.Fragment>
        ))}

        {/* === STAGE 2: Core decision engine (center) === */}
        <CoreMesh position={corePos} />

        {/* === Sizing nodes (above core) === */}
        {sizingPositions.map((pos, i) => (
          <React.Fragment key={`size-${i}`}>
            <NodeMesh position={pos} color={CATEGORY_COLORS.sizing} scale={0.7} />
            <ConnectionLine start={corePos} end={pos} color={CATEGORY_COLORS.sizing} />
          </React.Fragment>
        ))}

        {/* === Utility nodes (below core) === */}
        {utilityPositions.map((pos, i) => (
          <React.Fragment key={`util-${i}`}>
            <NodeMesh position={pos} color={CATEGORY_COLORS.utility} scale={0.6} />
            <ConnectionLine start={corePos} end={pos} color={CATEGORY_COLORS.utility} />
          </React.Fragment>
        ))}

        {/* === STAGE 3: Risk management / exit (right) === */}
        {defensePositions.map((pos, i) => (
          <React.Fragment key={`def-${i}`}>
            <NodeMesh position={pos} color={CATEGORY_COLORS.defense} />
            <ArrowLine start={corePos} end={pos} color={CATEGORY_COLORS.defense} />
          </React.Fragment>
        ))}

        <GridFloor />
      </RotatingGroup>
    </>
  );
}

export default function SystemArchitecture3D({ blocks }) {
  if (!blocks || blocks.length === 0) {
    return (
      <View style={styles.empty}>
        <MaterialCommunityIcons name="star-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>The Stage is Waiting</Text>
        <Text style={styles.emptySub}>Add some routine steps to see your talent map!</Text>
      </View>
    );
  }

  if (!IS_WEB) {
    return (
      <View style={styles.fallback}>
        <MaterialCommunityIcons name="cube-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>3D View Offline</Text>
        <Text style={styles.emptySub}>The 3D stage requires a web browser to perform!</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>The Routine Map</Text>
          <Text style={styles.subtitle}>A 3D look at your performance flow</Text>
        </View>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>On Air</Text>
        </View>
      </View>

      <View style={styles.canvasWrap}>
        <Canvas
          camera={{ position: [0, 3, 6], fov: 45 }}
          style={{ background: colors.bg }}
        >
          <Scene3D blocks={blocks} />
        </Canvas>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerMetric}>
          <Text style={styles.metricLabel}>Talent Nodes</Text>
          <Text style={styles.metricValue}>{blocks.length}</Text>
        </View>
        <View style={styles.footerDivider} />
        <View style={styles.footerMetric}>
          <Text style={styles.metricLabel}>Visual Merits</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>High</Text>
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
    backgroundColor: colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.round,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  statusText: {
    ...typography.bodyBold,
    color: colors.primary,
    fontSize: 10,
  },
  canvasWrap: {
    height: 300,
    backgroundColor: colors.bg,
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
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  fallback: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bg,
    borderRadius: radius.lg,
    ...shadows.card,
  },
  emptyText: {
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  emptySub: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
  },
});
