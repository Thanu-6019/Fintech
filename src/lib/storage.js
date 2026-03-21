const DB_KEY = "fintech_ai_users";

const hasBridgeStorage =
  typeof window !== "undefined" &&
  window.storage &&
  typeof window.storage.get === "function" &&
  typeof window.storage.set === "function";

async function kvGet(key) {
  if (hasBridgeStorage) return window.storage.get(key);
  if (typeof window === "undefined" || !window.localStorage) return null;
  const value = window.localStorage.getItem(key);
  return value == null ? null : { value };
}

async function kvSet(key, value) {
  if (hasBridgeStorage) return window.storage.set(key, value);
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(key, value);
}

export async function dbGetUsers() {
  try {
    const r = await kvGet(DB_KEY);
    return r ? JSON.parse(r.value) : {};
  } catch {
    return {};
  }
}

export async function dbSaveUsers(users) {
  try {
    await kvSet(DB_KEY, JSON.stringify(users));
  } catch {}
}

/** Simple deterministic hash — no external crypto dependency needed */
export function hashPassword(pw) {
  let h = 5381;
  for (let i = 0; i < pw.length; i++) h = ((h << 5) + h) ^ pw.charCodeAt(i);
  return (h >>> 0).toString(16);
}

const USER_DATA_PREFIX = "data_";

export async function loadUserData(userId) {
  try {
    const r = await kvGet(`${USER_DATA_PREFIX}${userId}`);
    return r ? JSON.parse(r.value) : { bills: [], simulations: [] };
  } catch {
    return { bills: [], simulations: [] };
  }
}

export async function saveUserData(userId, data) {
  try {
    await kvSet(`${USER_DATA_PREFIX}${userId}`, JSON.stringify(data));
  } catch {}
}
