
import { useState, useEffect } from "react";
import { StyleSheet, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, Button, TextInput, useTheme } from "react-native-paper";
import { useLocalSearchParams, useNavigation } from "expo-router";
import MapView, {
  Marker, Polyline, Polygon, LatLng,
  LongPressEvent
} from  "react-native-maps";

import { useMapStorage } from "@/hooks/use-map-storage";
import { FeatureDTO } from "@/storage/types";

export default function Map() {
  const params = useLocalSearchParams();
  const id = parseInt(params.id as string);
  const title = params.title;

  const navigation = useNavigation();
  const storage = useMapStorage();
  const theme = useTheme();

  const [features, setFeatures] = useState<FeatureDTO[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDTO | null>(null);
  const [queue, setQueue] = useState<LatLng[]>([]);
  const [text, setText] = useState("");

  useEffect(()=>{
    navigation.setOptions({title});

    const loadFeatures = async () => {
      setFeatures(await storage.getMapData(id))
    }
    loadFeatures();
  },[id, navigation])

  const pushToQueue = (e: LongPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setQueue([...queue, coords]);
  }

  const popFromQueue = () => { setQueue(queue.slice(0, -1)); }

  const clearQueue = () => { setQueue([]); }

  const buildFeature = () => {
    if(queue.length === 0) { return; }
    if(queue.length === 1) {
      const newFeature: FeatureDTO = {
        type: "marker",
        desc: "",
        coords: queue[0],
      };
      setFeatures([...features, newFeature]);
      clearQueue();
      return;
    }
    if(queue.length <= 3 || !isClosed(queue)) {
      const newFeature: FeatureDTO = {
        type: "polyline",
        desc: "",
        coords: queue 
      };
      setFeatures([...features, newFeature]);
      clearQueue();
      return;
    }
    else {
      const newFeature: FeatureDTO = {
        type: "polygon",
        desc: "",
        coords: queue.slice(0,-1)
      };
      setFeatures([...features, newFeature]);
      clearQueue();
      return;
    }
  }

  const deleteFeature = () => {
    if(selectedFeature === null) { return; }
    setFeatures(features.filter((elem)=> elem !== selectedFeature))
  }

  const selectFeature = (feature: FeatureDTO | null) => {
    if(selectedFeature) { selectedFeature.desc = text; }
    setText(feature?.desc ?? "");
    setSelectedFeature(feature);
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
    <KeyboardAvoidingView style={{flex: 1}} behavior="height">
    <Surface style={styles.mapSurface}>
      <MapView style={styles.map} 
        onPress={()=>selectFeature(null)}  
        onLongPress={pushToQueue}
        userInterfaceStyle={theme.dark ? 'dark' : 'light'}
      >
      {queue.length == 1 && <Marker coordinate={queue[0]}/>}
      {queue.length > 1 && 
        <Polyline
          strokeWidth={4}
          lineCap="round"
          lineJoin="round"
          strokeColor="#FF0000"
          coordinates={queue}/>
      }
      {features.map((feature, idx)=>{
        switch(feature.type) {
          case "marker": 
            return (
              <Marker
                key={idx}
                coordinate={feature.coords}
                onPress={()=>{selectFeature(feature)}}
              />);
          case "polyline":
            return (
              <Polyline
                key={idx}
                coordinates={feature.coords}
                tappable={true}
                onPress={()=>{selectFeature(feature)}}
              />);
          case "polygon":
            return (
              <Polygon
                key={idx}
                coordinates={feature.coords}
                tappable={true}
                onPress={()=>{selectFeature(feature)}}
                fillColor="rgba(255,0,0,0.5)"
              />);
        }
      })}
      </MapView>
    </Surface>
    <Surface style={styles.controlsSurface}>
      <Surface elevation={2} style={styles.controlsRow}>
        <Button style={styles.button} onPress={buildFeature}>Ok</Button>
        <Button style={styles.button} onPress={popFromQueue} onLongPress={clearQueue}>Atras</Button>
        <Button style={styles.button} onPress={deleteFeature}>Borrar</Button>
      </Surface>
      <TextInput
        style={styles.textInput}
        value={text}
        onChangeText={text => setText(text)}
        placeholder="Descripción..."
        multiline={true}
      />
    </Surface>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function distance(p1: LatLng, p2: LatLng): number {
  const dLat = p1.latitude - p2.latitude;
  let dLon = Math.abs(p1.longitude - p2.longitude);
  if(dLon > 180) { dLon = 360 - dLon;}
  return Math.sqrt(dLat*dLat + dLon*dLon);
}

function isClosed(points: LatLng[]): boolean {
  const THRESHOLD = 0.1;
  if(points.length <= 2 ) { return false; }
  let min: LatLng = { 
    latitude: points[0].latitude,
    longitude: points[0].longitude
  };
  let max: LatLng = {
    latitude: points[0].latitude,
    longitude: points[0].longitude
  };
  for(const p of points) {
    min.latitude = Math.min(min.latitude, p.latitude);
    min.longitude = Math.min(min.longitude, p.longitude);
    max.latitude = Math.max(max.latitude, p.latitude);
    max.longitude = Math.max(max.longitude, p.longitude);
  }
  const bboxDiagonal = distance(max, min);
  const gapDiagonal = distance(points[0], points[points.length-1]);
  return gapDiagonal <= THRESHOLD*bboxDiagonal;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-start",
    alignItems: "stretch",
  },
  mapSurface: {
    flex:1,
    margin: 12,
    borderRadius: 12,
    height: "60%",
  },
  map: {
    flex:1,
    borderRadius: 10,
  },
  controlsSurface: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 8,
  },
  controlsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
  },
  button: {
    marginHorizontal: 6,
    minWidth: 80,
  },
  textInput: {
    marginTop: 8,
  }
});
