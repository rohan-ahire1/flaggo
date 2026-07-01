import { Alert, Share } from "react-native";
import * as Linking from "expo-linking";
import { createMatch, normalizeMatchConfig, type Match, type MatchConfig } from "@/lib/matches";

// A challenge is today's daily-style round, trimmed to 5 questions to match the
// "Today's Five" framing on Home.
export function challengeConfig(): MatchConfig {
  return normalizeMatchConfig({
    topics: ["flag", "capital", "currency", "language", "neighbor"],
    mode: "daily",
    questionCount: 5
  });
}

// Deep link that reopens the app straight into the match (worldly://match/<id>).
export function matchDeepLink(id: string) {
  return Linking.createURL(`/match/${id}`);
}

export async function shareChallenge(match: Match, score?: number) {
  const link = matchDeepLink(match.id);
  const scoreLine = typeof score === "number" ? `I scored ${score}/${match.config.questionCount}. ` : "";
  await Share.share({
    title: "Worldly challenge",
    message: `${scoreLine}Can you beat me on this Worldly round? ${link}`
  });
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
    await createAndShareChallenge(score);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sign in to challenge a friend.";
    Alert.alert("Challenge a friend", message);
  }
}
