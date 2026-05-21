import { SQLiteDatabase } from "expo-sqlite";
import { Region } from "react-native-maps";

import {
  CreateMapDTO,
  MapDTO,
  FeatureDTO,
  MapDataDTO,
} from "@/storage/types";

const defaultRegion: Region = {
  latitude: 0,
  longitude: 0,
  latitudeDelta: 0.09,
  longitudeDelta: 0.09,
}
const defaultRegionJSON = JSON.stringify(defaultRegion);

async function create(
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
      'INSERT INTO map_data(id, region, features) VALUES (?, ?, ?)',
      [id, defaultRegionJSON, "[]"]
    );
  });
  return id;
}

async function getAll(db: SQLiteDatabase): Promise<MapDTO[]> {
  return await db.getAllAsync('SELECT * FROM maps') as MapDTO[];
}

async function set(
  db: SQLiteDatabase, map: MapDTO
): Promise<void> {
  const result = await db.runAsync(
    'UPDATE maps SET title=?, description=? WHERE id=?',
    [map.title, map.description, map.id]
  );
  if(!result) { throw Error(`Could not update map with ID ${map.id}`); }
}

async function deleteMap(
  db: SQLiteDatabase, mapId: number
): Promise<void> {
  const result = await db.runAsync(
    'DELETE FROM maps WHERE id = ?',
    [mapId]
  );
  if(!result) { throw Error(`Could not delete map with ID ${mapId}`); }
}

async function getData(
  db: SQLiteDatabase, mapId: number
): Promise<MapDataDTO> {
  const row: {
    region: string,
    features: string
  } | null = await db.getFirstAsync(
    'SELECT region, features FROM map_data WHERE id=?',
    [mapId]
  );
  if (!row) { throw Error(`Data for Map ID ${mapId} not found`); }
  return {
    region: JSON.parse(row.region),
    features: JSON.parse(row.features),
  };
}

async function setFeatures(
  db: SQLiteDatabase, mapId: number, features: FeatureDTO[]
): Promise<void> {
  const json = JSON.stringify(features);
  const result = await db.runAsync(
    'UPDATE map_data SET features=? WHERE id=?',
    [json, mapId]
  );
  if(!result) {
    throw Error(`Could not update features on map with ID ${mapId}`);
  }
}

async function setRegion(
  db: SQLiteDatabase, mapId: number, region: Region
): Promise<void> {
  const json = JSON.stringify(region);
  const result = await db.runAsync(
    'UPDATE map_data SET region=? WHERE id=?',
    [json, mapId]
  );
  if(!result) {
    throw Error(`Could not update region on map with ID ${mapId}`);
  }
}

async function get(
  db: SQLiteDatabase, mapId: number
): Promise<MapDTO | null> {
  return await db.getFirstAsync(
    'SELECT * FROM maps WHERE id = ?',
    [mapId]
  ) as MapDTO | null;
}

const api = {
  create, getAll, get, set, delete: deleteMap,
  getData, setFeatures, setRegion
};
export default api;
