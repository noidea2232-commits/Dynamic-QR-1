import { Client, Batch, Card, ActivityLog } from '../types';

const STORAGE_KEYS = {
  CLIENTS: 'cardsync_clients',
  BATCHES: 'cardsync_batches',
  CARDS: 'cardsync_cards',
  ACTIVITY: 'cardsync_activity',
  AUTH: 'cardsync_auth_user',
  SETTINGS: 'cardsync_settings',
};

// In-memory fallback if localStorage is unavailable
const memoryStore: Record<string, string> = {};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(key) : memoryStore[key];
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    const serialized = JSON.stringify(value);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, serialized);
    }
    memoryStore[key] = serialized;
  } catch (err) {
    console.warn(`Error saving ${key} to storage:`, err);
  }
}

export const db = {
  getClients(): Client[] {
    return getItem<Client[]>(STORAGE_KEYS.CLIENTS, []);
  },

  saveClients(clients: Client[]): void {
    setItem(STORAGE_KEYS.CLIENTS, clients);
  },

  getBatches(): Batch[] {
    return getItem<Batch[]>(STORAGE_KEYS.BATCHES, []);
  },

  saveBatches(batches: Batch[]): void {
    setItem(STORAGE_KEYS.BATCHES, batches);
  },

  getCards(): Card[] {
    return getItem<Card[]>(STORAGE_KEYS.CARDS, []);
  },

  saveCards(cards: Card[]): void {
    setItem(STORAGE_KEYS.CARDS, cards);
  },

  getActivity(): ActivityLog[] {
    return getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, []);
  },

  logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const logs = this.getActivity();
    const newLog: ActivityLog = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ...activity,
    };
    this.saveActivity([newLog, ...logs].slice(0, 50));
  },

  saveActivity(logs: ActivityLog[]): void {
    setItem(STORAGE_KEYS.ACTIVITY, logs);
  },

  resetToDefaults(): void {
    setItem(STORAGE_KEYS.CLIENTS, []);
    setItem(STORAGE_KEYS.BATCHES, []);
    setItem(STORAGE_KEYS.CARDS, []);
    setItem(STORAGE_KEYS.ACTIVITY, []);
  },
};
