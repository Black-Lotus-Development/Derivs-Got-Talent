/**
 * Deriv Authentication Context
 * Provides auth state and actions throughout the app.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import DerivAuth from '../api/deriv/DerivAuth';
import { derivWS } from '../api/deriv/DerivWebSocket';

const DerivAuthContext = createContext(null);

export function DerivAuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [balance, setBalance] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Connection state
    const [isConnected, setIsConnected] = useState(false);

    // Initialize - try to restore session
    useEffect(() => {
        let unsubBalance = null;

        async function init() {
            try {
                // Listen for connection events
                derivWS.on('connected', () => setIsConnected(true));
                derivWS.on('disconnected', () => setIsConnected(false));

                // Try to restore existing session
                const restoredUser = await DerivAuth.restoreSession();
                if (restoredUser) {
                    setUser(restoredUser);
                    // Subscribe to balance updates
                    unsubBalance = DerivAuth.subscribeToBalance((bal) => {
                        setBalance(bal);
                    });
                }
            } catch (err) {
                console.warn('[DerivAuthContext] Init error:', err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        }

        init();

        return () => {
            if (unsubBalance) unsubBalance();
        };
    }, []);

    /**
     * Get OAuth login URL
     */
    const getLoginURL = useCallback(() => {
        return DerivAuth.getLoginURL();
    }, []);

    /**
     * Handle OAuth callback with tokens
     */
    const handleOAuthCallback = useCallback(async (url) => {
        setIsLoading(true);
        setError(null);

        try {
            const parsedAccounts = DerivAuth.parseOAuthCallback(url);
            setAccounts(parsedAccounts);

            const authorizedUser = await DerivAuth.loginWithOAuthTokens(parsedAccounts);
            setUser(authorizedUser);

            // Get initial balance
            const bal = await DerivAuth.getBalance();
            setBalance(bal);

            return authorizedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Login with existing token
     */
    const loginWithToken = useCallback(async (token) => {
        setIsLoading(true);
        setError(null);

        try {
            const authorizedUser = await DerivAuth.authorize(token);
            setUser(authorizedUser);

            const bal = await DerivAuth.getBalance();
            setBalance(bal);

            return authorizedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Switch to different account
     */
    const switchAccount = useCallback(async (accountId) => {
        setIsLoading(true);
        setError(null);

        try {
            const authorizedUser = await DerivAuth.switchAccount(accountId);
            setUser(authorizedUser);

            const bal = await DerivAuth.getBalance();
            setBalance(bal);

            return authorizedUser;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Logout
     */
    const logout = useCallback(async () => {
        await DerivAuth.logout();
        setUser(null);
        setBalance(null);
        setAccounts([]);
        setIsConnected(false);
    }, []);

    const value = {
        // State
        user,
        balance,
        accounts,
        isLoading,
        error,
        isConnected,
        isAuthenticated: !!user,
        isDemo: user?.is_virtual === 1,

        // Actions
        getLoginURL,
        handleOAuthCallback,
        loginWithToken,
        switchAccount,
        logout,
    };

    return (
        <DerivAuthContext.Provider value={value}>
            {children}
        </DerivAuthContext.Provider>
    );
}

/**
 * Hook to access Deriv auth context
 */
export function useDerivAuth() {
    const context = useContext(DerivAuthContext);
    if (!context) {
        throw new Error('useDerivAuth must be used within DerivAuthProvider');
    }
    return context;
}

export default DerivAuthContext;
