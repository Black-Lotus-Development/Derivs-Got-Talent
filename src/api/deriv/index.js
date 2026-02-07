/**
 * Deriv API - Main Export
 * Convenience barrel export for all Deriv modules.
 */

export { DERIV_CONFIG, getOAuthURL, OAUTH_SCOPES } from './config';
export { derivWS, default as DerivWebSocket } from './DerivWebSocket';
export { default as DerivAuth } from './DerivAuth';
export { default as DerivTrading } from './DerivTrading';
export { default as DerivSymbols } from './DerivSymbols';
export { default as xmlExporter, exportToDerivBotXML } from './xmlExporter';
export { default as dtraderLinks, getDTraderURL } from './dtraderLinks';
