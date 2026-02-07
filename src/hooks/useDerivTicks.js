/**
 * useDerivTicks Hook
 * Subscribe to real-time tick data from Deriv.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { derivWS } from '../api/deriv/DerivWebSocket';
import DerivSymbols from '../api/deriv/DerivSymbols';
import { DERIV_CONFIG } from '../api/deriv/config';

/**
 * Hook for subscribing to tick stream
 */
export function useDerivTicks(symbol = DERIV_CONFIG.DEFAULTS.SYMBOL) {
    const [tick, setTick] = useState(null);
    const [ticks, setTicks] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function connect() {
            try {
                // Ensure WebSocket is connected
                if (!derivWS.isConnected) {
                    await derivWS.connect();
                }

                if (!isMounted) return;
                setIsConnected(true);

                // Subscribe to ticks
                unsubscribeRef.current = DerivSymbols.subscribeToTicks(symbol, (newTick) => {
                    if (!isMounted) return;

                    setTick(newTick);
                    setTicks(prev => {
                        const updated = [...prev, newTick];
                        // Keep last 100 ticks
                        return updated.slice(-100);
                    });
                });

            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    setIsConnected(false);
                }
            }
        }

        connect();

        // Listen for disconnection
        const unsubDisconnect = derivWS.on('disconnected', () => {
            if (isMounted) setIsConnected(false);
        });

        const unsubConnect = derivWS.on('connected', () => {
            if (isMounted) {
                setIsConnected(true);
                // Resubscribe after reconnection
                connect();
            }
        });

        return () => {
            isMounted = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
            unsubDisconnect();
            unsubConnect();
        };
    }, [symbol]);

    const clearTicks = useCallback(() => {
        setTicks([]);
        setTick(null);
    }, []);

    return {
        tick,
        ticks,
        isConnected,
        error,
        clearTicks,
    };
}

/**
 * Hook for candle (OHLC) stream
 */
export function useDerivCandles(symbol = DERIV_CONFIG.DEFAULTS.SYMBOL, granularity = 60) {
    const [candle, setCandle] = useState(null);
    const [candles, setCandles] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const unsubscribeRef = useRef(null);

    useEffect(() => {
        let isMounted = true;

        async function connect() {
            try {
                if (!derivWS.isConnected) {
                    await derivWS.connect();
                }

                if (!isMounted) return;
                setIsConnected(true);

                // Get initial history
                const history = await DerivSymbols.getCandleHistory(symbol, {
                    count: 50,
                    granularity,
                });

                if (isMounted) {
                    setCandles(history);
                }

                // Subscribe to updates
                unsubscribeRef.current = DerivSymbols.subscribeToCandles(
                    symbol,
                    granularity,
                    (newCandle) => {
                        if (!isMounted) return;

                        setCandle(newCandle);
                        setCandles(prev => {
                            // Update last candle or add new one
                            const updated = [...prev];
                            const lastIndex = updated.length - 1;

                            if (lastIndex >= 0 && updated[lastIndex].epoch === newCandle.epoch) {
                                updated[lastIndex] = newCandle;
                            } else {
                                updated.push(newCandle);
                                if (updated.length > 100) updated.shift();
                            }

                            return updated;
                        });
                    }
                );

            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                    setIsConnected(false);
                }
            }
        }

        connect();

        return () => {
            isMounted = false;
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [symbol, granularity]);

    return {
        candle,
        candles,
        isConnected,
        error,
    };
}

/**
 * Hook to convert ticks to chart-compatible format
 */
export function useDerivChartData(symbol = DERIV_CONFIG.DEFAULTS.SYMBOL) {
    const { ticks, isConnected, error } = useDerivTicks(symbol);

    // Convert to chart format matching current LiveChart expectations
    const chartData = ticks.map(t => ({
        timestamp: t.timestamp,
        open: t.quote,
        high: t.quote,
        low: t.quote,
        close: t.quote,
    }));

    return {
        data: chartData,
        rawTicks: ticks,
        isConnected,
        error,
    };
}

export default useDerivTicks;
