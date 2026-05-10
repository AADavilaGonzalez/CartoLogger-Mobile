// Root layout to set up providers and other defautls

import { Suspense } from 'react';
import { View } from 'react-native';
import { SQLiteProvider } from 'expo-sqlite';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, MD3LightTheme } from 'react-native-paper';

import { initDb, dbName } from '@/storage/init';
import { ThemeContextProvider } from '@/context/theme-context';
import { ThemeSetupComponent } from '@/components/theme-setup';

export default function RootLayout() {
  function LoadingScreen() {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: MD3LightTheme.colors.background
      }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Suspense fallback={<LoadingScreen />}>
      <SQLiteProvider 
        databaseName={dbName}
        onInit={initDb} 
        useSuspense
      >
        <SafeAreaProvider>
          <ThemeContextProvider>
            <ThemeSetupComponent />
          </ThemeContextProvider>
        </SafeAreaProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
