import "../global.css";
import { useEffect } from "react";
import { LogBox } from "react-native";
import { Stack } from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createSessionFromUrl } from "@/auth/actions";
import { AuthProvider } from "@/auth/AuthProvider";
import { initDb } from "@/db/client";
import { queryClient } from "@/lib/queryClient";
import { ProgressProvider } from "@/state/ProgressProvider";
import { useOnboardStore } from "@/state/onboarding";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { applyFigtreeDefault, FIGTREE_FONTS } from "@/theme/fonts";

SplashScreen.preventAutoHideAsync();
applyFigtreeDefault();
// Benign dev-only warning from async store hydration racing first paint.
LogBox.ignoreLogs([/Can't perform a React state update on a component that hasn't mounted/]);

export default function RootLayout() {
  const url = Linking.useURL();
  const [fontsLoaded] = useFonts(FIGTREE_FONTS);
  const hydrateOnboard = useOnboardStore((s) => s.hydrate);

  useEffect(() => {
    initDb();
    void hydrateOnboard();
  }, [hydrateOnboard]);

  useEffect(() => {
    if (fontsLoaded) void SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Handle OAuth / magic-link callbacks that open the app via deep link.
  useEffect(() => {
    if (url) void createSessionFromUrl(url);
  }, [url]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <AuthProvider>
              <ProgressProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="quiz" options={{ presentation: "card" }} />
                  <Stack.Screen name="arcade" options={{ presentation: "card" }} />
                  <Stack.Screen name="match/[id]" options={{ presentation: "card" }} />
                  <Stack.Screen name="friends" options={{ presentation: "card" }} />
                  <Stack.Screen name="leaderboard" options={{ presentation: "card" }} />
                </Stack>
              </ProgressProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
