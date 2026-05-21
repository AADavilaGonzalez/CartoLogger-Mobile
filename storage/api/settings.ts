import { SQLiteDatabase } from "expo-sqlite";

type SettingsMap = {
  theme: "system" | "light" | "dark",
  useLocation: "true" | "false",
  mapType: "standard" | "satellite" | "hybrid" | "terrain",
  [key: string]: any,
}

export const defaultSettings: SettingsMap = {
  theme: "system",
  useLocation: "true",
  mapType: "standard",
};

async function get<K extends keyof SettingsMap>(
  db: SQLiteDatabase, setting: K
): Promise<SettingsMap[K]> {
  const row: {value: string} | null  = await db.getFirstAsync(
    'SELECT value FROM settings WHERE setting=?',
    [setting]
  );
  if(!row) { throw Error(`Setting '${setting}' not found`); }
  return row.value as SettingsMap[K];
}

async function set<K extends keyof SettingsMap>(
  db: SQLiteDatabase, setting: K, value: SettingsMap[K]
): Promise<void> {
  const result = await db.runAsync(
    'INSERT OR REPLACE INTO settings (setting, value) VALUES (?, ?)',
    [setting, value]
  );
  if(!result) { throw Error(`Could not set setting '${setting}'`); }
}

const api = { get, set };
export default api;
