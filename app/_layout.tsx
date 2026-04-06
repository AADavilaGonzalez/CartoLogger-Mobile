
import { Suspense } from 'react';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { View, useColorScheme } from 'react-native';
import { 
  PaperProvider, MD3DarkTheme, MD3LightTheme, ActivityIndicator
} from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native"
import { migrateDbIfNeeded, dbName } from '@/storage/init';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';

  const navigationTheme = colorScheme === 'dark' ? DarkTheme : DefaultTheme;
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const appTheme = {
    ...paperTheme,
    colors: {
      ...paperTheme.colors,
      primary: "#730CEB",
      secondary: "#6111BD",
    }
  }

  function LoadingScreen() {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: appTheme.colors.background
      }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider 
        databaseName={dbName}
        onInit={migrateDbIfNeeded} 
        useSuspense
      >
      <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
      <PaperProvider theme={appTheme}>
        <Stack
          screenOptions={{
            animation: "fade",
            contentStyle: {
              backgroundColor: appTheme.colors.background,
            }
          }}
        >
          <Stack.Screen name="index" options={{ title: 'CartoLogger' }} />
          <Stack.Screen name="map" options={{ title: '' }} />
        </Stack>
      </PaperProvider>
      </ThemeProvider>
      </SafeAreaProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
