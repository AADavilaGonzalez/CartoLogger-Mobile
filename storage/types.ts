import { LatLng } from "react-native-maps";

export type CreateMapDTO = {
  title: string,
}

export type MapDTO = CreateMapDTO & { id: number }

type MarkerDTO = {
  type: "marker",
  desc: string,
  coords: LatLng
};

type PolylineDTO = {
  type: "polyline",
  desc: string,
  coords: LatLng[]
};

type PolygonDTO = {
  type: "polygon"
  desc: string,
  coords: LatLng[]
};

export type FeatureDTO = MarkerDTO | PolylineDTO | PolygonDTO;
