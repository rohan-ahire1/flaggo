import "../global.css";
import { useEffect, useState } from "react";
import { AppState, LogBox, Text, View } from "react-native";
import { Stack, router } from "expo-router";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { QueryClientProvider } from "@tanstack/react-query";
import { createSessionFromUrl } from "@/auth/actions";
import { AuthProvider } from "@/auth/AuthProvider";
import { NameClaimProvider } from "@/components/NameClaimProvider";
import PwaRegistration from "@/components/PwaRegistration";
import WebDocumentHead from "@/components/WebDocumentHead";
import WebSidebarShell from "@/components/WebSidebarShell";
import { initDb } from "@/db/client";
import { queryClient } from "@/lib/queryClient";
import { initSentry } from "@/lib/sentry";
import { syncStreakReminder } from "@/lib/streakReminder";
import { ProgressProvider } from "@/state/ProgressProvider";
import { useProgress } from "@/state/ProgressProvider";
import { useOnboardStore } from "@/state/onboarding";
import { ThemeProvider } from "@/theme/ThemeProvider";
import { applyFigtreeDefault, FIGTREE_FONTS } from "@/theme/fonts";
import { DEFAULT_THEME, themeColor } from "@/theme/palettes";

SplashScreen.preventAutoHideAsync();
applyFigtreeDefault();
initSentry();
// Benign dev-only warning from async store hydration racing first paint.
LogBox.ignoreLogs([/Can't perform a React state update on a component that hasn't mounted/]);

export default function RootLayout() {
  const url = Linking.useURL();
  const [fontsLoaded] = useFonts(FIGTREE_FONTS);
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const hydrateOnboard = useOnboardStore((s) => s.hydrate);

  useEffect(() => {
    let active = true;

    void initDb()
      .then(() => {
        if (active) setDbReady(true);
      })
      .catch((error) => {
        console.error("Failed to initialize local database", error);
        if (active) {
          setDbError(error instanceof Error ? error.message : "Failed to initialize local database.");
        }
      });

    void hydrateOnboard();

    return () => {
      active = false;
    };
  }, [hydrateOnboard]);

  useEffect(() => {
    if (fontsLoaded && (dbReady || dbError)) void SplashScreen.hideAsync();
  }, [dbError, dbReady, fontsLoaded]);

  // Handle auth callbacks that open the app via deep link.
  useEffect(() => {
    if (!url) return;
    try {
      const parsed = new URL(url);
      const id = parsed.searchParams.get("m");
      if (id) {
        router.push({ pathname: "/match/[id]", params: { id } });
        return;
      }
    } catch {
      // Fall through to auth handling for non-standard URLs.
    }
    void createSessionFromUrl(url);
  }, [url]);

  if (dbError) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              backgroundColor: themeColor(DEFAULT_THEME, "paper"),
              paddingHorizontal: 20,
              paddingVertical: 24
            }}
          >
            <View style={{ width: "100%", maxWidth: 420, alignSelf: "center" }}>
              <Text
                style={{
                  color: themeColor(DEFAULT_THEME, "ink"),
                  fontSize: 22,
                  fontWeight: "900",
                  textAlign: "center"
                }}
              >
                Flaggo could not initialize local storage.
              </Text>
              <Text
                style={{
                  color: themeColor(DEFAULT_THEME, "muted"),
                  fontSize: 14,
                  fontWeight: "600",
                  marginTop: 8,
                  textAlign: "center"
                }}
              >
                {dbError}
              </Text>
            </View>
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  if (!fontsLoaded || !dbReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <WebDocumentHead />
            <PwaRegistration />
            <AuthProvider>
              <NameClaimProvider>
                <ProgressProvider>
                  <StreakReminderForegroundSync />
                  <WebSidebarShell>
                    <StatusBar style="dark" />
                    <Stack screenOptions={{ headerShown: false }}>
                      <Stack.Screen name="(tabs)" />
                      <Stack.Screen name="quiz" options={{ presentation: "card" }} />
                      <Stack.Screen name="arcade" options={{ presentation: "card" }} />
                      <Stack.Screen name="match/[id]" options={{ presentation: "card" }} />
                      <Stack.Screen name="friends" options={{ presentation: "card" }} />
                      <Stack.Screen name="leaderboard" options={{ presentation: "card" }} />
                      <Stack.Screen name="auth/callback" options={{ presentation: "card" }} />
                    </Stack>
                  </WebSidebarShell>
                </ProgressProvider>
              </NameClaimProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function StreakReminderForegroundSync() {
  const { progress } = useProgress();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncStreakReminder(progress).catch(() => undefined);
    });
    return () => subscription.remove();
  }, [progress]);

  return null;
}
