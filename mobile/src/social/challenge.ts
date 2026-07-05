import { Alert, Platform, Share } from "react-native";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { env } from "@/config/env";
import { createMatch, normalizeMatchConfig, type Match, type MatchConfig } from "@/lib/matches";
import { supabase } from "@/lib/supabase";

// Alert.alert is a no-op on react-native-web, so notices from web silently
// vanish. Route through window.alert on web, native Alert otherwise.
function notify(title: string, message: string) {
  if (Platform.OS === "web") {
    if (typeof window !== "undefined") window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function confirmSignIn() {
  const title = "Sign in to challenge friends";
  if (Platform.OS === "web") {
    if (typeof window !== "undefined" && window.confirm(title)) router.push("/profile");
    return;
  }
  Alert.alert(title, undefined, [
    { text: "Not now", style: "cancel" },
    { text: "Go to sign in", onPress: () => router.push("/profile") }
  ]);
}

// A challenge is today's daily-style round, trimmed to 5 questions to match the
// "Today's Five" framing on Home.
export function challengeConfig(): MatchConfig {
  return normalizeMatchConfig({
    topics: ["flag", "capital", "currency", "language", "neighbor"],
    mode: "daily",
    questionCount: 5
  });
}

// Deep link that reopens the app straight into the match (flaggo://match/<id>).
export function matchDeepLink(id: string) {
  return Linking.createURL(`/match/${id}`);
}

export async function shareChallenge(match: Match, score?: number) {
  const webUrl = `${env.siteUrl}/?m=${match.id}`;
  const scoreLine = typeof score === "number" ? `I scored ${score}/${match.config.questionCount}. ` : "";
  const message = `${scoreLine}Can you beat me on this Flaggo round? ${webUrl}`;

  if (Platform.OS === "web") {
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav?.share) {
      try {
        await nav.share({ title: "Flaggo challenge", text: message });
        return;
      } catch {
        // user dismissed the share sheet or it failed — fall through to copy
      }
    }
    if (nav?.clipboard) await nav.clipboard.writeText(webUrl);
    notify("Challenge link copied", message);
    return;
  }

  await Share.share({ title: "Flaggo challenge", message });
}

// Create a match on Supabase then open the native share sheet. Throws if the
// user isn't signed in / Supabase isn't configured (caller shows the notice).
export async function createAndShareChallenge(score?: number): Promise<Match> {
  const match = await createMatch(challengeConfig());
  await shareChallenge(match, score);
  return match;
}

// UI-friendly wrapper: creates + shares a challenge, or alerts if the user needs
// to sign in / Supabase isn't configured.
export async function promptChallenge(score?: number): Promise<void> {
  try {
    const { data } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    if (!data.session) {
      confirmSignIn();
      return;
    }
    await createAndShareChallenge(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in to challenge a friend.";
    if (/sign in/i.test(message)) {
      confirmSignIn();
      return;
    }
    notify("Challenge a friend", message);
  }
}
