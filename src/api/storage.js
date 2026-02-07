import AsyncStorage from '@react-native-async-storage/async-storage';

const STRATEGIES_KEY = '@deriv_talent_strategies';
const LAST_STRATEGY_KEY = '@deriv_talent_last_strategy';

export async function saveStrategy(strategy) {
  try {
    const existing = await loadAllStrategies();
    const index = existing.findIndex((s) => s.name === strategy.name);
    if (index >= 0) {
      existing[index] = { ...strategy, updatedAt: Date.now() };
    } else {
      existing.push({ ...strategy, createdAt: Date.now(), updatedAt: Date.now() });
    }
    await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(existing));
    await AsyncStorage.setItem(LAST_STRATEGY_KEY, JSON.stringify(strategy));
    return true;
  } catch (e) {
    console.warn('Failed to save strategy:', e);
    return false;
  }
}

export async function loadAllStrategies() {
  try {
    const data = await AsyncStorage.getItem(STRATEGIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.warn('Failed to load strategies:', e);
    return [];
  }
}

export async function loadLastStrategy() {
  try {
    const data = await AsyncStorage.getItem(LAST_STRATEGY_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.warn('Failed to load last strategy:', e);
    return null;
  }
}

export async function deleteStrategy(name) {
  try {
    const existing = await loadAllStrategies();
    const filtered = existing.filter((s) => s.name !== name);
    await AsyncStorage.setItem(STRATEGIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (e) {
    console.warn('Failed to delete strategy:', e);
    return false;
  }
}
