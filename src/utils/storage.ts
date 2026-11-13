/**
 * Safe localStorage wrapper that handles exceptions in private browsing,
 * restricted iframe environments, or when storage quota is exceeded.
 */

export const STORAGE_KEYS = {
  LANGUAGE: 'floodguard_language',
  MY_UPAZILA: 'floodguard_my_upazila',
  HEALTH_KIT: 'floodguard_health_kit',
  NOTIFICATIONS_ENABLED: 'floodguard_notifications_enabled',
  ALERT_RULES: 'floodguard_alert_rules',
  OPS_NOTIFY: 'floodguard_ops_notify',
  OPS_SUB_TOKEN: 'floodguard_ops_sub_token',
  OPS_CHECKIN_TOKEN: 'floodguard_ops_checkin_token',
} as const;

export function safeGetItem<T>(key: string, defaultValue: T): T {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return defaultValue;
    }
    const item = window.localStorage.getItem(key);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[storage] Could not read localStorage key "${key}":`, err);
    return defaultValue;
  }
}

export function safeSetItem<T>(key: string, value: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[storage] Could not write localStorage key "${key}":`, err);
    return false;
  }
}

export function safeRemoveItem(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.removeItem(key);
    return true;
  } catch (err) {
    console.warn(`[storage] Could not remove localStorage key "${key}":`, err);
    return false;
  }
}
