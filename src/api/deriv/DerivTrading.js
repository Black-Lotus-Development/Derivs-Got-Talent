/**
 * Deriv Trading API
 * Handles contract proposals, purchases, and portfolio management.
 */

import { derivWS } from './DerivWebSocket';
import { DERIV_CONFIG } from './config';

/**
 * Get available trading symbols
 */
export async function getActiveSymbols(productType = 'basic') {
    const response = await derivWS.send({
        active_symbols: productType,
    });

    return response.active_symbols || [];
}

/**
 * Get price proposal for a contract
 */
export async function getProposal({
    symbol = DERIV_CONFIG.DEFAULTS.SYMBOL,
    contractType = 'CALL',
    duration = DERIV_CONFIG.DEFAULTS.DURATION,
    durationUnit = DERIV_CONFIG.DEFAULTS.DURATION_UNIT,
    amount = DERIV_CONFIG.DEFAULTS.STAKE,
    basis = 'stake',
    currency = DERIV_CONFIG.DEFAULTS.CURRENCY,
}) {
    const response = await derivWS.send({
        proposal: 1,
        amount: String(amount),
        basis,
        contract_type: contractType,
        currency,
        duration,
        duration_unit: durationUnit,
        symbol,
    });

    return response.proposal;
}

/**
 * Subscribe to price proposal updates
 */
export function subscribeToProposal(params, callback) {
    const {
        symbol = DERIV_CONFIG.DEFAULTS.SYMBOL,
        contractType = 'CALL',
        duration = DERIV_CONFIG.DEFAULTS.DURATION,
        durationUnit = DERIV_CONFIG.DEFAULTS.DURATION_UNIT,
        amount = DERIV_CONFIG.DEFAULTS.STAKE,
        basis = 'stake',
        currency = DERIV_CONFIG.DEFAULTS.CURRENCY,
    } = params;

    return derivWS.subscribe({
        proposal: 1,
        amount: String(amount),
        basis,
        contract_type: contractType,
        currency,
        duration,
        duration_unit: durationUnit,
        symbol,
    }, (msg) => {
        if (msg.proposal) {
            callback(msg.proposal);
        }
    });
}

/**
 * Buy a contract using proposal ID
 */
export async function buyContract(proposalId, price) {
    const response = await derivWS.send({
        buy: proposalId,
        price,
    });

    return response.buy;
}

/**
 * Buy a contract directly (without proposal)
 */
export async function buyContractDirect({
    symbol = DERIV_CONFIG.DEFAULTS.SYMBOL,
    contractType = 'CALL',
    duration = DERIV_CONFIG.DEFAULTS.DURATION,
    durationUnit = DERIV_CONFIG.DEFAULTS.DURATION_UNIT,
    amount = DERIV_CONFIG.DEFAULTS.STAKE,
    basis = 'stake',
    currency = DERIV_CONFIG.DEFAULTS.CURRENCY,
}) {
    const response = await derivWS.send({
        buy: 1,
        parameters: {
            amount: String(amount),
            basis,
            contract_type: contractType,
            currency,
            duration,
            duration_unit: durationUnit,
            symbol,
        },
        price: amount * 2, // Max price to ensure execution
    });

    return response.buy;
}

/**
 * Sell an open contract
 */
export async function sellContract(contractId, price = 0) {
    const response = await derivWS.send({
        sell: contractId,
        price,
    });

    return response.sell;
}

/**
 * Get portfolio (open positions)
 */
export async function getPortfolio() {
    const response = await derivWS.send({
        portfolio: 1,
    });

    return response.portfolio?.contracts || [];
}

/**
 * Subscribe to open contract updates
 */
export function subscribeToOpenContracts(callback) {
    return derivWS.subscribe({
        proposal_open_contract: 1,
    }, (msg) => {
        if (msg.proposal_open_contract) {
            callback(msg.proposal_open_contract);
        }
    });
}

/**
 * Get profit table (closed trades)
 */
export async function getProfitTable(options = {}) {
    const {
        limit = 50,
        offset = 0,
        dateFrom,
        dateTo,
    } = options;

    const request = {
        profit_table: 1,
        limit,
        offset,
        description: 1,
        sort: 'DESC',
    };

    if (dateFrom) request.date_from = dateFrom;
    if (dateTo) request.date_to = dateTo;

    const response = await derivWS.send(request);
    return response.profit_table?.transactions || [];
}

/**
 * Get transaction history
 */
export async function getStatement(options = {}) {
    const {
        limit = 50,
        offset = 0,
        actionType = 'all',
    } = options;

    const response = await derivWS.send({
        statement: 1,
        limit,
        offset,
        action_type: actionType,
        description: 1,
    });

    return response.statement?.transactions || [];
}

export default {
    getActiveSymbols,
    getProposal,
    subscribeToProposal,
    buyContract,
    buyContractDirect,
    sellContract,
    getPortfolio,
    subscribeToOpenContracts,
    getProfitTable,
    getStatement,
};
