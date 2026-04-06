import { SQLiteDatabase } from "expo-sqlite";

import {
  CreateMapDTO,
  MapDTO,
  FeatureDTO,
} from "@/storage/types";

export async function createMap(
  db: SQLiteDatabase, map: CreateMapDTO
): Promise<number> {
  let id = -1;
  await db.withTransactionAsync(async () => {
    const result = await db.runAsync(
      'INSERT INTO maps(title,description) VALUES (?,?)',
      [map.title, map.description]
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

export async function setMap(
  db: SQLiteDatabase, map: MapDTO
): Promise<void> {
  const result = await db.runAsync(
    'UPDATE maps SET title=?, description=? WHERE id=?',
    [map.title, map.description, map.id]
  );
  if(!result) { throw Error(`Could not update map with ID ${map.id}`); }
}

export async function deleteMap(
  db: SQLiteDatabase, mapId: number
): Promise<void> {

  const result = await db.runAsync(
    'DELETE FROM maps WHERE id = ?',
    [mapId]
  );
  if(!result) { throw Error(`Could not delete map with ID ${mapId}`); }
}

export async function getMapData(
  db: SQLiteDatabase, mapId: number
): Promise<FeatureDTO[]> {
  const row: {features: string} | null = await db.getFirstAsync(
    'SELECT features FROM map_data WHERE id=?',
    [mapId]
  );
  if (!row) { throw Error(`Data for Map ID ${mapId} not found`); }
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
