/**
 * DTrader Deep Link Generator
 * Creates links to open trades in Deriv's DTrader interface.
 */

import { DERIV_CONFIG } from './config';

const DTRADER_BASE_URL = 'https://app.deriv.com/dtrader';

/**
 * Generate DTrader URL for a specific trade setup
 */
export function getDTraderURL(options = {}) {
    const {
        symbol = DERIV_CONFIG.DEFAULTS.SYMBOL,
        contractType = 'rise_fall',
        duration = DERIV_CONFIG.DEFAULTS.DURATION,
        durationUnit = 't',
        stake = DERIV_CONFIG.DEFAULTS.STAKE,
    } = options;

    const params = new URLSearchParams({
        symbol,
        contract_type: contractType,
        duration,
        duration_unit: durationUnit,
        amount: String(stake),
        amount_type: 'stake',
    });

    return `${DTRADER_BASE_URL}?${params.toString()}`;
}

/**
 * Get DTrader URL for Rise/Fall trade
 */
export function getRiseFallURL(symbol, duration, stake) {
    return getDTraderURL({
        symbol,
        contractType: 'rise_fall',
        duration,
        durationUnit: 't',
        stake,
    });
}

/**
 * Get DTrader URL for Higher/Lower trade
 */
export function getHigherLowerURL(symbol, duration, stake, barrier) {
    const params = new URLSearchParams({
        symbol,
        contract_type: 'high_low',
        duration: String(duration),
        duration_unit: 'm',
        amount: String(stake),
        amount_type: 'stake',
        barrier: String(barrier),
    });

    return `${DTRADER_BASE_URL}?${params.toString()}`;
}

/**
 * Get Deriv Bot URL
 */
export function getDerivBotURL() {
    return 'https://bot.deriv.com';
}

/**
 * Get SmartTrader URL
 */
export function getSmartTraderURL(symbol) {
    return `https://smarttrader.deriv.com/trading?market=synthetic_index&symbol=${symbol}`;
}

/**
 * Get account switcher URL
 */
export function getAccountURL() {
    return 'https://app.deriv.com/account/personal-details';
}

/**
 * Get cashier URL for deposits/withdrawals
 */
export function getCashierURL() {
    return 'https://app.deriv.com/cashier';
}

/**
 * Map Arena contract types to DTrader contract types
 */
export function mapContractType(arenaType) {
    const mapping = {
        CALL: 'rise',
        PUT: 'fall',
        CALLE: 'higher',
        PUTE: 'lower',
    };
    return mapping[arenaType] || 'rise_fall';
}

/**
 * Open URL in browser (cross-platform)
 */
export async function openDTrader(options) {
    const url = getDTraderURL(options);

    // For React Native, would use Linking.openURL
    if (typeof window !== 'undefined') {
        window.open(url, '_blank');
    }

    return url;
}

export default {
    getDTraderURL,
    getRiseFallURL,
    getHigherLowerURL,
    getDerivBotURL,
    getSmartTraderURL,
    getAccountURL,
    getCashierURL,
    mapContractType,
    openDTrader,
};
