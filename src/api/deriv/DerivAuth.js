/**
 * Deriv Authentication Module
 * Handles OAuth flow and session management.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { derivWS } from './DerivWebSocket';
import { getOAuthURL } from './config';

const TOKEN_STORAGE_KEY = '@deriv_auth_tokens';

/**
 * Authorize with the API using a token
 */
export async function authorize(token) {
    if (!derivWS.isConnected) {
        await derivWS.connect();
    }

    const response = await derivWS.send({ authorize: token });

    if (response.authorize) {
        await saveTokens([{ token, ...response.authorize }]);
        return response.authorize;
    }

    throw new Error('Authorization failed');
}

/**
 * Get the OAuth login URL
 */
export function getLoginURL() {
    return getOAuthURL();
}

/**
 * Parse OAuth callback URL and extract tokens
 * URL format: ?acct1=XXX&token1=YYY&acct2=ZZZ&token2=WWW...
 */
export function parseOAuthCallback(url) {
    const params = new URLSearchParams(url.split('?')[1] || '');
    const accounts = [];

    let i = 1;
    while (params.has(`acct${i}`) && params.has(`token${i}`)) {
        accounts.push({
            account: params.get(`acct${i}`),
            token: params.get(`token${i}`),
            currency: params.get(`cur${i}`) || 'USD',
        });
        i++;
    }

    return accounts;
}

/**
 * Login using OAuth tokens from callback
 */
export async function loginWithOAuthTokens(accounts) {
    if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found in OAuth callback');
    }

    // Save all accounts
    await saveTokens(accounts);

    // Authorize with first account (usually demo)
    const primaryAccount = accounts[0];
    return authorize(primaryAccount.token);
}

/**
 * Switch to a different account
 */
export async function switchAccount(accountId) {
    const accounts = await getStoredTokens();
    const account = accounts.find(a => a.account === accountId);

    if (!account) {
        throw new Error(`Account ${accountId} not found`);
    }

    return authorize(account.token);
}

/**
 * Logout and clear tokens
 */
export async function logout() {
    await clearTokens();
    derivWS.disconnect();
}

/**
 * Check if user has stored tokens
 */
export async function hasStoredSession() {
    const tokens = await getStoredTokens();
    return tokens.length > 0;
}

/**
 * Attempt to restore session from stored tokens
 */
export async function restoreSession() {
    const accounts = await getStoredTokens();

    if (accounts.length === 0) {
        return null;
    }

    try {
        // Try to authorize with first stored token
        const user = await authorize(accounts[0].token);
        return user;
    } catch (error) {
        console.warn('[DerivAuth] Session restore failed:', error);
        // Clear invalid tokens
        await clearTokens();
        return null;
    }
}

/**
 * Get current balance
 */
export async function getBalance() {
    if (!derivWS.isConnected || !derivWS.authorized) {
        throw new Error('Not authorized');
    }

    const response = await derivWS.send({ balance: 1 });
    return response.balance;
}

/**
 * Subscribe to balance updates
 */
export function subscribeToBalance(callback) {
    return derivWS.subscribe({ balance: 1 }, (msg) => {
        if (msg.balance) {
            callback(msg.balance);
        }
    });
}

// ─── Token Storage ────────────────────────────────────────────────────────────

async function saveTokens(accounts) {
    try {
        await AsyncStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
        console.error('[DerivAuth] Failed to save tokens:', error);
    }
}

async function getStoredTokens() {
    try {
        const data = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('[DerivAuth] Failed to read tokens:', error);
        return [];
    }
}

async function clearTokens() {
    try {
        await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch (error) {
        console.error('[DerivAuth] Failed to clear tokens:', error);
    }
}

export default {
    authorize,
    getLoginURL,
    parseOAuthCallback,
    loginWithOAuthTokens,
    switchAccount,
    logout,
    hasStoredSession,
    restoreSession,
    getBalance,
    subscribeToBalance,
};
