import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Text as PaperText } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as ScreenOrientation from 'expo-screen-orientation';
import { colors, spacing, radius, typography, shadows, blockCategoryMeta } from '../theme';

// ─── Constants ────────────────────────────────────────────────────────────────
const PW = 1.6;
const PH = 1.0;
const PD = 0.22;
const NUB_R = 0.14;
const SNAP_DIST = 0.7;
const MAGNET_DIST = SNAP_DIST * 0.55;
const CHAIN_GAP_X = PW + NUB_R * 0.7 + 0.02;
const CHAIN_GAP_Y = PH + 0.18;
const STACK_GAP = PH + 0.45;
const STACK_X = 0;
const CAMERA_ZOOM = 100;

// ─── Puzzle Piece (primitive geometry only — RN compatible) ─────────────────
function PuzzlePiece({ block, index, total, position, onDrag, onDragEnd }) {
  const meta = blockCategoryMeta[block.category] || blockCategoryMeta.entry;
  const groupRef = useRef();
  const [hov, setHov] = useState(false);
  const dragRef = useRef(false);
  const off = useRef(new THREE.Vector3());
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const isFirst = index === 0;
  const isLast = index === total - 1;

  const col = useMemo(() => new THREE.Color(meta.color), [meta.color]);
  const colDark = useMemo(
    () => new THREE.Color(meta.dark || meta.color).multiplyScalar(0.7),
    [meta],
  );

  // Animate lift on hover / drag
  useFrame(() => {
    if (!groupRef.current) return;
    const tz = dragRef.current ? 0.3 : hov ? 0.1 : 0;
    const rx = dragRef.current ? -0.2 : 0;
    const ry = dragRef.current ? 0.1 : 0;

    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, tz, 0.12);
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, rx, 0.12);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, ry, 0.12);

    // Scale pulse
    const sc = dragRef.current ? 1.05 : hov ? 1.02 : 1;
    const cur = groupRef.current.scale.x;
    const nxt = THREE.MathUtils.lerp(cur, sc, 0.12);
    groupRef.current.scale.set(nxt, nxt, nxt);
  });

  const hitPlane = useCallback((e) => {
    const target = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane, target);
    return target;
  }, [dragPlane]);

  const onDown = useCallback((e) => {
    e.stopPropagation();
    dragRef.current = true;
    const w = hitPlane(e);
    off.current.set(w.x - position[0], w.y - position[1], 0);
    if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId);
  }, [position, hitPlane]);

  const onMove = useCallback((e) => {
    if (!dragRef.current) return;
    e.stopPropagation();
    const w = hitPlane(e);
    onDrag(index, [w.x - off.current.x, w.y - off.current.y, 0]);
  }, [index, onDrag, hitPlane]);

  const onUp = useCallback((e) => {
    dragRef.current = false;
    if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
    if (onDragEnd) onDragEnd();
  }, [onDragEnd]);

  const pointerProps = {
    onPointerDown: onDown,
    onPointerMove: onMove,
    onPointerUp: onUp,
    onPointerOver: () => setHov(true),
    onPointerOut: () => { if (!dragRef.current) setHov(false); },
  };

  return (
    <group position={position}>
      <group ref={groupRef}>
        {/* Drop shadow */}
        <mesh position={[0.04, -0.04, -PD / 2 - 0.03]}>
          <boxGeometry args={[PW, PH, 0.01]} />
          <meshBasicMaterial color="#64748B" transparent opacity={0.1} />
        </mesh>

        {/* Main body */}
        <mesh {...pointerProps} castShadow>
          <boxGeometry args={[PW, PH, PD]} />
          <meshStandardMaterial color={col} roughness={0.3} metalness={0} />
        </mesh>

        {/* Bottom edge (darker strip for depth) */}
        <mesh position={[0, -PH / 2 + 0.015, 0]}>
          <boxGeometry args={[PW, 0.03, PD]} />
          <meshStandardMaterial color={colDark} roughness={0.5} />
        </mesh>

        {/* Top highlight */}
        <mesh position={[0, PH * 0.3, PD / 2 + 0.005]}>
          <planeGeometry args={[PW * 0.65, 0.04]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.25} />
        </mesh>

        {/* Horizontal tab nub on right */}
        <mesh
          position={[PW / 2 + NUB_R * 0.7, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          {...pointerProps}
        >
          <cylinderGeometry args={[NUB_R, NUB_R, PD, 16]} />
          <meshStandardMaterial color={col} roughness={0.3} metalness={0} />
        </mesh>

        {/* Horizontal socket on left */}
        <mesh position={[-PW / 2 - 0.005, 0, PD / 2 + 0.005]}>
          <circleGeometry args={[NUB_R * 0.85, 16]} />
          <meshBasicMaterial color={colDark} />
        </mesh>

        {/* Vertical socket on bottom */}
        <mesh position={[0, -PH / 2 - 0.005, PD / 2 + 0.005]}>
          <circleGeometry args={[NUB_R * 0.85, 16]} />
          <meshBasicMaterial color={colDark} />
        </mesh>

        {/* Vertical socket on top */}
        <mesh position={[0, PH / 2 + 0.005, PD / 2 + 0.005]}>
          <circleGeometry args={[NUB_R * 0.85, 16]} />
          <meshBasicMaterial color={colDark} />
        </mesh>

        {/* Number badge */}
        <mesh position={[-PW / 2 + 0.2, PH / 2 - 0.18, PD / 2 + 0.006]}>
          <circleGeometry args={[0.12, 16]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.5} />
        </mesh>

        {/* Category accent stripe */}
        <mesh position={[0, -PH / 2 + 0.04, PD / 2 + 0.005]}>
          <planeGeometry args={[PW * 0.85, 0.04]} />
          <meshBasicMaterial color="#fff" transparent opacity={0.15} />
        </mesh>


      </group>
    </group>
  );
}

// ─── Grid floor ───────────────────────────────────────────────────────────────
function DotGrid() {
  const geo = useMemo(() => {
    const pts = [];
    for (let x = -8; x <= 8; x += 0.8) {
      for (let y = -5; y <= 5; y += 0.8) {
        pts.push(new THREE.Vector3(x, y, -0.3));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial color="#CBD5E1" size={2} sizeAttenuation={false} />
    </points>
  );
}

// ─── Camera Controller (Pan/Zoom via R3F pointer events) ─────────────────────
function CameraPanPlane({ onCameraMove }) {
  const { camera } = useThree();
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);

  const hitPlane = useCallback((e) => {
    const target = new THREE.Vector3();
    e.ray.intersectPlane(dragPlane, target);
    return target;
  }, [dragPlane]);

  const onPointerDown = useCallback((e) => {
    // Only handle if not already captured by a piece
    if (e.eventObject === e.object) {
      isDragging.current = true;
      const world = hitPlane(e);
      lastPos.current = { x: world.x, y: world.y };
      if (e.target?.setPointerCapture) e.target.setPointerCapture(e.pointerId);
    }
  }, [hitPlane]);

  const onPointerMove = useCallback((e) => {
    if (!isDragging.current) return;
    const world = hitPlane(e);
    const dx = world.x - lastPos.current.x;
    const dy = world.y - lastPos.current.y;
    camera.position.x -= dx;
    camera.position.y -= dy;
    // Don't call onCameraMove here - it causes re-renders on every frame
  }, [camera, hitPlane]);

  const onPointerUp = useCallback((e) => {
    isDragging.current = false;
    if (e.target?.releasePointerCapture) e.target.releasePointerCapture(e.pointerId);
    // Sync camera position to React state when drag ends
    if (onCameraMove) {
      onCameraMove({ x: camera.position.x, y: camera.position.y });
    }
  }, [camera, onCameraMove]);

  return (
    <mesh
      position={[0, 0, -5]}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

// ─── Zoom Controls (UI buttons since pinch is hard in R3F) ───────────────────
function ZoomControls({ zoom, onZoomIn, onZoomOut }) {
  return (
    <View style={zoomStyles.container}>
      <Pressable onPress={onZoomIn} style={zoomStyles.btn}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
      </Pressable>
      <PaperText style={zoomStyles.label}>{Math.round(zoom)}%</PaperText>
      <Pressable onPress={onZoomOut} style={zoomStyles.btn}>
        <MaterialCommunityIcons name="minus" size={20} color="#FFF" />
      </Pressable>
    </View>
  );
}

const zoomStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: spacing.lg,
    top: '50%',
    transform: [{ translateY: -60 }],
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...typography.micro,
    color: colors.textMuted,
    paddingVertical: spacing.xs,
  },
});

// ─── Camera Sync (syncs React state with Three.js camera) ────────────────────
function CameraSync({ zoom }) {
  const { camera } = useThree();

  useEffect(() => {
    if (camera && camera.zoom !== zoom) {
      camera.zoom = zoom;
      camera.updateProjectionMatrix();
    }
  }, [camera, zoom]);

  return null;
}

// ─── Scene ────────────────────────────────────────────────────────────────────
function PuzzleScene({ blocks, positions, onDrag, onDragEnd, onCameraMove }) {
  return (
    <>
      <color attach="background" args={[colors.gameBg]} />
      <ambientLight intensity={1.0} />
      <directionalLight position={[2, 3, 10]} intensity={0.5} />
      <directionalLight position={[-3, -1, 6]} intensity={0.15} color="#DDD6FE" />

      <CameraPanPlane onCameraMove={onCameraMove} />
      <DotGrid />

      {blocks.map((block, i) => (
        <PuzzlePiece
          key={block.instanceId}
          block={block}
          index={i}
          total={blocks.length}
          position={positions[i] || [0, 0, 0]}
          onDrag={onDrag}
          onDragEnd={onDragEnd}
        />
      ))}
    </>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function getStackPositions(count) {
  const totalH = (count - 1) * STACK_GAP;
  const startY = totalH / 2;
  return Array.from({ length: count }, (_, i) => [
    STACK_X,
    startY - i * STACK_GAP,
    0,
  ]);
}

function getMagnetizedPosition(index, candidate, positions) {
  let best = null;
  positions.forEach((pos, i) => {
    if (i === index || !pos) return;
    const dx = candidate[0] - pos[0];
    const dy = candidate[1] - pos[1];
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    const gapDeltaX = Math.abs(absDx - CHAIN_GAP_X);
    if (absDy < SNAP_DIST && gapDeltaX < MAGNET_DIST) {
      const sign = dx === 0 ? 1 : Math.sign(dx);
      const snapped = [pos[0] + sign * CHAIN_GAP_X, pos[1], 0];
      const score = gapDeltaX + absDy;
      if (!best || score < best.score) {
        best = { pos: snapped, score };
      }
    }

    const gapDeltaY = Math.abs(absDy - CHAIN_GAP_Y);
    if (absDx < SNAP_DIST && gapDeltaY < MAGNET_DIST) {
      const sign = dy === 0 ? 1 : Math.sign(dy);
      const snapped = [pos[0], pos[1] + sign * CHAIN_GAP_Y, 0];
      const score = gapDeltaY + absDx;
      if (!best || score < best.score) {
        best = { pos: snapped, score };
      }
    }
  });
  return best ? best.pos : candidate;
}

function getSnapTarget(index, positions) {
  const pos = positions[index];
  if (!pos) return null;
  let best = null;
  positions.forEach((other, i) => {
    if (i === index || !other) return;
    const dx = pos[0] - other[0];
    const dy = pos[1] - other[1];
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    // Horizontal snap
    const gapDeltaX = Math.abs(absDx - CHAIN_GAP_X);
    if (absDy < SNAP_DIST && gapDeltaX < SNAP_DIST) {
      const score = absDy + gapDeltaX;
      if (!best || score < best.score) {
        best = { axis: 'x', neighborIdx: i, side: Math.sign(dx) || 1, score };
      }
    }

    // Vertical snap
    const gapDeltaY = Math.abs(absDy - CHAIN_GAP_Y);
    if (absDx < SNAP_DIST && gapDeltaY < SNAP_DIST) {
      const score = absDx + gapDeltaY;
      if (!best || score < best.score) {
        best = { axis: 'y', neighborIdx: i, side: Math.sign(dy) || 1, score };
      }
    }
  });
  return best;
}

// Find all connected pairs of pieces and the direction of connection
const CONNECT_TOL = 0.15;
function getConnections(positions) {
  const conns = [];
  for (let i = 0; i < positions.length; i++) {
    const a = positions[i];
    if (!a) continue;
    for (let j = i + 1; j < positions.length; j++) {
      const b = positions[j];
      if (!b) continue;
      const dx = b[0] - a[0];
      const dy = b[1] - a[1];
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);
      // Horizontal connection
      if (absDy < CONNECT_TOL && Math.abs(absDx - CHAIN_GAP_X) < CONNECT_TOL) {
        const from = dx > 0 ? i : j;
        const to = dx > 0 ? j : i;
        conns.push({ from, to, axis: 'x' });
      }
      // Vertical connection
      if (absDx < CONNECT_TOL && Math.abs(absDy - CHAIN_GAP_Y) < CONNECT_TOL) {
        const from = dy < 0 ? i : j; // top piece -> bottom piece (y decreases downward in screen)
        const to = dy < 0 ? j : i;
        conns.push({ from, to, axis: 'y' });
      }
    }
  }
  return conns;
}

// Snap only the dragged piece to its closest neighbor — don't move other pieces
function snapDraggedPiece(dragIndex, positions, snapTarget) {
  const newPositions = [...positions];
  const pos = positions[dragIndex];
  if (!pos || !snapTarget) return newPositions;

  const { neighborIdx, axis, side } = snapTarget;
  const neighbor = positions[neighborIdx];
  if (!neighbor) return newPositions;

  if (axis === 'x') {
    newPositions[dragIndex] = [
      neighbor[0] + side * CHAIN_GAP_X,
      neighbor[1],
      0,
    ];
  } else {
    newPositions[dragIndex] = [
      neighbor[0],
      neighbor[1] + side * CHAIN_GAP_Y,
      0,
    ];
  }
  return newPositions;
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RoutineScreen({ route, navigation }) {
  const initialBlocks = route?.params?.blocks || [];
  const strategyName = route?.params?.strategyName || 'ALPHA-OMEGA';
  const [blocks, setBlocks] = useState(initialBlocks);
  const dragIdxRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 0, h: 0 });
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [zoom, setZoom] = useState(CAMERA_ZOOM);
  const [cameraPos, setCameraPos] = useState({ x: 0, y: 0 });

  const handleCameraMove = useCallback((pos) => {
    setCameraPos(pos);
  }, []);

  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(200, zoom + 20);
    setZoom(newZoom);
  }, [zoom]);

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(40, zoom - 20);
    setZoom(newZoom);
  }, [zoom]);

  const [positions, setPositions] = useState(() => getStackPositions(initialBlocks.length));

  // Lock to landscape on mount, unlock on unmount
  useEffect(() => {
    const lockOrientation = async () => {
      if (Platform.OS !== 'web') {
        try {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } catch (e) {
          // Orientation lock may not be supported on all devices
        }
      }
    };
    lockOrientation();

    return () => {
      if (Platform.OS !== 'web') {
        ScreenOrientation.unlockAsync().catch(() => { });
      }
    };
  }, []);

  const handleDrag = useCallback((index, newPos) => {
    dragIdxRef.current = index;
    setPositions((prev) => {
      const next = [...prev];
      const magnetized = getMagnetizedPosition(index, newPos, prev);
      next[index] = magnetized;
      return next;
    });
  }, []);

  // Ref-based implementation for drag end to avoid closure stale state hell
  const stateRef = useRef({ blocks, positions });
  stateRef.current = { blocks, positions };

  const onDragEndReal = useCallback(() => {
    const { blocks: currBlocks, positions: currPos } = stateRef.current;
    const dragIndex = dragIdxRef.current;
    if (dragIndex === null) return;

    dragIdxRef.current = null;

    const target = getSnapTarget(dragIndex, currPos);
    if (!target) return;

    const newPositions = snapDraggedPiece(dragIndex, currPos, target);
    setPositions(newPositions);
  }, []);

  const handleRemove = useCallback((index) => {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
    setPositions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleBack = () => navigation.navigate('Builder', { updatedBlocks: blocks, strategyName });
  const handleDone = () => navigation.navigate('Builder', { updatedBlocks: blocks, strategyName, openValidation: true });

  const handleAutoArrange = () => {
    setPositions(getStackPositions(blocks.length));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <PaperText style={styles.headerTitle}>Your Routine</PaperText>
          <PaperText style={styles.headerSub}>{strategyName} / {blocks.length} pieces</PaperText>
        </View>
        <Pressable onPress={handleAutoArrange} style={styles.arrangeBtn}>
          <MaterialCommunityIcons name="auto-fix" size={18} color={colors.accent} />
        </Pressable>
        <Pressable onPress={handleDone} style={styles.doneBtn}>
          <PaperText style={styles.doneBtnText}>Done</PaperText>
        </Pressable>
      </View>

      {blocks.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="puzzle-outline" size={48} color={colors.textMuted} />
          <PaperText style={styles.emptyTitle}>No pieces yet</PaperText>
          <PaperText style={styles.emptyText}>
            Go back to the Workshop and add talent modules to build your routine.
          </PaperText>
          <Pressable onPress={handleBack} style={styles.emptyBtn}>
            <PaperText style={styles.emptyBtnText}>Back to Workshop</PaperText>
          </Pressable>
        </View>
      ) : (
        <View
          style={styles.canvasContainer}
          onLayout={(e) => {
            const { width, height } = e.nativeEvent.layout;
            setCanvasSize({ w: width, h: height });
          }}
        >
          <Canvas
            orthographic
            camera={{ zoom: zoom, position: [0, 0, 10], near: 0.1, far: 100 }}
            style={{ flex: 1 }}
          >
            <CameraSync zoom={zoom} />
            <PuzzleScene
              blocks={blocks}
              positions={positions}
              onDrag={handleDrag}
              onDragEnd={onDragEndReal}
              onCameraMove={handleCameraMove}
            />
          </Canvas>

          {/* Zoom Controls */}
          <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

          {/* Piece labels overlay */}
          {canvasSize.w > 0 && (
            <View style={styles.labelsOverlay} pointerEvents="none">
              {blocks.map((b, i) => {
                const pos = positions[i] || [0, 0, 0];
                const sx = canvasSize.w / 2 + (pos[0] - cameraPos.x) * zoom;
                const sy = canvasSize.h / 2 - (pos[1] - cameraPos.y) * zoom;
                const m = blockCategoryMeta[b.category] || blockCategoryMeta.entry;
                const labelW = PW * zoom;
                const labelH = PH * zoom;
                return (
                  <View
                    key={b.instanceId}
                    style={[
                      styles.pieceLabel,
                      {
                        left: sx - labelW / 2,
                        top: sy - labelH / 2,
                        width: labelW,
                        height: labelH,
                      },
                    ]}
                  >
                    <View style={styles.stepBadge}>
                      <PaperText style={styles.stepNumber}>{i + 1}</PaperText>
                    </View>
                    <PaperText style={styles.pieceName} numberOfLines={1}>{b.name}</PaperText>
                    <PaperText style={styles.pieceCat}>{m.label}</PaperText>
                  </View>
                );
              })}
            </View>
          )}

          {/* Connection arrows overlay — only between snapped pairs */}
          {canvasSize.w > 0 && getConnections(positions).length > 0 && (
            <View style={styles.labelsOverlay}>
              {getConnections(positions).map((conn, ci) => {
                const fromPos = positions[conn.from] || [0, 0, 0];
                const toPos = positions[conn.to] || [0, 0, 0];
                const fromSx = canvasSize.w / 2 + (fromPos[0] - cameraPos.x) * zoom;
                const fromSy = canvasSize.h / 2 - (fromPos[1] - cameraPos.y) * zoom;
                const toSx = canvasSize.w / 2 + (toPos[0] - cameraPos.x) * zoom;
                const toSy = canvasSize.h / 2 - (toPos[1] - cameraPos.y) * zoom;
                const midX = (fromSx + toSx) / 2;
                const midY = (fromSy + toSy) / 2;
                const icon = conn.axis === 'x'
                  ? (toSx > fromSx ? 'chevron-right' : 'chevron-left')
                  : (toSy > fromSy ? 'chevron-down' : 'chevron-up');
                return (
                  <View
                    key={`conn-${ci}`}
                    style={[
                      styles.connArrow,
                      { left: midX - 12, top: midY - 12 },
                    ]}
                  >
                    <MaterialCommunityIcons name={icon} size={20} color="#FFF" />
                  </View>
                );
              })}
            </View>
          )}

          {/* Hint */}
          <View style={styles.hintBar}>
            <MaterialCommunityIcons name="gesture-tap-hold" size={16} color={colors.textMuted} />
            <PaperText style={styles.hintText}>Drag pieces • Drag background to pan • Use +/- to zoom</PaperText>
          </View>

          {/* Onboarding Overlay */}
          {showOnboarding && (
            <Pressable
              style={styles.onboardingOverlay}
              onPress={() => setShowOnboarding(false)}
            >
              <View style={styles.onboardingCard}>
                <MaterialCommunityIcons name="gesture-swipe" size={48} color={colors.primary} />
                <PaperText style={styles.onboardingTitle}>Canvas Controls</PaperText>
                <View style={styles.onboardingList}>
                  <View style={styles.onboardingItem}>
                    <MaterialCommunityIcons name="gesture-tap" size={20} color={colors.gameAccent} />
                    <PaperText style={styles.onboardingText}>Tap & drag pieces to move</PaperText>
                  </View>
                  <View style={styles.onboardingItem}>
                    <MaterialCommunityIcons name="gesture-swipe" size={20} color={colors.gameAccent} />
                    <PaperText style={styles.onboardingText}>Drag empty space to pan canvas</PaperText>
                  </View>
                  <View style={styles.onboardingItem}>
                    <MaterialCommunityIcons name="magnify-plus-outline" size={20} color={colors.gameAccent} />
                    <PaperText style={styles.onboardingText}>Use +/- buttons to zoom</PaperText>
                  </View>
                </View>
                <PaperText style={styles.onboardingDismiss}>Tap anywhere to start</PaperText>
              </View>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gameBg },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingTop: spacing.md, paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.gameSurface,
    borderBottomWidth: 1, borderBottomColor: colors.gameBorder,
    gap: spacing.sm,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1, marginLeft: spacing.xs },
  headerTitle: { ...typography.h3, color: '#FFF' },
  headerSub: { ...typography.caption, color: colors.textMuted, marginTop: 1 },
  arrangeBtn: {
    width: 36, height: 36, borderRadius: radius.md,
    backgroundColor: colors.accent + '15', alignItems: 'center', justifyContent: 'center',
  },
  doneBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  doneBtnText: { ...typography.bodyBold, color: '#FFF' },
  canvasContainer: { flex: 1 },
  labelsOverlay: {
    ...StyleSheet.absoluteFillObject,
    pointerEvents: 'none',
    zIndex: 10,
  },
  pieceLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  stepBadge: {
    position: 'absolute',
    top: 4,
    left: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  connArrow: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieceName: {
    ...typography.micro,
    color: '#FFF',
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pieceCat: {
    ...typography.caption,
    fontSize: 9,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  hintBar: {
    position: 'absolute', bottom: 24, alignSelf: 'center',
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    backgroundColor: colors.gameSurface,
    paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  hintText: { ...typography.caption, color: colors.textMuted },
  onboardingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  onboardingCard: {
    backgroundColor: colors.gameSurface,
    borderRadius: radius.xl,
    padding: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
    maxWidth: 320,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  onboardingTitle: {
    ...typography.h2,
    color: '#FFF',
  },
  onboardingList: {
    gap: spacing.md,
    width: '100%',
  },
  onboardingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  onboardingText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  onboardingDismiss: {
    ...typography.caption,
    color: colors.primary,
    marginTop: spacing.md,
  },
  emptyState: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: spacing.xxxl, gap: spacing.sm,
  },
  emptyTitle: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.md },
  emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', maxWidth: 260 },
  emptyBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl, paddingVertical: spacing.md,
    borderRadius: radius.md, marginTop: spacing.md,
  },
  emptyBtnText: { ...typography.bodyBold, color: '#FFF' },
});
