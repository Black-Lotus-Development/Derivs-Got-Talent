import { useEffect, useRef, useCallback, useState } from 'react';

const DEFAULT_WS_URL = 'ws://localhost:8000/deployment';

/**
 * WebSocket hook for deployment telemetry communication.
 * Falls back to simulated data when no server is available.
 */
export function useDeploymentWebSocket(url = DEFAULT_WS_URL) {
  const wsRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const callbacksRef = useRef({});

  const on = useCallback((event, callback) => {
    callbacksRef.current[event] = callback;
  }, []);

  const emit = useCallback((event, data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, data }));
    }
  }, []);

  const connect = useCallback((strategy) => {
    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        ws.send(JSON.stringify({ strategy }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const callback = callbacksRef.current[message.type];
          if (callback) {
            callback(message.data);
          }
        } catch (e) {
          console.warn('WS parse error:', e);
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
      };
    } catch (e) {
      console.warn('WS connection failed, using simulation:', e);
      setConnected(false);
    }
  }, [url]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnected(false);
  }, []);

  return { connect, disconnect, on, emit, connected };
}

/**
 * Simulated deployment engine for offline/demo mode.
 * Generates market telemetry and analyst feedback.
 */
export class DeploymentSimulator {
  constructor(strategy) {
    this.strategy = strategy;
    this.running = false;
    this.listeners = {};
    this.basePrice = 65000 + Math.random() * 5000;
    this.tick = 0;
    this.balance = 10000;
    this.pnl = 0;
    this.tradeCount = 0;
    this.inPosition = false;
    this.entryPrice = 0;
    this.positionSize = 0;
    this.candles = [];
  }

  on(event, callback) {
    this.listeners[event] = callback;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event](data);
    }
  }

  start() {
    this.running = true;
    this._generateInitialCandles();
    this._tick();
  }

  stop() {
    this.running = false;
    if (this._timeout) clearTimeout(this._timeout);
  }

  _generateInitialCandles() {
    for (let i = 0; i < 20; i++) {
      this.candles.push(this._generateCandle());
    }
    this.emit('market_update_batch', this.candles);
  }

  _generateCandle() {
    const volatility = 0.003;
    const trend = Math.sin(this.tick / 20) * 0.001;
    const change = (Math.random() - 0.5) * 2 * volatility + trend;

    const open = this.basePrice;
    const close = open * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * volatility);

    this.basePrice = close;
    this.tick++;

    return {
      timestamp: Date.now() - (20 - this.tick) * 60000,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
    };
  }

  _tick() {
    if (!this.running) return;

    const candle = this._generateCandle();
    this.candles.push(candle);
    if (this.candles.length > 50) this.candles.shift();

    this.emit('market_update', candle);

    const action = this._evaluateStrategy(candle);
    if (action) {
      this.emit('strategy_action', action);

      if (action.action === 'ENTER' || action.action === 'EXIT') {
        this._generateAnalystFeedback(action);
      }
    }

    const maxBalance = 10000;
    const drawdown = ((maxBalance - this.balance) / maxBalance) * 100;
    const vibeScore = Math.max(0, drawdown);
    this.emit('vibe_update', { [this.strategy.name]: vibeScore });

    this.emit('status_update', {
      name: this.strategy.name,
      pnl: this.pnl,
      tradeCount: this.tradeCount,
      balance: this.balance,
    });

    this._timeout = setTimeout(() => this._tick(), 2000 + Math.random() * 2000);
  }

  _evaluateStrategy(candle) {
    if (!this.strategy.blocks || this.strategy.blocks.length === 0) {
      return { action: 'HOLD', message: 'PIPELINE EMPTY: NO MODULES CONFIGURED' };
    }

    const currentPrice = candle.close;

    if (!this.inPosition) {
      // Simulate entry check based on random + block count (simplified)
      const entryChance = 0.15 + this.strategy.blocks.filter(b => b.category === 'entry').length * 0.05;
      if (Math.random() < entryChance) {
        const sizingBlock = this.strategy.blocks.find(b => b.id === 'position-size');
        const sizePct = sizingBlock ? sizingBlock.params.percentage : 10;
        this.positionSize = this.balance * (sizePct / 100);
        this.entryPrice = currentPrice;
        this.inPosition = true;
        this.tradeCount++;

        return {
          action: 'ENTER',
          price: currentPrice,
          size: this.positionSize,
          message: 'SIGNAL DETECTED: OPENING MARKET POSITION',
        };
      }
    } else {
      const pnlPct = ((currentPrice - this.entryPrice) / this.entryPrice) * 100;

      const stopBlock = this.strategy.blocks.find(b => b.id === 'stop-loss');
      const tpBlock = this.strategy.blocks.find(b => b.id === 'take-profit');

      const stopPct = stopBlock ? stopBlock.params.percentage : 3;
      const tpPct = tpBlock ? tpBlock.params.percentage : 5;

      if (pnlPct <= -stopPct) {
        const profit = this.positionSize * (pnlPct / 100);
        this.pnl += profit;
        this.balance += profit;
        this.inPosition = false;

        return {
          action: 'EXIT',
          reason: 'stop_loss',
          price: currentPrice,
          pnl: profit,
          message: `RISK THRESHOLD BREACHED: STOP-LOSS EXECUTED. P&L: $${profit.toFixed(2)}`,
        };
      }

      if (pnlPct >= tpPct) {
        const profit = this.positionSize * (pnlPct / 100);
        this.pnl += profit;
        this.balance += profit;
        this.inPosition = false;

        return {
          action: 'EXIT',
          reason: 'take_profit',
          price: currentPrice,
          pnl: profit,
          message: `TARGET REACHED: PROFIT TARGET LIQUIDATED. P&L: +$${profit.toFixed(2)}`,
        };
      }
    }

    return { action: 'HOLD', message: 'MONITORING: SCANNING FOR SIGNALS' };
  }

  _generateAnalystFeedback(action) {
    const analysts = ['rita', 'yang', 'sharpe'];
    const selected = analysts.filter(() => Math.random() > 0.4);
    if (selected.length === 0) selected.push(analysts[Math.floor(Math.random() * analysts.length)]);

    const comments = {
      rita: {
        ENTER: [
          "Ooh, bold entrance! I love the energy!",
          "A classic move. Let's see if you can nail the landing!",
          "Taking the stage with confidence. Show us what you've got!",
        ],
        EXIT: action.reason === 'stop_loss'
          ? [
            "A bit of a stumble, but you kept your cool! Safety first!",
            "Ouch! But hey, every star has a bad night. Reset and come back!",
            "The spotlight was a bit bright there. Good job protecting your routine.",
          ]
          : [
            "Bravo! That was a spectacular finish!",
            "Pure talent! You absolutely owned that performance.",
            "Encore! Encore! A perfectly timed exit.",
          ],
      },
      yang: {
        ENTER: [
          "MOMENTUM! POWER! GO GO GO!",
          "THAT'S WHAT I CALL A SHOW-STOPPER!",
          "HERE WE GO! MAXIMUM VIBES INITIATED!",
        ],
        EXIT: action.reason === 'stop_loss'
          ? [
            "TOUGH BREAK! BUT THE CROWD STILL LOVES YOU!",
            "TECHNICAL GLITCH! WE'LL FIX IT IN POST!",
            "HEART OF A CHAMPION! YOU'LL CRUSH IT NEXT TIME!",
          ]
          : [
            "YES! THAT'S A GOLD MEDAL PERFORMANCE!",
            "YOU'RE A NATURAL! PURE ALPHA ENERGY!",
            "FLAWLESS! THE JUDGES ARE GIVING YOU A 10!",
          ],
      },
      sharpe: {
        ENTER: [
          "Calculated confidence. A very professional start.",
          "Statistically, that was a brilliant opening. Carry on.",
          "I see the vision. The technical merit is high here.",
        ],
        EXIT: action.reason === 'stop_loss'
          ? [
            "A minor setback in the data. Your risk management is commendable.",
            "Safety protocol engaged. You showed great discipline there.",
            "Protecting the routine is part of the talent. Wise choice.",
          ]
          : [
            "Masterful execution. Your Sharpe ratio is singing!",
            "High technical scores all around. Very well done.",
            "Consistency is your greatest talent. Beautifully handled.",
          ],
      },
    };

    selected.forEach((analystId, i) => {
      setTimeout(() => {
        const options = comments[analystId]?.[action.action] || ["Interesting move..."];
        const text = options[Math.floor(Math.random() * options.length)];
        this.emit('analyst_comment', {
          analyst: analystId,
          text,
          timestamp: Date.now(),
        });
      }, i * 800);
    });
  }
}
