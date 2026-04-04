
import { useSQLiteContext } from 'expo-sqlite';
import * as api from '@/storage/api';
import { CreateMapDTO, FeatureDTO } from '@/storage/types';

export function useMapStorage() {
  const db = useSQLiteContext();

  return {
    createMap: (map: CreateMapDTO) => api.createMap(db, map),
    getMaps: () => api.getMaps(db),
    getMapData: (id: number) => api.getMapData(db, id),
    saveMapData: (id: number, features: FeatureDTO[]) => api.saveMapData(db, id, features),
  };
}
