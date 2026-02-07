import asyncio
import json
import os
import time
import random

import numpy as np
import pandas as pd
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from strategy_engine import StrategyEngine
from analyst_system import get_analyst_reactions

load_dotenv()

app = FastAPI(title="Deriv's Got Talent - Deployment Telemetry Server")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Try to import ccxt for live data, fall back to simulation
try:
    import ccxt

    exchange = ccxt.binance()
    HAS_EXCHANGE = True
except ImportError:
    HAS_EXCHANGE = False


def generate_simulated_candle(base_price: float, tick: int) -> dict:
    """Generate a simulated OHLCV candle."""
    volatility = 0.003
    trend = np.sin(tick / 20) * 0.001
    change = (random.random() - 0.5) * 2 * volatility + trend

    open_price = base_price
    close_price = open_price * (1 + change)
    high = max(open_price, close_price) * (1 + random.random() * volatility)
    low = min(open_price, close_price) * (1 - random.random() * volatility)

    return {
        "timestamp": int(time.time() * 1000),
        "open": round(open_price, 2),
        "high": round(high, 2),
        "low": round(low, 2),
        "close": round(close_price, 2),
        "volume": round(random.random() * 1000, 2),
    }


async def fetch_market_data() -> pd.DataFrame:
    """Fetch market data from exchange or simulate."""
    if HAS_EXCHANGE:
        try:
            ohlcv = exchange.fetch_ohlcv("BTC/USDT", "1m", limit=50)
            df = pd.DataFrame(
                ohlcv, columns=["timestamp", "open", "high", "low", "close", "volume"]
            )
            df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
            df.set_index("timestamp", inplace=True)
            return df
        except Exception:
            pass

    # Fallback to simulated data
    return None


@app.get("/health")
async def health():
    return {"status": "ok", "exchange_available": HAS_EXCHANGE}


@app.websocket("/deployment")
async def deployment_websocket(websocket: WebSocket):
    await websocket.accept()

    try:
        data = await websocket.receive_text()
        config = json.loads(data)
    except (json.JSONDecodeError, WebSocketDisconnect):
        await websocket.close()
        return

    blocks = config.get("strategy", {}).get("blocks", [])
    strategy_name = config.get("strategy", {}).get("name", "Unknown")
    strategy = StrategyEngine(blocks)

    balance = 10000.0
    max_balance = balance
    base_price = 65000 + random.random() * 5000
    tick = 0

    use_llm = bool(os.environ.get("ANTHROPIC_API_KEY"))

    # Generate initial history
    candle_history = []
    for _ in range(30):
        candle = generate_simulated_candle(base_price, tick)
        base_price = candle["close"]
        tick += 1
        candle_history.append(candle)

    try:
        while True:
            # Try live data first
            df = await fetch_market_data()

            if df is None:
                # Use simulated data
                candle = generate_simulated_candle(base_price, tick)
                base_price = candle["close"]
                tick += 1
                candle_history.append(candle)
                if len(candle_history) > 50:
                    candle_history = candle_history[-50:]

                df = pd.DataFrame(candle_history)
                df["timestamp"] = pd.to_datetime(df["timestamp"], unit="ms")
                df.set_index("timestamp", inplace=True)

                latest_candle = candle
            else:
                latest_candle = {
                    "timestamp": int(df.index[-1].timestamp() * 1000),
                    "open": float(df["open"].iloc[-1]),
                    "high": float(df["high"].iloc[-1]),
                    "low": float(df["low"].iloc[-1]),
                    "close": float(df["close"].iloc[-1]),
                }

            # Send market update
            await websocket.send_json({"type": "market_update", "data": latest_candle})

            # Execute strategy
            result = strategy.execute_step(df, balance)

            if result["action"] == "EXIT":
                balance += result.get("pnl", 0)
                max_balance = max(max_balance, balance)

            await websocket.send_json({"type": "strategy_action", "data": result})

            # Analyst reactions on trades
            if result["action"] in ("ENTER", "EXIT"):
                context = {
                    "pnl": strategy.pnl,
                    "trade_count": strategy.trade_count,
                    "balance": balance,
                }
                comments = get_analyst_reactions(result, context, use_llm=use_llm)

                for comment in comments:
                    await websocket.send_json({"type": "analyst_comment", "data": comment})
                    await asyncio.sleep(0.5)

            # Damage calculation
            drawdown = ((max_balance - balance) / max_balance) * 100
            damage = max(0, drawdown)

            await websocket.send_json(
                {"type": "damage_update", "data": {strategy_name: damage}}
            )

            # Status update
            await websocket.send_json(
                {
                    "type": "status_update",
                    "data": {
                        "name": strategy_name,
                        "pnl": strategy.pnl,
                        "tradeCount": strategy.trade_count,
                        "balance": balance,
                    },
                }
            )

            await asyncio.sleep(5)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        try:
            await websocket.close()
        except Exception:
            pass


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
