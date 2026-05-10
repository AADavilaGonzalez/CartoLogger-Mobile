import { SQLiteDatabase } from "expo-sqlite";

export const dbName = "app.db";

function createTables(db:SQLiteDatabase): Promise<void> {
  return db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS maps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_data (
      id INTEGER PRIMARY KEY,
      features TEXT NOT NULL,
      FOREIGN KEY (id) REFERENCES maps(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      setting TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

import { defaultSettings } from "@/storage/api/settings";
function setupDefaults(db: SQLiteDatabase): Promise<void> {
  let query = "";
  for(const [setting, value] of Object.entries(defaultSettings)) {
    query += `
      INSERT INTO settings (setting, value)
      VALUES ('${setting}', '${value}')
      ON CONFLICT(setting) DO NOTHING;
    `;
  }
  return db.execAsync(query)
}

export async function initDb(db: SQLiteDatabase): Promise<void> {
  await createTables(db);
  await setupDefaults(db); 
};

