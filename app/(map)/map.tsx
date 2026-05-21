
import { useState, useEffect } from "react";
import { StyleSheet, View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Surface, Button, TextInput, useTheme, Modal, Portal, Text } from "react-native-paper";
import { useLocalSearchParams } from "expo-router";
import MapView, {
  Marker, Polyline, Polygon, LatLng,
  LongPressEvent, Region
} from  "react-native-maps";

import { useStorage } from "@/hooks/use-storage";
import { FeatureDTO } from "@/storage/types";

export default function Map() {
  const params = useLocalSearchParams();
  const id = parseInt(params.id as string);
  const title = params.title;

  const storage = useStorage();
  const theme = useTheme();

  const [features, setFeatures] = useState<FeatureDTO[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<FeatureDTO | null>(null);
  const [queue, setQueue] = useState<LatLng[]>([]);

  const [text, setText] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editText, setEditText] = useState("");

  const [region, setRegion] = useState<Region | undefined>(undefined);

  useEffect(()=>{
    const loadFeatures = async () => {
      const data = await storage.maps.getData(id);
      setRegion(data.region) 
      setFeatures(data.features);
    }
    loadFeatures();
  },[id]);

  const pushToQueue = (e: LongPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setQueue([...queue, coords]);
  };

  const popFromQueue = () => { setQueue(queue.slice(0, -1)); };

  const clearQueue = () => { setQueue([]); };

  const buildFeature = () => {
    if(queue.length === 0) { return; }

    let newFeature: FeatureDTO;
    if(queue.length === 1) {
      newFeature = {
        type: "marker",
        desc: "",
        coords: queue[0],
      };
    }
    else if(queue.length <= 3 || !isClosed(queue)) {
      newFeature = {
        type: "polyline",
        desc: "",
        coords: queue 
      };
    }
    else {
      newFeature = {
        type: "polygon",
        desc: "",
        coords: queue.slice(0,-1)
      };
    }

    const newFeatures = [...features, newFeature];
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    clearQueue();
  };

  const deleteFeature = () => {
    if(selectedFeature === null) { return; }
    const newFeatures = features.filter((elem)=> elem !== selectedFeature);
    storage.maps.setFeatures(id, newFeatures);
    setFeatures(newFeatures);
    setText("");
    setSelectedFeature(null);
  };

  const selectFeature = (feature: FeatureDTO | null) => {
    if(selectedFeature) { 
      selectedFeature.desc = text;
      storage.maps.setFeatures(id, features);
    }
    setText(feature?.desc ?? "");
    setSelectedFeature(feature);
  }

  const openEditModal = () => {
    setEditText(text);
    setEditModalVisible(true);
  };

  const saveEditText = () => {
    setText(editText);
    if(selectedFeature) {
      selectedFeature.desc = editText;
      storage.maps.setFeatures(id, features);
    }
    setEditModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
        <View style={{ alignItems: "center" }}>
          <Text variant="displaySmall">{title}</Text>
        </View>
        <Surface style={styles.mapSurface}>
          <MapView style={styles.map} 
            region={region}
            onPress={()=>selectFeature(null)}
            onLongPress={pushToQueue}
            onRegionChangeComplete={(region) => storage.maps.setRegion(id, region)}
            showsUserLocation={true}
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
          <Surface 
            style={styles.descriptionView}
            onTouchEnd={selectedFeature ? openEditModal : undefined}
          >
            <ScrollView style={styles.descriptionScroll}>
              <Text style={styles.descriptionText}>
                {selectedFeature ? (text || "Toca para agregar descripción...") : "No hay feature seleccionado"}
              </Text>
            </ScrollView>
          </Surface>
        </Surface>

      <Portal>
        <Modal 
          visible={editModalVisible} 
          dismissable={false}
          contentContainerStyle={
            [styles.modalContent, { backgroundColor: theme.colors.background }]
        }>
          <Text variant="headlineMedium" style={
            [styles.modalHeading, { color: theme.colors.onBackground }]
          }> Descripción </Text>
          <TextInput
            style={styles.modalTextInput}
            value={editText}
            onChangeText={setEditText}
            placeholder="Descripción..."
            multiline={true}
          />
          <View style={styles.modalButtons}>
            <Button
              onPress={saveEditText}
              mode="contained" style={styles.modalButton}
            >Guardar</Button>
            <Button
              onPress={() => setEditModalVisible(false)}
              mode="outlined" style={styles.modalButton}
            >Cancelar</Button>
          </View>
        </Modal>
      </Portal>
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
    justifyContent: "center",
    alignItems: "stretch",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  mapSurface: {
    flex:3,
    margin: 12,
    borderRadius: 12,
  },
  map: {
    flex:1,
    borderRadius: 10,
  },
  controlsSurface: {
    flex: 1,
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
  descriptionView: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    justifyContent: "flex-start",
  },
  descriptionScroll: {
    flex: 0,
  },
  descriptionText: {
    fontSize: 14,
  },
  modalContent: {
    margin: 20,
    borderRadius: 12,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  modalHeading: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  modalTextInput: {
    width: "100%",
    minHeight: 120,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    minWidth: 100,
  }
});
