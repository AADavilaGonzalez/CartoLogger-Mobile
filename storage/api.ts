import { SQLiteDatabase } from "expo-sqlite";

import { CreateMapDTO, MapDTO, FeatureDTO } from "@/storage/types";

export async function createMap(
  db: SQLiteDatabase, map: CreateMapDTO
): Promise<number> {
  let id = -1;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO maps(title) VALUES (?)',
      [map.title]
    );
    id = result.lastInsertRowId;
    await db.runAsync(
      'INSERT INTO map_data(id, features) VALUES (?, ?)',
      [id, "[]"]
    );
  });
  return id;
}

export async function getMaps(db: SQLiteDatabase): Promise<MapDTO[]> {
  return await db.getAllAsync('SELECT * FROM maps') as MapDTO[];
}

export async function getMapData(
  db: SQLiteDatabase, mapId: number
): Promise<FeatureDTO[]> {
  const row: {features: string} | null = await db.getFirstAsync(
    'SELECT features FROM map_data WHERE id=?',
    [mapId]
  );
  if (!row) { throw Error(`Data for Map ID ${mapId} not found`) }
  return JSON.parse(row.features) as FeatureDTO[];
}

export async function saveMapData(
  db: SQLiteDatabase, mapId: number, features: FeatureDTO[]
): Promise<void> {

  const json = JSON.stringify(features);
  await db.runAsync(
    'UPDATE map_data SET features=? WHERE id=?',
    [json, mapId]
  );
}
