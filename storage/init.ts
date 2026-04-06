import { SQLiteDatabase } from "expo-sqlite";

export const dbName = "user_maps.db";

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
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
  `);
};

