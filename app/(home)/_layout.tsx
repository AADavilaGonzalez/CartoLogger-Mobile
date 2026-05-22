import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: "",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="home" color={color} size={size}/>
          )
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "",
          tabBarIcon: ({color, size}) => (
            <Ionicons name="cog" color={color} size={size}/>
          )
        }}
      />
    </Tabs>
  );
}
