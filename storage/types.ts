import { LatLng, Region } from "react-native-maps";

export type CreateMapDTO = {
  title: string,
  description: string,
}

export type MapDTO = CreateMapDTO & { id: number }

type MarkerDTO = {
  id?: string,
  type: "marker",
  desc: string,
  coords: LatLng,
  imageUri?: string
};

type PolylineDTO = {
  id?: string,
  type: "polyline",
  desc: string,
  coords: LatLng[],
  imageUri?: string
};

type PolygonDTO = {
  id?: string,
  type: "polygon",
  desc: string,
  coords: LatLng[],
  imageUri?: string
};

export type FeatureDTO = MarkerDTO | PolylineDTO | PolygonDTO;

export type MapDataDTO = {
  region: Region,
  features: FeatureDTO[],
}
