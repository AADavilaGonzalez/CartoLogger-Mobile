import { useState, useCallback } from "react";
import { View, StyleSheet, Alert, Share, ScrollView } from "react-native";
import { Text, TextInput, Button, Switch, useTheme, Surface, Divider } from "react-native-paper";
import { useLocalSearchParams, useFocusEffect } from "expo-router";
import { useStorage } from "@/hooks/use-storage";
import { Ionicons } from "@expo/vector-icons";
import { getActiveMapId } from "@/storage/active-map";

export default function MapSettings() {
  const theme = useTheme();
  const storage = useStorage();
  const params = useLocalSearchParams();
  const routeId = parseInt(params.id as string);
  const activeId = getActiveMapId();
  const id = !isNaN(routeId) ? routeId : (activeId ?? NaN);

  // Map metadata states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSavingInfo, setIsSavingInfo] = useState(false);

  // Layer visibility states
  const [showMarkers, setShowMarkers] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [showPolygons, setShowPolygons] = useState(true);

  // Load map info and settings
  const loadMapInfo = useCallback(async () => {
    try {
      const map = await storage.maps.get(id);
      if (map) {
        setTitle(map.title);
        setDescription(map.description);
      }

      // Load visibility settings (defaulting to true if not set)
      const getSettingSafe = async (key: string) => {
        try {
          const val = await storage.settings.get(key);
          return val !== "false";
        } catch {
          return true;
        }
      };

      setShowMarkers(await getSettingSafe(`showMarkers_${id}`));
      setShowLines(await getSettingSafe(`showLines_${id}`));
      setShowPolygons(await getSettingSafe(`showPolygons_${id}`));
    } catch (err) {
      console.warn("Error loading map settings", err);
    }
  }, [id, storage]);

  // Load when focused
  useFocusEffect(
    useCallback(() => {
      loadMapInfo();
    }, [loadMapInfo])
  );

  // Save metadata changes
  const handleSaveInfo = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "El título no puede estar vacío.");
      return;
    }
    setIsSavingInfo(true);
    try {
      await storage.maps.set({ id, title, description });
      Alert.alert("Éxito", "Información del mapa guardada correctamente.");
    } catch (err) {
      console.warn(err);
      Alert.alert("Error", "No se pudo guardar la información.");
    } finally {
      setIsSavingInfo(false);
    }
  };

  // Toggle Visibility Handlers
  const handleToggle = async (layer: "Markers" | "Lines" | "Polygons", val: boolean) => {
    const key = `show${layer}_${id}`;
    if (layer === "Markers") setShowMarkers(val);
    if (layer === "Lines") setShowLines(val);
    if (layer === "Polygons") setShowPolygons(val);

    try {
      await storage.settings.set(key, val ? "true" : "false");
    } catch (err) {
      console.warn(`Error saving ${key}`, err);
    }
  };

  // Export features
  const handleExport = async () => {
    try {
      const data = await storage.maps.getData(id);
      const jsonStr = JSON.stringify(data.features, null, 2);
      await Share.share({
        title: `Exportar Mapa: ${title}`,
        message: jsonStr,
      });
    } catch (err) {
      console.warn("Error sharing features", err);
      Alert.alert("Error", "No se pudieron exportar los datos.");
    }
  };

  // Wipe drawings
  const handleClearDrawings = () => {
    Alert.alert(
      "Borrar todos los dibujos",
      "¿Estás seguro de que deseas eliminar permanentemente todas las líneas, marcas y polígonos de este mapa? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar",
          style: "destructive",
          onPress: async () => {
            try {
              await storage.maps.setFeatures(id, []);
              Alert.alert("Éxito", "Todos los dibujos han sido eliminados.");
            } catch (err) {
              console.warn(err);
              Alert.alert("Error", "No se pudieron borrar los dibujos.");
            }
          }
        }
      ]
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text variant="headlineMedium" style={styles.header}>Configuración del Mapa</Text>

      {/* Map Metadata Section */}
      <Surface elevation={1} style={styles.card}>
        <Text variant="titleMedium" style={styles.cardTitle}>Información del Mapa</Text>
        <TextInput
          label="Título"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
        />
        <Button
          mode="contained"
          onPress={handleSaveInfo}
          loading={isSavingInfo}
          style={styles.saveBtn}
        >
          Guardar Cambios
        </Button>
      </Surface>

      {/* Layer Toggles Section */}
      <Surface elevation={1} style={styles.card}>
        <Text variant="titleMedium" style={styles.cardTitle}>Capas de Visualización</Text>
        
        <View style={styles.row}>
          <View style={styles.rowLabelGroup}>
            <Ionicons name="location" size={20} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Mostrar Marcadores</Text>
          </View>
          <Switch
            value={showMarkers}
            onValueChange={(v) => handleToggle("Markers", v)}
          />
        </View>
        <Divider style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLabelGroup}>
            <Ionicons name="analytics" size={20} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Mostrar Líneas</Text>
          </View>
          <Switch
            value={showLines}
            onValueChange={(v) => handleToggle("Lines", v)}
          />
        </View>
        <Divider style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.rowLabelGroup}>
            <Ionicons name="shapes" size={20} color={theme.colors.primary} />
            <Text style={styles.rowLabel}>Mostrar Polígonos</Text>
          </View>
          <Switch
            value={showPolygons}
            onValueChange={(v) => handleToggle("Polygons", v)}
          />
        </View>
      </Surface>

      {/* Actions Section */}
      <Surface elevation={1} style={styles.card}>
        <Text variant="titleMedium" style={styles.cardTitle}>Acciones</Text>
        
        <Button
          mode="outlined"
          onPress={handleExport}
          icon={({ size, color }) => <Ionicons name="share-social" size={size} color={color} />}
          style={styles.actionBtn}
        >
          Exportar Datos (JSON)
        </Button>

        <Button
          mode="contained"
          onPress={handleClearDrawings}
          buttonColor="#D32F2F"
          textColor="white"
          icon={({ size, color }) => <Ionicons name="trash-outline" size={size} color={color} />}
          style={styles.actionBtn}
        >
          Limpiar Lienzo (Borrar Dibujos)
        </Button>
      </Surface>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontWeight: "bold",
    marginBottom: 20,
    marginTop: 8,
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: "600",
    marginBottom: 12,
  },
  input: {
    marginBottom: 12,
  },
  saveBtn: {
    marginTop: 4,
    borderRadius: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  rowLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowLabel: {
    fontSize: 15,
  },
  divider: {
    marginVertical: 4,
  },
  actionBtn: {
    marginVertical: 6,
    borderRadius: 8,
  },
});
