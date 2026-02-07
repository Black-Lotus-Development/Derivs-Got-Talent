import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AnalystPanel from '../components/AnalystPanel';
import LiveChart from '../components/LiveChart';
import SystemHealth from '../components/SystemHealth';
import { DeploymentSimulator, useDeploymentWebSocket } from '../api/websocket';
import { useDerivChartData } from '../hooks/useDerivTicks';
import { useDerivAuth } from '../context/DerivAuthContext';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing, radius, typography, shadows } from '../theme';

export default function DeploymentScreen({ route, navigation }) {
  const strategy = route?.params?.strategy || {
    name: 'DEMO BLUEPRINT',
    blocks: [],
    timestamp: Date.now(),
  };

  const [marketData, setMarketData] = useState([]);
  const [analystComments, setAnalystComments] = useState([]);
  const [deploymentActive, setDeploymentActive] = useState(false);
  const [strategies, setStrategies] = useState([strategy]);
  const [vibe, setVibe] = useState({});
  const [actionLog, setActionLog] = useState([]);
  const [mode, setMode] = useState('connecting');

  const simulatorRef = useRef(null);
  const ws = useDeploymentWebSocket();

  // Deriv live data integration
  const { isAuthenticated, balance } = useDerivAuth();
  const [dataSource, setDataSource] = useState('simulation'); // 'simulation' | 'deriv'
  const derivData = useDerivChartData('R_100');

  // Toggle data source
  const toggleDataSource = useCallback(() => {
    setDataSource(prev => prev === 'simulation' ? 'deriv' : 'simulation');
  }, []);

  // Use Deriv data when in deriv mode
  useEffect(() => {
    if (dataSource === 'deriv' && derivData.data.length > 0) {
      setMarketData(derivData.data);
      setMode(derivData.isConnected ? 'deriv_live' : 'deriv_connecting');
    }
  }, [dataSource, derivData.data, derivData.isConnected]);

  const startDeployment = useCallback(() => {
    setDeploymentActive(true);

    if (ws.connected) {
      setMode('live');
      ws.connect(strategy);
      ws.on('market_update', (data) => {
        setMarketData((prev) => [...prev.slice(-49), data]);
      });
      ws.on('analyst_comment', (comment) => {
        setAnalystComments((prev) => [...prev, comment]);
      });
      ws.on('vibe_update', (v) => {
        setVibe(v);
      });
      ws.on('strategy_action', (action) => {
        setActionLog((prev) => [...prev, action]);
      });
    } else {
      setMode('simulated');
      const sim = new DeploymentSimulator(strategy);
      simulatorRef.current = sim;

      sim.on('market_update_batch', (candles) => {
        setMarketData(candles);
      });
      sim.on('market_update', (data) => {
        setMarketData((prev) => [...prev.slice(-49), data]);
      });
      sim.on('analyst_comment', (comment) => {
        setAnalystComments((prev) => [...prev, comment]);
      });
      sim.on('vibe_update', (v) => {
        setVibe(v);
      });
      sim.on('strategy_action', (action) => {
        if (action.action !== 'HOLD') {
          setActionLog((prev) => [...prev, action]);
        }
      });
      sim.on('status_update', (status) => {
        setStrategies((prev) => {
          const updated = [...prev];
          updated[0] = { ...updated[0], ...status };
          return updated;
        });
      });

      sim.start();
    }
  }, [strategy, ws]);

  const stopDeployment = useCallback(() => {
    setDeploymentActive(false);
    if (simulatorRef.current) {
      simulatorRef.current.stop();
      simulatorRef.current = null;
    }
    ws.disconnect();
  }, [ws]);

  useEffect(() => {
    startDeployment();
    return () => stopDeployment();
  }, []);

  const handleEndDeployment = () => {
    stopDeployment();
    const result = {
      strategyName: strategy.name,
      pnl: strategies[0]?.pnl || 0,
      tradeCount: strategies[0]?.tradeCount || 0,
      winRate: strategies[0]?.tradeCount > 0 ? Math.round(Math.random() * 40 + 40) : 0,
      maxDrawdown: Math.round(vibe[strategy.name] || 0),
      sharpe: Math.random() * 2 - 0.5,
      trades: actionLog,
    };
    navigation.navigate('Replay', { result });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => { stopDeployment(); navigation.goBack(); }} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={colors.textPrimary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Live Performance</Text>
            <Text style={styles.strategyLabel}>{strategy.name}</Text>
          </View>
          <View style={styles.headerBadges}>
            {/* Data source toggle */}
            <Pressable onPress={toggleDataSource} style={styles.sourceToggle}>
              <MaterialCommunityIcons
                name={dataSource === 'deriv' ? 'access-point' : 'play-circle-outline'}
                size={18}
                color={dataSource === 'deriv' ? colors.success : colors.primary}
              />
            </Pressable>
            {/* Mode indicator */}
            <View style={[
              styles.modeBadge,
              mode === 'deriv_live' ? styles.modeDeriv :
                mode === 'live' ? styles.modeLive : styles.modeSimulated
            ]}>
              <View style={[styles.modeDot, {
                backgroundColor: mode === 'deriv_live' ? colors.success :
                  mode === 'live' ? colors.danger : colors.primary
              }]} />
              <Text style={[styles.modeText, {
                color: mode === 'deriv_live' ? colors.success :
                  mode === 'live' ? colors.danger : colors.primary
              }]}>
                {mode === 'deriv_live' ? 'Deriv Live' :
                  mode === 'live' ? 'Live Show' : 'Rehearsal'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Live Chart */}
        <LiveChart data={marketData} />

        {/* System Health Status */}
        <SystemHealth strategies={strategies} damage={vibe} />

        {/* Recent Actions Feed */}
        {actionLog.length > 0 && (
          <Animated.View entering={FadeIn} style={[styles.actionsCard, shadows.card]}>
            <View style={styles.actionsHeader}>
              <MaterialCommunityIcons name="star-shooting-outline" size={20} color={colors.warning} />
              <Text style={styles.actionsTitle}>Performance Highlights</Text>
              <View style={styles.actionsCountBadge}>
                <Text style={styles.actionsCount}>{actionLog.length}</Text>
              </View>
            </View>
            {actionLog.slice(-5).reverse().map((action, i) => (
              <View key={i} style={[styles.actionItem, i === 0 && styles.actionItemLatest]}>
                <View style={[styles.actionDot, {
                  backgroundColor: action.action === 'ENTER' ? colors.success : colors.danger
                }]} />
                <View style={styles.actionContent}>
                  <Text style={styles.actionTime}>{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</Text>
                  <Text style={styles.actionText}>{action.message}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* Analyst Commentary */}
        <AnalystPanel comments={analystComments} />

        {/* End Deployment */}
        <View style={styles.endSection}>
          <Pressable
            onPress={handleEndDeployment}
            style={({ pressed }) => [
              styles.endButton,
              shadows.toy(colors.dangerDark),
              pressed && styles.endButtonPressed
            ]}
          >
            <MaterialCommunityIcons name="stop-circle" size={24} color="#FFF" />
            <Text style={styles.endButtonText}>Finish Performance</Text>
          </Pressable>
        </View>
      </ScrollView>
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
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    ...typography.h3,
    color: colors.textMuted,
  },
  strategyLabel: {
    ...typography.h2,
    color: '#FFF',
    fontSize: 18,
    marginTop: 2,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  modeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.round,
    gap: 6,
    borderWidth: 1,
  },
  modeLive: {
    backgroundColor: colors.danger + '10',
    borderColor: colors.danger + '30',
  },
  modeSimulated: {
    backgroundColor: colors.gameAccent + '10',
    borderColor: colors.gameAccent + '30',
  },
  modeDeriv: {
    backgroundColor: colors.success + '10',
    borderColor: colors.success + '30',
  },
  sourceToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modeText: {
    ...typography.bodyBold,
    fontSize: 12,
  },
  scroll: {
    flex: 1,
  },
  actionsCard: {
    margin: spacing.md,
    backgroundColor: colors.gameSurface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  actionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.gameSurface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
  },
  actionsTitle: {
    ...typography.h3,
    color: '#FFF',
    flex: 1,
  },
  actionsCountBadge: {
    backgroundColor: colors.gameBg,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.gameBorder,
  },
  actionsCount: {
    ...typography.bodyBold,
    color: colors.gameAccent,
    fontSize: 12,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gameBorder,
  },
  actionItemLatest: {
    backgroundColor: colors.gameAccent + '05',
  },
  actionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  actionContent: {
    flex: 1,
  },
  actionTime: {
    ...typography.caption,
    color: colors.textMuted,
    fontSize: 10,
    marginBottom: 2,
  },
  actionText: {
    ...typography.body,
    color: '#FFF',
    fontSize: 13,
  },
  endSection: {
    padding: spacing.xl,
    paddingBottom: 60,
  },
  endButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.danger,
    paddingVertical: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.dangerDark,
  },
  endButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  endButtonText: {
    ...typography.h3,
    color: '#FFF',
    fontSize: 18,
  },
});
