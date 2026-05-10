import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="map"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="map" color={color} size={size}/>
          )
        }}
      />
      <Tabs.Screen
        name="mapsettings"
        options={{
          headerShown: false,
          title: "",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="color-palette" color={color} size={size}/>
          )
        }}
      />
    </Tabs>
  );
}
