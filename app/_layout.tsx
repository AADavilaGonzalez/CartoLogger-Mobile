
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

  return (
    /* Use Suspense to handle the async loading of the DB */
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider 
        databaseName={dbName}
        onInit={migrateDbIfNeeded} 
        useSuspense
      >
      <SafeAreaProvider>
      <ThemeProvider value={navigationTheme}>
      <PaperProvider theme={appTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'My Maps' }} />
        </Stack>
      </PaperProvider>
      </ThemeProvider>
      </SafeAreaProvider>
      </SQLiteProvider>
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
