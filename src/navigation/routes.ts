import { TOPICS, type Topic } from "@flaggo/core/types/topic";
import type { MapMode } from "@flaggo/core/utils/quiz";

export type TestMode = "recall" | "options";

export type ReviewRoute = { countryCodes: string[]; topic: Topic };
export type FlashcardsRoute = { countryCodes: string[] };

export type TestRoute = { countryCodes: string[]; mode: TestMode; topic: Topic };
export type MapPlayRoute = { mode: MapMode; countryCodes: string[] };

function pathWithParams(pathname: string, values: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

function countryCodes(value: string | null) {
  return value?.split(",").map((code) => code.trim()).filter(Boolean) ?? [];
}

function topic(value: string | null, fallback: Topic = "flag"): Topic {
  return TOPICS.includes(value as Topic) ? (value as Topic) : fallback;
}

function legacyState<T>(state: unknown, valid: (value: Record<string, unknown>) => boolean): T | null {
  if (!state || typeof state !== "object" || !valid(state as Record<string, unknown>)) return null;
  return state as T;
}

export function reviewPath(route: ReviewRoute) {
  return pathWithParams("/review/play", {
    topic: route.topic,
    countries: route.countryCodes.join(",")
  });
}

export function parseReviewRoute(search: string, state?: unknown): ReviewRoute | null {
  const params = new URLSearchParams(search);
  const codes = countryCodes(params.get("countries"));
  if (codes.length) return { countryCodes: codes, topic: topic(params.get("topic")) };
  return legacyState<ReviewRoute>(state, (value) =>
    Array.isArray(value.countryCodes) && value.countryCodes.length > 0
  );
}

export function flashcardsPath(route: FlashcardsRoute) {
  return pathWithParams("/review/flashcards", {
    countries: route.countryCodes.join(",")
  });
}

export function parseFlashcardsRoute(search: string, state?: unknown): FlashcardsRoute | null {
  const params = new URLSearchParams(search);
  const codes = countryCodes(params.get("countries"));
  if (codes.length) return { countryCodes: codes };
  return legacyState<FlashcardsRoute>(state, (value) =>
    Array.isArray(value.countryCodes) && value.countryCodes.length > 0
  );
}

export function testPath(route: TestRoute) {
  return pathWithParams("/test", {
    mode: route.mode,
    topic: route.topic,
    countries: route.countryCodes.join(",")
  });
}

export function parseTestRoute(search: string, state?: unknown): TestRoute | null {
  const params = new URLSearchParams(search);
  const codes = countryCodes(params.get("countries"));
  if (codes.length) {
    return {
      countryCodes: codes,
      mode: params.get("mode") === "options" ? "options" : "recall",
      topic: topic(params.get("topic"))
    };
  }
  return legacyState<TestRoute>(state, (value) =>
    Array.isArray(value.countryCodes) &&
    value.countryCodes.length > 0 &&
    (value.mode === "recall" || value.mode === "options")
  );
}

export function mapPlayPath(route: MapPlayRoute) {
  return pathWithParams("/map/play", {
    mode: route.mode,
    countries: route.countryCodes.join(",")
  });
}

export function parseMapPlayRoute(search: string, state?: unknown): MapPlayRoute | null {
  const params = new URLSearchParams(search);
  const codes = countryCodes(params.get("countries"));
  if (codes.length) {
    return {
      mode: params.get("mode") === "identify" ? "identify" : "locate",
      countryCodes: codes
    };
  }
  return legacyState<MapPlayRoute>(state, (value) =>
    Array.isArray(value.countryCodes) &&
    value.countryCodes.length > 0 &&
    (value.mode === "locate" || value.mode === "identify")
  );
}
