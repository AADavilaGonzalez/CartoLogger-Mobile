
import { useSQLiteContext, SQLiteDatabase} from 'expo-sqlite';

import maps from '@/storage/api/maps';
import settings from '@/storage/api/settings'

//bind first argument
function bind<Args extends any[], R>(
  db: SQLiteDatabase, 
  func: (db: SQLiteDatabase, ...rest: Args) => R
): (...args: Args) => R {
  return (...args) => func(db, ...args);
}

type DBModule = Record<string, (db: SQLiteDatabase, ...args: any[]) => any>;

//black magic to preserve argument typing info except first arg
type BoundModule<T extends DBModule> = {
  [K in keyof T]: T[K] extends (db: SQLiteDatabase, ...args: infer Args) => infer R
    ? (...args: Args) => R
    : never;
};

function bindAll<T extends DBModule>(db: SQLiteDatabase, module: T): BoundModule<T> {
  return Object.fromEntries(
    Object.entries(module).map(([key, fn]) => [key, bind(db, fn)])
  ) as BoundModule<T>;
}

export function useStorage() {
  const db = useSQLiteContext();
  return {
    maps: bindAll(db, maps),
    settings: bindAll(db, settings),
  };
}
