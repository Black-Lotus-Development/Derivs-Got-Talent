/**
 * Deriv API Configuration
 * Register your app at: https://api.deriv.com/app-registration/
 */

export const DERIV_CONFIG = {
    // WebSocket endpoint for production
    WS_URL: 'wss://ws.derivws.com/websockets/v3',

    // OAuth authorization endpoint
    OAUTH_URL: 'https://oauth.deriv.com/oauth2/authorize',

    // Application ID - uses demo app_id by default
    APP_ID: process.env.EXPO_PUBLIC_DERIV_APP_ID || '1089',

    // Brand name
    BRAND: 'Deriv',

    // Connection settings
    PING_INTERVAL: 30000, // 30 seconds keepalive
    RECONNECT_DELAYS: [1000, 2000, 5000, 10000, 30000], // Exponential backoff

    // Default symbols for synthetic indices
    DEFAULT_SYMBOLS: {
        VOLATILITY_100: 'R_100',
        VOLATILITY_75: 'R_75',
        VOLATILITY_50: 'R_50',
        VOLATILITY_25: 'R_25',
        VOLATILITY_10: 'R_10',
    },

    // Contract types supported
    CONTRACT_TYPES: {
        RISE: 'CALL',
        FALL: 'PUT',
        HIGHER: 'CALLE',
        LOWER: 'PUTE',
    },

    // Default trading settings
    DEFAULTS: {
        SYMBOL: 'R_100',
        DURATION: 5,
        DURATION_UNIT: 't', // ticks
        STAKE: 1,
        CURRENCY: 'USD',
    },
};

// OAuth scopes needed for full functionality
export const OAUTH_SCOPES = ['read', 'trade', 'trading_information', 'payments'];

// Generate OAuth URL for login
export function getOAuthURL(redirectUri) {
    const params = new URLSearchParams({
        app_id: DERIV_CONFIG.APP_ID,
        l: 'en',
        brand: DERIV_CONFIG.BRAND.toLowerCase(),
    });

    return `${DERIV_CONFIG.OAUTH_URL}?${params.toString()}`;
}
