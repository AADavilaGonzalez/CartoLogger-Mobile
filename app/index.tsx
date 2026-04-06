import { useState, useEffect } from "react";
import { StyleSheet, FlatList, View } from "react-native";
import { Surface, Text, Button, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { useMapStorage } from "@/hooks/use-map-storage";
import { CreateMapDTO, type MapDTO } from "@/storage/types";

import { MapBubble } from "@/components/map-bubble";
import { MapModal } from "@/components/map-modal";
import { DecisionModal } from "@/components/decision-modal";

export default function Index() {
  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [editMenuVisible, setEditMenuVisible] = useState(false);
  const [deleteMenuVisible, setDeleteMenuVisible] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapDTO | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [maps, setMaps] = useState<MapDTO[]>([]);

  const storage = useMapStorage();

  const router = useRouter();
  const gotoMap = (map: MapDTO) => { 
    router.push({ pathname: "/map", params: map });
  }

  useEffect(() => {
    const loadMaps = async () => {
      setMaps(await storage.getMaps())
      setIsLoaded(true)
    };
    loadMaps();
  }, []);

  const addMap = async (map: CreateMapDTO) => {
    const id = await storage.createMap(map);
    const newMap: MapDTO = {
      id: id,
      title: map.title,
      description: map.description
    };
    setMaps([...maps, newMap]);
    setAddMenuVisible(false);
  }

  const beginEdit = (map: MapDTO) => {
    setSelectedMap(map);
    setEditMenuVisible(true);
  }

  const initEditMenu = () => selectedMap!;

  const editMap = async (map: CreateMapDTO) => {
    if(!selectedMap) { return; }
    Object.assign(selectedMap, map);
    await storage.setMap(selectedMap);
    setMaps([...maps]);
    setEditMenuVisible(false);
  }

  const beginDelete = (map: MapDTO) => {
    setSelectedMap(map);
    setDeleteMenuVisible(true);
  }

  const deleteMap = async () => {
    if(!selectedMap) { return; }
    await storage.deleteMap(selectedMap.id);
    const idx = maps.findIndex((elem)=>elem.id === selectedMap.id);
    setMaps(maps.toSpliced(idx, 1));
    setDeleteMenuVisible(false);
  }

  return (
    <SafeAreaView style={{flex: 1}} edges={["bottom"]}>

    <MapModal
      heading="Agregar Mapa"
      visible={addMenuVisible}
      onAccept={addMap}
      onCancel={()=>setAddMenuVisible(false)}
    />

    <MapModal
      heading="Editar Mapa"
      visible={editMenuVisible}
      onOpen={initEditMenu}
      onAccept={editMap}
      onCancel={()=>setEditMenuVisible(false)}
    />

    <DecisionModal
      heading="Eliminar Mapa?"
      visible={deleteMenuVisible}
      onAccept={deleteMap}
      onCancel={()=>setDeleteMenuVisible(false)}
    />

    <View style={styles.container}>
      <Text variant="displayMedium" style={styles.title}>Mis Mapas</Text>
      <Surface style={styles.maps} elevation={2}>
      {
        !isLoaded ?
          <ActivityIndicator size="large"/>
        : maps.length === 0 ? 
          <Text variant="headlineMedium">No tienes ningun mapa, intenta agregar uno</Text>
        :
          <FlatList
            data={maps}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) =>
              <MapBubble
                map={item}
                onPress={()=>{gotoMap(item)}}
                onEdit={()=>{beginEdit(item)}}
                onLongEdit={()=>{beginDelete(item)}}
              />
            }
          />
      }
      </Surface>
      <Surface style={styles.buttons} elevation={2}>
        <Button onPress={()=>setAddMenuVisible(true)}>+</Button>
      </Surface>
    </View>
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
