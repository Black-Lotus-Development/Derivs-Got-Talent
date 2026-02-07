export const BLOCKS = [
  {
    id: 'rsi-gate',
    name: 'RSI Momentum',
    category: 'entry',
    icon: 'chart-bell-curve-cumulative',
    description: 'A classic move! Enter the stage when momentum shifts.',
    params: { threshold: 30 },
  },
  {
    id: 'ma-cross',
    name: 'Signal Cross',
    category: 'entry',
    icon: 'chart-line-variant',
    description: 'Wait for the perfect intersection before you debut.',
    params: { fast: 9, slow: 21 },
  },
  {
    id: 'macd-signal',
    name: 'Trend Diver',
    category: 'entry',
    icon: 'waves',
    description: 'Dive into the trend when the signals diverge.',
    params: { fast: 12, slow: 26, signal: 9 },
  },
  {
    id: 'stop-loss',
    name: 'Safety Net',
    category: 'defense',
    icon: 'shield-off-outline',
    description: 'Keep your routine safe by exiting at a set threshold.',
    params: { percentage: 2 },
  },
  {
    id: 'take-profit',
    name: 'Standing Ovation',
    category: 'defense',
    icon: 'star-circle',
    description: 'Lock in your score when you hit your target gain!',
    params: { percentage: 5 },
  },
  {
    id: 'trailing-stop',
    name: 'Spotlight Follower',
    category: 'defense',
    icon: 'shield-sync-outline',
    description: 'Stay in the spotlight, but keep a safety net behind you.',
    params: { percentage: 3 },
  },
  {
    id: 'position-size',
    name: 'Stage Manager',
    category: 'sizing',
    icon: 'resize',
    description: 'Decide how much of the stage you want to own.',
    params: { percentage: 10 },
  },
];

export const BLOCK_CATEGORIES = {
  entry: { label: 'Inbound Moves', icon: 'login' },
  defense: { label: 'Safety Nets', icon: 'shield-heart' },
  sizing: { label: 'Stage Presence', icon: 'resize' },
};
