/**
 * Client-side strategy evaluation engine.
 * Converts block configurations into trading logic.
 */

export function calculateRSI(closes, period = 14) {
  if (closes.length < period + 1) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = closes.length - period; i < closes.length; i++) {
    const delta = closes[i] - closes[i - 1];
    if (delta > 0) gains += delta;
    else losses -= delta;
  }

  const avgGain = gains / period;
  const avgLoss = losses / period;

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

export function calculateSMA(closes, period) {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

export function calculateMACD(closes, fast = 12, slow = 26, signal = 9) {
  if (closes.length < slow + signal) return { macd: 0, signal: 0, histogram: 0 };

  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macdLine = emaFast - emaSlow;

  return { macd: macdLine, signal: 0, histogram: macdLine };
}

function calculateEMA(data, period) {
  if (data.length < period) return data[data.length - 1];

  const k = 2 / (period + 1);
  let ema = data.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < data.length; i++) {
    ema = data[i] * k + ema * (1 - k);
  }

  return ema;
}

export function evaluateEntryConditions(blocks, candles) {
  const closes = candles.map((c) => c.close);
  if (closes.length < 2) return false;

  const entryBlocks = blocks.filter((b) => b.category === 'entry');
  if (entryBlocks.length === 0) return false;

  for (const block of entryBlocks) {
    switch (block.id) {
      case 'rsi-gate': {
        const rsi = calculateRSI(closes);
        if (rsi >= block.params.threshold) return false;
        break;
      }
      case 'ma-cross': {
        const fastMA = calculateSMA(closes, block.params.fast);
        const slowMA = calculateSMA(closes, block.params.slow);
        if (!fastMA || !slowMA || fastMA <= slowMA) return false;
        break;
      }
      case 'macd-signal': {
        const { macd } = calculateMACD(closes, block.params.fast, block.params.slow, block.params.signal);
        if (macd <= 0) return false;
        break;
      }
      default:
        break;
    }
  }

  return true;
}

export function getPositionSize(blocks, balance) {
  const sizingBlock = blocks.find((b) => b.id === 'position-size');
  const pct = sizingBlock ? sizingBlock.params.percentage : 10;
  return balance * (pct / 100);
}

export function checkExitConditions(blocks, entryPrice, currentPrice) {
  const pnlPct = ((currentPrice - entryPrice) / entryPrice) * 100;

  for (const block of blocks) {
    if (block.id === 'stop-loss' && pnlPct <= -block.params.percentage) {
      return { shouldExit: true, reason: 'stop_loss', pnlPct };
    }
    if (block.id === 'take-profit' && pnlPct >= block.params.percentage) {
      return { shouldExit: true, reason: 'take_profit', pnlPct };
    }
    if (block.id === 'trailing-stop') {
      // Simplified trailing stop
      if (pnlPct <= -block.params.percentage) {
        return { shouldExit: true, reason: 'trailing_stop', pnlPct };
      }
    }
  }

  return { shouldExit: false, reason: null, pnlPct };
}
