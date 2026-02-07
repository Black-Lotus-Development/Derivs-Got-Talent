import os
import time
import random
from typing import Dict, List

# Try to import anthropic, fall back to local generation
try:
    import anthropic

    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False

ANALYST_PROFILES = {
    "rita": {
        "name": "Judge Rita",
        "style": "supportive, encouraging, focused on safety and style",
        "loves": ["safe routines", "steady progress", "good discipline"],
        "hates": ["risky moves", "big stumbles", "over-exposure"],
    },
    "yang": {
        "name": "Judge Yang",
        "style": "high-energy, bold, aggressive momentum seeker",
        "loves": ["big performances", "flawless execution", "pure energy"],
        "hates": ["playing it too safe", "boring routines", "missed opportunities"],
    },
    "sharpe": {
        "name": "Judge Sharpe",
        "style": "precise, mathematical, focused on technical merit",
        "loves": ["consistency", "high technical scores", "perfect balance"],
        "hates": ["sloppy acts", "unnecessary risks", "deviating from the script"],
    },
}

# Fallback comments when no API key is available
FALLBACK_COMMENTS = {
    "rita": {
        "ENTER": [
            "Ooh, bold entrance! I love the energy!",
            "A classic move. Let's see if you can nail the landing!",
            "Taking the stage with confidence. Show us what you've got!",
        ],
        "EXIT_stop_loss": [
            "A bit of a stumble, but you kept your cool! Safety first!",
            "Ouch! But hey, every star has a bad night. Reset and come back!",
            "The spotlight was a bit bright there. Good job protecting your routine.",
        ],
        "EXIT_take_profit": [
            "Bravo! That was a spectacular finish!",
            "Pure talent! You absolutely owned that performance.",
            "Encore! Encore! A perfectly timed exit.",
        ],
    },
    "yang": {
        "ENTER": [
            "MOMENTUM! POWER! GO GO GO!",
            "THAT'S WHAT I CALL A SHOW-STOPPER!",
            "HERE WE GO! MAXIMUM VIBES INITIATED!",
        ],
        "EXIT_stop_loss": [
            "TOUGH BREAK! BUT THE CROWD STILL LOVES YOU!",
            "TECHNICAL GLITCH! WE'LL FIX IT IN POST!",
            "HEART OF A CHAMPION! YOU'LL CRUSH IT NEXT TIME!",
        ],
        "EXIT_take_profit": [
            "YES! THAT'S A GOLD MEDAL PERFORMANCE!",
            "YOU'RE A NATURAL! PURE ALPHA ENERGY!",
            "FLAWLESS! THE JUDGES ARE GIVING YOU A 10!",
        ],
    },
    "sharpe": {
        "ENTER": [
            "Calculated confidence. A very professional start.",
            "Statistically, that was a brilliant opening. Carry on.",
            "I see the vision. The technical merit is high here.",
        ],
        "EXIT_stop_loss": [
            "A minor setback in the data. Your risk management is commendable.",
            "Safety protocol engaged. You showed great discipline there.",
            "Protecting the routine is part of the talent. Wise choice.",
        ],
        "EXIT_take_profit": [
            "Masterful execution. Your Sharpe ratio is singing!",
            "High technical scores all around. Very well done.",
            "Consistency is your greatest talent. Beautifully handled.",
        ],
    },
}


def _get_client():
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if api_key and HAS_ANTHROPIC:
        return anthropic.Anthropic(api_key=api_key)
    return None


def generate_analyst_feedback_llm(analyst_id: str, event: Dict, context: Dict) -> str:
    """Generate analyst feedback using Claude API."""
    client = _get_client()
    if not client:
        return _generate_fallback_comment(analyst_id, event)

    analyst = ANALYST_PROFILES[analyst_id]
    prompt = f"""You are {analyst['name']}, a judge on the talent show "Deriv's Got Talent", 
monitoring a trading performance.
Your profile: {analyst['style']}

Current Performance Stats:
- Action: {event.get('action', 'HOLD')}
- Price: ${event.get('price', 0):.2f}
- Score: ${context.get('pnl', 0):.2f} Total P&L, {context.get('trade_count', 0)} Acts performed

Generate a short, punchy comment (1-2 sentences) reacting to this execution.
Be expressive, use your defined judge persona, and stick to the talent show metaphor.
No technical jargon like "telemetry" or "drawdown" unless it fits your specific persona's character."""

    try:
        message = client.messages.create(
            model="claude-3-5-sonnet-20240620",
            max_tokens=100,
            messages=[{"role": "user", "content": prompt}],
        )
        return message.content[0].text
    except (anthropic.APIError, anthropic.APIConnectionError, KeyError, IndexError):
        return _generate_fallback_comment(analyst_id, event)


def _generate_fallback_comment(analyst_id: str, event: Dict) -> str:
    """Generate a comment from pre-written options."""
    action = event.get("action", "HOLD")
    reason = event.get("reason", "")

    key = action
    if action == "EXIT" and reason:
        key = f"EXIT_{reason}"

    comments = FALLBACK_COMMENTS.get(analyst_id, {})
    options = comments.get(key, comments.get(action, ["Monitoring market conditions..."]))
    return random.choice(options)


def get_analyst_reactions(event: Dict, context: Dict, use_llm: bool = False) -> List[Dict]:
    """Get reactions from 1-2 randomly selected analysts."""
    analyst_ids = list(ANALYST_PROFILES.keys())
    active = random.sample(analyst_ids, k=random.randint(1, 2))

    comments = []
    for analyst_id in active:
        if use_llm:
            text = generate_analyst_feedback_llm(analyst_id, event, context)
        else:
            text = _generate_fallback_comment(analyst_id, event)

        comments.append(
            {
                "analyst": analyst_id,
                "text": text,
                "timestamp": time.time(),
            }
        )

    return comments
