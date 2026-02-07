/**
 * Deriv Market Symbols
 * Handles symbol information and tick streaming.
 */

import { derivWS } from './DerivWebSocket';
import { DERIV_CONFIG } from './config';

/**
 * Get all active trading symbols
 */
export async function getActiveSymbols(productType = 'basic') {
    const response = await derivWS.send({
        active_symbols: productType,
        product_type: 'basic',
    });

    return response.active_symbols || [];
}

/**
 * Get symbols grouped by market
 */
export async function getSymbolsByMarket() {
    const symbols = await getActiveSymbols();

    const grouped = {};
    symbols.forEach(symbol => {
        const market = symbol.market_display_name;
        if (!grouped[market]) {
            grouped[market] = [];
        }
        grouped[market].push(symbol);
    });

    return grouped;
}

/**
 * Get synthetic indices (most common for demo trading)
 */
export async function getSyntheticSymbols() {
    const symbols = await getActiveSymbols();
    return symbols.filter(s => s.market === 'synthetic_index');
}

/**
 * Subscribe to tick stream for a symbol
 */
export function subscribeToTicks(symbol, callback) {
    return derivWS.subscribe({
        ticks: symbol,
    }, (msg) => {
        if (msg.tick) {
            callback({
                symbol: msg.tick.symbol,
                epoch: msg.tick.epoch,
                quote: msg.tick.quote,
                timestamp: msg.tick.epoch * 1000,
            });
        }
    });
}

/**
 * Subscribe to OHLC candle stream
 */
export function subscribeToCandles(symbol, granularity = 60, callback) {
    return derivWS.subscribe({
        ticks_history: symbol,
        style: 'candles',
        granularity,
        count: 1,
    }, (msg) => {
        if (msg.ohlc) {
            callback({
                symbol: msg.ohlc.symbol,
                epoch: msg.ohlc.epoch,
                open: parseFloat(msg.ohlc.open),
                high: parseFloat(msg.ohlc.high),
                low: parseFloat(msg.ohlc.low),
                close: parseFloat(msg.ohlc.close),
                timestamp: msg.ohlc.epoch * 1000,
            });
        }
    });
}

/**
 * Get tick history for a symbol
 */
export async function getTickHistory(symbol, options = {}) {
    const {
        count = 100,
        end = 'latest',
        style = 'ticks',
    } = options;

    const response = await derivWS.send({
        ticks_history: symbol,
        count,
        end,
        style,
    });

    if (style === 'ticks') {
        const times = response.history?.times || [];
        const prices = response.history?.prices || [];
        return times.map((t, i) => ({
            epoch: t,
            quote: prices[i],
            timestamp: t * 1000,
        }));
    }

    return response.candles || [];
}

/**
 * Get candle (OHLC) history
 */
export async function getCandleHistory(symbol, options = {}) {
    const {
        count = 100,
        granularity = 60, // 1 minute
        end = 'latest',
    } = options;

    const response = await derivWS.send({
        ticks_history: symbol,
        count,
        end,
        style: 'candles',
        granularity,
    });

    return (response.candles || []).map(c => ({
        epoch: c.epoch,
        open: parseFloat(c.open),
        high: parseFloat(c.high),
        low: parseFloat(c.low),
        close: parseFloat(c.close),
        timestamp: c.epoch * 1000,
    }));
}

/**
 * Forget all tick subscriptions
 */
export async function forgetAllTicks() {
    return derivWS.forgetAll('ticks');
}

/**
 * Get symbol display info
 */
export function getSymbolInfo(symbolCode) {
    // Common synthetic indices info
    const synthetics = {
        R_10: { name: 'Volatility 10 Index', pip: 3, minStake: 0.35 },
        R_25: { name: 'Volatility 25 Index', pip: 3, minStake: 0.35 },
        R_50: { name: 'Volatility 50 Index', pip: 4, minStake: 0.35 },
        R_75: { name: 'Volatility 75 Index', pip: 4, minStake: 0.35 },
        R_100: { name: 'Volatility 100 Index', pip: 2, minStake: 0.35 },
    };

    return synthetics[symbolCode] || { name: symbolCode, pip: 2, minStake: 0.35 };
}

export default {
    getActiveSymbols,
    getSymbolsByMarket,
    getSyntheticSymbols,
    subscribeToTicks,
    subscribeToCandles,
    getTickHistory,
    getCandleHistory,
    forgetAllTicks,
    getSymbolInfo,
};
