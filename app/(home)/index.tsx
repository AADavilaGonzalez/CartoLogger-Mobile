import { useState, useCallback } from "react";
import { StyleSheet, FlatList, View, TextInput as RNTextInput } from "react-native";
import { Text, ActivityIndicator, FAB, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useStorage } from "@/hooks/use-storage";
import { CreateMapDTO, type MapDTO } from "@/storage/types";

import { MapBubble } from "@/components/map-bubble";
import { MapModal } from "@/components/map-modal";
import { DecisionModal } from "@/components/decision-modal";

export default function Index() {
  const theme = useTheme();
  const isDark = theme.dark;

  const [addMenuVisible, setAddMenuVisible] = useState(false);
  const [editMenuVisible, setEditMenuVisible] = useState(false);
  const [deleteMenuVisible, setDeleteMenuVisible] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapDTO | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  const [maps, setMaps] = useState<MapDTO[]>([]);
  const [filterText, setFilterText] = useState("");

  const storage = useStorage();
  const router = useRouter();

  const gotoMap = (map: MapDTO) => {
    router.push({ pathname: "/map", params: map as any });
  };

  useFocusEffect(
    useCallback(() => {
      const loadMaps = async () => {
        setMaps(await storage.maps.getAll());
        setIsLoaded(true);
      };
      loadMaps();
    }, [storage])
  );

  const addMap = async (map: CreateMapDTO) => {
    const id = await storage.maps.create(map);
    const newMap: MapDTO = {
      id: id,
      title: map.title,
      description: map.description,
    };
    setMaps([...maps, newMap]);
    setAddMenuVisible(false);
  };

  const beginEdit = (map: MapDTO) => {
    setSelectedMap(map);
    setEditMenuVisible(true);
  };

  const initEditMenu = () => selectedMap!;

  const editMap = async (map: CreateMapDTO) => {
    if (!selectedMap) {
      return;
    }
    Object.assign(selectedMap, map);
    await storage.maps.set(selectedMap);
    setMaps([...maps]);
    setEditMenuVisible(false);
  };

  const beginDelete = (map: MapDTO) => {
    setSelectedMap(map);
    setDeleteMenuVisible(true);
  };

  const deleteMap = async () => {
    if (!selectedMap) {
      return;
    }
    await storage.maps.delete(selectedMap.id);
    const idx = maps.findIndex((elem) => elem.id === selectedMap.id);
    setMaps(maps.toSpliced(idx, 1));
    setDeleteMenuVisible(false);
  };

  const filteredMaps = maps.filter(
    (map) =>
      map.title.toLowerCase().includes(filterText.toLowerCase()) ||
      map.description.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <MapModal
        heading="Agregar Mapa"
        visible={addMenuVisible}
        onAccept={addMap}
        onCancel={() => setAddMenuVisible(false)}
      />

      <MapModal
        heading="Editar Mapa"
        visible={editMenuVisible}
        onOpen={initEditMenu}
        onAccept={editMap}
        onCancel={() => setEditMenuVisible(false)}
      />

      <DecisionModal
        heading="Eliminar Mapa?"
        visible={deleteMenuVisible}
        onAccept={deleteMap}
        onCancel={() => setDeleteMenuVisible(false)}
      />

      <View style={styles.container}>
        {/* Facebook Style Header */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outline,
            },
          ]}
        >
          <Text style={[styles.headerTitle, { color: theme.colors.primary }]}>
            CartoLogger
          </Text>
          <View style={styles.headerActions}>
            <Ionicons name="map-outline" size={24} color={theme.colors.primary} />
          </View>
        </View>

        {/* Facebook Style Search Input */}
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surface,
              borderBottomColor: theme.colors.outline,
            },
          ]}
        >
          <View
            style={[
              styles.searchBar,
              {
                backgroundColor: isDark ? "#3A3B3C" : "#F0F2F5",
              },
            ]}
          >
            <Ionicons
              name="search"
              size={18}
              color={theme.colors.onSurfaceVariant}
              style={styles.searchIcon}
            />
            <RNTextInput
              placeholder="Buscar mapas..."
              placeholderTextColor={theme.colors.onSurfaceVariant}
              value={filterText}
              onChangeText={setFilterText}
              style={[styles.searchInputText, { color: theme.colors.onSurface }]}
            />
          </View>
        </View>

        {/* List Section */}
        <View style={styles.listContainer}>
          {!isLoaded ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          ) : filteredMaps.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons
                name="folder-open-outline"
                size={64}
                color={theme.colors.onSurfaceVariant}
                style={styles.emptyIcon}
              />
              <Text
                variant="titleMedium"
                style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
              >
                {maps.length === 0
                  ? "No tienes ningún mapa, intenta agregar uno"
                  : "No se encontraron mapas"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredMaps}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <MapBubble
                  map={item}
                  onPress={() => {
                    gotoMap(item);
                  }}
                  onLongPress={() => {
                    beginDelete(item);
                  }}
                  onEdit={() => {
                    beginEdit(item);
                  }}
                />
              )}
            />
          )}
        </View>

        {/* Floating Action Button */}
        <FAB
          icon="plus"
          onPress={() => setAddMenuVisible(true)}
          style={[styles.fab, { backgroundColor: theme.colors.primary }]}
          color="white"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: "relative",
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  searchBar: {
    height: 38,
    borderRadius: 19,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInputText: {
    flex: 1,
    fontSize: 15,
    padding: 0,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
  },
  fab: {
    position: "absolute",
    margin: 16,
    right: 8,
    bottom: 8,
    borderRadius: 28,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
