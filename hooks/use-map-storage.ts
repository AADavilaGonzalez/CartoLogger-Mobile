
import { useSQLiteContext } from 'expo-sqlite';
import * as api from '@/storage/api';
import { CreateMapDTO, MapDTO, FeatureDTO } from '@/storage/types';

export function useMapStorage() {
  const db = useSQLiteContext();

  return {
    createMap: (map: CreateMapDTO) => api.createMap(db, map),
    getMaps: () => api.getMaps(db),
    setMap: (map: MapDTO) => api.setMap(db, map),
    deleteMap: (id: number) => api.deleteMap(db, id),
    getMapData: (id: number) => api.getMapData(db, id),
    saveMapData: (id: number, features: FeatureDTO[]) => api.saveMapData(db, id, features),
  };
}
