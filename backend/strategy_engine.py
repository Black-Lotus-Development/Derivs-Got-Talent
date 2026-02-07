from typing import List, Dict, Optional, Tuple
import pandas as pd
import numpy as np


class StrategyEngine:
    def __init__(self, blocks: List[Dict]):
        self.blocks = blocks
        self.positions: List[Dict] = []
        self.pnl: float = 0
        self.trade_count: int = 0

    def should_enter(self, market_data: pd.DataFrame) -> bool:
        """Check all entry conditions."""
        entry_blocks = [b for b in self.blocks if b.get("category") == "entry"]
        if not entry_blocks:
            return False

        for block in entry_blocks:
            block_id = block.get("id", "")
            params = block.get("params", {})

            if block_id == "rsi-gate":
                rsi = self._calculate_rsi(market_data)
                if rsi > params.get("threshold", 30):
                    return False

            elif block_id == "ma-cross":
                fast = params.get("fast", 9)
                slow = params.get("slow", 21)
                fast_ma = market_data["close"].rolling(fast).mean()
                slow_ma = market_data["close"].rolling(slow).mean()
                if fast_ma.iloc[-1] <= slow_ma.iloc[-1]:
                    return False

            elif block_id == "macd-signal":
                fast = params.get("fast", 12)
                slow = params.get("slow", 26)
                fast_ema = market_data["close"].ewm(span=fast).mean()
                slow_ema = market_data["close"].ewm(span=slow).mean()
                macd = fast_ema.iloc[-1] - slow_ema.iloc[-1]
                if macd <= 0:
                    return False

        return True

    def calculate_position_size(self, balance: float) -> float:
        """Get position size from Treasury Vault block."""
        for block in self.blocks:
            if block.get("id") == "position-size":
                pct = block.get("params", {}).get("percentage", 10)
                return balance * (pct / 100)
        return balance * 0.1

    def check_exit_conditions(
        self, entry_price: float, current_price: float
    ) -> Tuple[bool, Optional[str], float]:
        """Check Stop-Loss Tower, Profit Beacon, and Guardian Moat."""
        pnl_pct = ((current_price - entry_price) / entry_price) * 100

        for block in self.blocks:
            block_id = block.get("id", "")
            params = block.get("params", {})

            if block_id == "stop-loss":
                if pnl_pct <= -params.get("percentage", 2):
                    return True, "stop_loss", pnl_pct

            elif block_id == "take-profit":
                if pnl_pct >= params.get("percentage", 5):
                    return True, "take_profit", pnl_pct

            elif block_id == "trailing-stop":
                if pnl_pct <= -params.get("percentage", 3):
                    return True, "trailing_stop", pnl_pct

        return False, None, pnl_pct

    def execute_step(self, market_data: pd.DataFrame, balance: float) -> Dict:
        """Execute one trading step."""
        if len(market_data) < 2:
            return {"action": "HOLD", "message": "Gathering market intel..."}

        current_price = float(market_data["close"].iloc[-1])

        # Check entry
        if not self.positions and self.should_enter(market_data):
            position_size = self.calculate_position_size(balance)
            self.positions.append(
                {
                    "entry_price": current_price,
                    "size": position_size,
                    "timestamp": str(market_data.index[-1]),
                }
            )
            self.trade_count += 1

            return {
                "action": "ENTER",
                "price": current_price,
                "size": position_size,
                "message": "Gates opened! Entering position...",
            }

        # Check exit
        if self.positions:
            pos = self.positions[0]
            should_exit, reason, pnl_pct = self.check_exit_conditions(
                pos["entry_price"], current_price
            )

            if should_exit:
                profit = pos["size"] * (pnl_pct / 100)
                self.pnl += profit
                self.positions = []

                msg = f"{reason.replace('_', ' ').title()}! P&L: ${profit:.2f}"

                return {
                    "action": "EXIT",
                    "reason": reason,
                    "price": current_price,
                    "pnl": profit,
                    "message": msg,
                }

        return {"action": "HOLD", "message": "Holding strong..."}

    def _calculate_rsi(self, data: pd.DataFrame, period: int = 14) -> float:
        """Calculate RSI indicator."""
        if len(data) < period + 1:
            return 50.0

        delta = data["close"].diff()
        gain = delta.where(delta > 0, 0).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        val = rsi.iloc[-1]

        return float(val) if not np.isnan(val) else 50.0
