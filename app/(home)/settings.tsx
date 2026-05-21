import { useState, useEffect } from "react";
import { Text, SegmentedButtons} from "react-native-paper";
import { View, StyleSheet } from "react-native";

import { useStorage } from "@/hooks/use-storage";
import { useThemeContext } from "@/context/theme-context";

export default function MapConfig() {
  const storage = useStorage();
  const {themeMode, setThemeMode } = useThemeContext();

  const [useLocation, setUseLocation] = useState("");

  useEffect(() => {
    const loadSettings = async () => {
      setUseLocation(await storage.settings.get("useLocation"));
    }
    loadSettings();
  }, []);

  async function changeTheme(theme: string) {
    await setThemeMode(theme as "system" | "light" | "dark");
  }

  async function changeUseLocation(useLocation: string) {
    setUseLocation(useLocation);
    await storage.settings.set("useLocation", useLocation as any);
  }

  return (
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  settingGroup: {
    marginBottom: 16,
  },
  buttons: {
    marginTop: 8,
  },
});
