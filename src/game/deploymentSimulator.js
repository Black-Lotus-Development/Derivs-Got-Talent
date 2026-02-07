/**
 * Full deployment simulation logic.
 * Used for running complete strategy backtests.
 */
import {
  evaluateEntryConditions,
  getPositionSize,
  checkExitConditions,
} from './strategyEngine';

export function runBacktest(blocks, candles, startingBalance = 10000) {
  const trades = [];
  let balance = startingBalance;
  let position = null;
  let maxBalance = startingBalance;
  let maxDrawdown = 0;

  for (let i = 20; i < candles.length; i++) {
    const windowCandles = candles.slice(Math.max(0, i - 50), i + 1);
    const currentPrice = candles[i].close;

    if (!position) {
      if (evaluateEntryConditions(blocks, windowCandles)) {
        const size = getPositionSize(blocks, balance);
        position = {
          entryPrice: currentPrice,
          size,
          entryIndex: i,
        };
        trades.push({
          action: 'ENTER',
          price: currentPrice,
          size,
          index: i,
          timestamp: candles[i].timestamp,
        });
      }
    } else {
      const { shouldExit, reason, pnlPct } = checkExitConditions(
        blocks,
        position.entryPrice,
        currentPrice
      );

      if (shouldExit) {
        const profit = position.size * (pnlPct / 100);
        balance += profit;
        maxBalance = Math.max(maxBalance, balance);
        const dd = ((maxBalance - balance) / maxBalance) * 100;
        maxDrawdown = Math.max(maxDrawdown, dd);

        trades.push({
          action: 'EXIT',
          reason,
          price: currentPrice,
          pnl: profit,
          pnlPct,
          index: i,
          timestamp: candles[i].timestamp,
        });

        position = null;
      }
    }
  }

  const wins = trades.filter((t) => t.action === 'EXIT' && t.pnl > 0).length;
  const totalExits = trades.filter((t) => t.action === 'EXIT').length;
  const winRate = totalExits > 0 ? (wins / totalExits) * 100 : 0;
  const totalPnl = balance - startingBalance;

  return {
    trades,
    balance,
    totalPnl,
    tradeCount: totalExits,
    winRate: Math.round(winRate),
    maxDrawdown: Math.round(maxDrawdown * 10) / 10,
    sharpe: calculateSharpe(trades),
  };
}

function calculateSharpe(trades) {
  const returns = trades
    .filter((t) => t.action === 'EXIT')
    .map((t) => t.pnlPct || 0);

  if (returns.length < 2) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return 0;
  return Math.round((mean / stdDev) * 100) / 100;
}
