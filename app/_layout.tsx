// Root layout to set up providers and other defautls

import { Suspense } from 'react';
import { View, useColorScheme } from 'react-native';
import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  PaperProvider, MD3DarkTheme, MD3LightTheme, ActivityIndicator
} from 'react-native-paper';

import {
  DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider
} from "@react-navigation/native"

import { migrateDbIfNeeded, dbName } from '@/storage/init';

export default function RootLayout() {
  const colorScheme = useColorScheme() ?? 'light';
  const paperTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;
  const navTheme = colorScheme === 'dark' ? NavDarkTheme : NavDefaultTheme;

  const appTheme = {
    ...paperTheme,
    colors: {
      ...paperTheme.colors,
      primary: "#730CEB",
      secondary: "#6111BD",
    }
  }

  // Create navigation theme from Paper theme colors
  const navigationTheme = {
    ...navTheme,
    colors: {
      ...navTheme.colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.onBackground,
      border: appTheme.colors.outline,
      notification: appTheme.colors.error,
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
          <Stack.Screen name="(home)" options={{headerShown: false}}/>
          <Stack.Screen name="(map)" options={{title: ""}}/>
        </Stack>
      </PaperProvider>
      </ThemeProvider>
      </SafeAreaProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
