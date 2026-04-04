
import { StyleSheet } from "react-native";
import MapView from "react-native-maps";

import { useColorScheme } from "@/hooks/use-color-scheme";

const initialRegion = {
    latitude:51.53,
    longitude: 0,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
};

export function Map() {
  const colorScheme = useColorScheme() ?? 'light';

  return (
    <MapView
      userInterfaceStyle={colorScheme}
      initialRegion={initialRegion}
      style={styles.map}
    />
  );
}

const styles = StyleSheet.create({
  map: {
    height: "100%",
    width: "100%",
  }
});
