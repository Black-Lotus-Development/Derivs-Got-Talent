/**
 * Calculates routine performance (Vibe Check) based on trading performance.
 * Maps financial metrics to stage presence and crowd energy levels.
 */
import { colors } from '../theme';

export function calculateVibe(balance, startingBalance = 10000) {
  const drawdown = ((startingBalance - balance) / startingBalance) * 100;
  return Math.max(0, Math.min(100, drawdown));
}

export function getVibeLevel(vibeScore) {
  if (vibeScore <= 0) return 'PERFECT PITCH';
  if (vibeScore <= 10) return 'MINOR STUMBLE';
  if (vibeScore <= 25) return 'LOSING THE BEAT';
  if (vibeScore <= 50) return 'TOUGH CROWD';
  if (vibeScore <= 75) return 'STAGE FRIGHT';
  return 'SHOW STOPPED';
}

export function getVibeFeedback(vibeScore) {
  const feedback = [];

  if (vibeScore > 5) feedback.push({ type: 'style', severity: 'minor', description: 'A little off-key' });
  if (vibeScore > 15) feedback.push({ type: 'energy', severity: 'moderate', description: 'Crowd is getting restless' });
  if (vibeScore > 30) feedback.push({ type: 'presence', severity: 'major', description: 'Spotlight is flickering' });
  if (vibeScore > 50) feedback.push({ type: 'routine', severity: 'severe', description: 'Major performance glitch' });
  if (vibeScore > 70) feedback.push({ type: 'integrity', severity: 'critical', description: 'Judges are checking their watches' });
  if (vibeScore > 90) feedback.push({ type: 'exit', severity: 'destroyed', description: 'Curtain call initiated' });

  return feedback;
}

export function getVibeColor(vibeScore) {
  if (vibeScore <= 10) return colors.success;
  if (vibeScore <= 30) return colors.warning;
  if (vibeScore <= 50) return colors.warning;
  if (vibeScore <= 70) return colors.danger;
  return colors.dangerDark;
}
