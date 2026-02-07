/**
 * useDerivContract Hook
 * Manage contract proposals, purchases, and open positions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { derivWS } from '../api/deriv/DerivWebSocket';
import DerivTrading from '../api/deriv/DerivTrading';
import { DERIV_CONFIG } from '../api/deriv/config';

/**
 * Hook for contract proposal and purchase
 */
export function useDerivContract(options = {}) {
    const {
        symbol = DERIV_CONFIG.DEFAULTS.SYMBOL,
        contractType = 'CALL',
        duration = DERIV_CONFIG.DEFAULTS.DURATION,
        durationUnit = DERIV_CONFIG.DEFAULTS.DURATION_UNIT,
        amount = DERIV_CONFIG.DEFAULTS.STAKE,
        basis = 'stake',
        currency = DERIV_CONFIG.DEFAULTS.CURRENCY,
    } = options;

    const [proposal, setProposal] = useState(null);
    const [contract, setContract] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const unsubscribeRef = useRef(null);

    // Subscribe to proposal updates
    useEffect(() => {
        if (!derivWS.isConnected) return;

        unsubscribeRef.current = DerivTrading.subscribeToProposal({
            symbol,
            contractType,
            duration,
            durationUnit,
            amount,
            basis,
            currency,
        }, (newProposal) => {
            setProposal(newProposal);
        });

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [symbol, contractType, duration, durationUnit, amount, basis, currency]);

    /**
     * Buy the contract
     */
    const buy = useCallback(async () => {
        if (!proposal) {
            throw new Error('No proposal available');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await DerivTrading.buyContract(proposal.id, proposal.ask_price);
            setContract(result);
            return result;
        } catch (err) {
            setError(err.message || err.code);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [proposal]);

    /**
     * Buy contract directly without proposal
     */
    const buyDirect = useCallback(async (overrides = {}) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await DerivTrading.buyContractDirect({
                symbol,
                contractType,
                duration,
                durationUnit,
                amount,
                basis,
                currency,
                ...overrides,
            });
            setContract(result);
            return result;
        } catch (err) {
            setError(err.message || err.code);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [symbol, contractType, duration, durationUnit, amount, basis, currency]);

    /**
     * Sell open contract
     */
    const sell = useCallback(async (price = 0) => {
        if (!contract) {
            throw new Error('No contract to sell');
        }

        setIsLoading(true);
        setError(null);

        try {
            const result = await DerivTrading.sellContract(contract.contract_id, price);
            setContract(null);
            return result;
        } catch (err) {
            setError(err.message || err.code);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [contract]);

    return {
        proposal,
        contract,
        isLoading,
        error,
        buy,
        buyDirect,
        sell,
    };
}

/**
 * Hook for portfolio (open positions)
 */
export function useDerivPortfolio() {
    const [positions, setPositions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const portfolio = await DerivTrading.getPortfolio();
            setPositions(portfolio);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!derivWS.isConnected || !derivWS.authorized) return;

        refresh();

        // Subscribe to open contract updates
        const unsubscribe = DerivTrading.subscribeToOpenContracts((updatedContract) => {
            setPositions(prev => {
                const idx = prev.findIndex(p => p.contract_id === updatedContract.contract_id);
                if (idx >= 0) {
                    const updated = [...prev];
                    if (updatedContract.is_sold || updatedContract.is_expired) {
                        updated.splice(idx, 1);
                    } else {
                        updated[idx] = updatedContract;
                    }
                    return updated;
                }
                return [...prev, updatedContract];
            });
        });

        return () => unsubscribe();
    }, [refresh]);

    return {
        positions,
        isLoading,
        error,
        refresh,
    };
}

/**
 * Hook for trade history
 */
export function useDerivTradeHistory(limit = 20) {
    const [trades, setTrades] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const refresh = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const history = await DerivTrading.getProfitTable({ limit });
            setTrades(history);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [limit]);

    useEffect(() => {
        if (!derivWS.isConnected || !derivWS.authorized) return;
        refresh();
    }, [refresh]);

    return {
        trades,
        isLoading,
        error,
        refresh,
    };
}

export default useDerivContract;
