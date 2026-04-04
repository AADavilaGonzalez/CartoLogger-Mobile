import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { Surface, Text, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { useMapStorage } from "@/hooks/use-map-storage";
import { CreateMapDTO, type MapDTO } from "@/storage/types";

import { MapBubble } from "@/components/map-bubble";
import { AddMapModal } from "@/components/add-map-modal";

export default function Index() {
  const [addMenuVisible, setAddMenuVisible] = useState(false);

  const [isLoaded, setIsLoaded] = useState(false);
  const [maps, setMaps] = useState<MapDTO[]>([]);

  const { getMaps, createMap } = useMapStorage();

  useEffect(() => {
    const loadMaps = async () => {
      setMaps(await getMaps())
      setIsLoaded(true)
    };
    loadMaps();
  }, []);


  const addMap = async (map: CreateMapDTO) => {
    const id = await createMap(map);
    const newMap: MapDTO = {
      id: id,
      title: map.title
    };
    setMaps([...maps, newMap]);
    setAddMenuVisible(false);
  }


  return (
    <SafeAreaView style={{flex: 1}} edges={["bottom"]}>
    <AddMapModal
      visible={addMenuVisible}
      onAccept={addMap}
      onCancel={() => setAddMenuVisible(false)}
    />
    <Surface style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>CartoLogger</Text>
      <Surface style={styles.maps} elevation={2}>
      {
        !isLoaded ?
          <Text>Cargando tus mapas...</Text> 
        :maps.length === 0 ? 
          <Text variant="headlineMedium"> No tienes ningun mapa, intenta agregar uno </Text>
        :maps.map((map) => <MapBubble key={map.id} map={map}/>) 
      }
      </Surface>
      <Surface style={styles.buttons} elevation={2}>
        <Button onPress={()=>setAddMenuVisible(true)}>+</Button>
      </Surface>
    </Surface>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    alignContent: "center",
    borderRadius: 5,
    margin: 5,
  },
  maps: {
    margin: 10,
    padding: 5,
    borderRadius: 10,
    minHeight: "70%",
    minWidth: "90%"
  },
  buttons: {
    margin: 10,
    borderRadius: 10,
  },
  title: {
    marginTop: 10,
  }
});
