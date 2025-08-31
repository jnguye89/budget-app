import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { useEffect, useState } from 'react';
import { initDb } from '@/data/db';

export default function RootLayout() {
  // 🔹 Always call hooks — no early returns before these
  const colorScheme = useColorScheme();
  const [fontsLoaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const [dbReady, setDbReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await initDb();
      } finally {
        if (!cancelled) setDbReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Hide splash only when BOTH are ready
  useEffect(() => {
    if (fontsLoaded && dbReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, dbReady]);

  // Keep splash visible until everything is ready
  if (!fontsLoaded || !dbReady) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
