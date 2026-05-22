import { useState, useEffect } from "react";
import { Text, SegmentedButtons, Button, useTheme } from "react-native-paper";
import { View, StyleSheet, Alert } from "react-native";
import { useSQLiteContext } from "expo-sqlite";
import { SafeAreaView } from "react-native-safe-area-context";

import { useStorage } from "@/hooks/use-storage";
import { useThemeContext } from "@/context/theme-context";
import { defaultSettings } from "@/storage/api/settings";

export default function MapConfig() {
  const db = useSQLiteContext();
  const storage = useStorage();
  const { themeMode, setThemeMode } = useThemeContext();
  const theme = useTheme();

  const [useLocation, setUseLocation] = useState("");
  const [mapType, setMapType] = useState("standard");

  useEffect(() => {
    const loadSettings = async () => {
      setUseLocation(await storage.settings.get("useLocation"));
      try {
        setMapType(await storage.settings.get("mapType"));
      } catch {
        setMapType("standard");
      }
    };
    loadSettings();
  }, []);

  async function changeTheme(theme: string) {
    await setThemeMode(theme as "system" | "light" | "dark");
  }

  async function changeUseLocation(useLocation: string) {
    setUseLocation(useLocation);
    await storage.settings.set("useLocation", useLocation as any);
  }

  async function changeMapType(type: string) {
    setMapType(type);
    await storage.settings.set("mapType", type as any);
  }

  const handleClearData = () => {
    Alert.alert(
      "Borrar todos los datos",
      "¿Estás seguro de que deseas borrar todos los mapas y configuraciones? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar todo",
          style: "destructive",
          onPress: async () => {
            try {
              await db.withTransactionAsync(async () => {
                await db.execAsync("DELETE FROM maps;");
                await db.execAsync("DELETE FROM settings;");
                let query = "";
                for (const [setting, value] of Object.entries(defaultSettings)) {
                  query += `
                    INSERT INTO settings (setting, value)
                    VALUES ('${setting}', '${value}')
                    ON CONFLICT(setting) DO NOTHING;
                  `;
                }
                await db.execAsync(query);
              });

              // Reset local states
              setThemeMode("system");
              setUseLocation("true");
              setMapType("standard");

              Alert.alert("Éxito", "Todos los datos han sido borrados.");
            } catch (err) {
              console.warn(err);
              Alert.alert("Error", "No se pudieron borrar los datos.");
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.outline,
          },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
          Configuración
        </Text>
      </View>

      <View style={styles.container}>
        <View style={styles.settingGroup}>
          <Text variant="titleMedium">Tema:</Text>
          <SegmentedButtons
            value={themeMode}
            onValueChange={changeTheme}
            buttons={[
              { value: "system", label: "Sistema" },
              { value: "light", label: "Claro" },
              { value: "dark", label: "Obscuro" },
            ]}
            style={styles.buttons}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text variant="titleMedium">Usar Ubicación:</Text>
          <SegmentedButtons
            value={useLocation}
            onValueChange={changeUseLocation}
            buttons={[
              { value: "true", label: "Sí" },
              { value: "false", label: "No" },
            ]}
            style={styles.buttons}
          />
        </View>

        <View style={styles.settingGroup}>
          <Text variant="titleMedium">Tipo de Mapa:</Text>
          <SegmentedButtons
            value={mapType}
            onValueChange={changeMapType}
            buttons={[
              { value: "standard", label: "Estándar" },
              { value: "satellite", label: "Satélite" },
              { value: "hybrid", label: "Híbrido" },
              { value: "terrain", label: "Terreno" },
            ]}
            style={styles.buttons}
          />
        </View>

        <View style={styles.clearGroup}>
          <Button
            mode="contained"
            onPress={handleClearData}
            buttonColor="#D32F2F"
            textColor="white"
            style={styles.clearButton}
          >
            Borrar todos los datos
          </Button>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  container: {
    padding: 16,
    gap: 16,
    flex: 1,
  },
  settingGroup: {
    marginBottom: 16,
  },
  buttons: {
    marginTop: 8,
  },
  clearGroup: {
    marginTop: 24,
    alignItems: "center",
  },
  clearButton: {
    width: "100%",
    borderRadius: 8,
    paddingVertical: 4,
  },
});
