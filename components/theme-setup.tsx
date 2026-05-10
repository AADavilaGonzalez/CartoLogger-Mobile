import { Stack } from 'expo-router';
import {
  PaperProvider, MD3DarkTheme, MD3LightTheme
} from 'react-native-paper';
import {
  DarkTheme as NavDarkTheme, DefaultTheme as NavDefaultTheme, ThemeProvider
} from "@react-navigation/native"

import { useThemeContext } from '@/context/theme-context';

export function ThemeSetupComponent() {
  const { isDark } = useThemeContext();

  const paperTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  const navTheme = isDark ? NavDarkTheme : NavDefaultTheme;

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

  return (
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
  );
}
