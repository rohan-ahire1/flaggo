import { TOPICS, type Topic } from "@flaggo/core/types/topic";
import type { MapMode } from "@flaggo/core/utils/quiz";

export type TestMode = "recall" | "options";

export type LessonRoute =
  | { lessonId: string }
  | { mode: "review"; countryCodes: string[]; topic: Topic };

export type TestRoute = { countryCodes: string[]; mode: TestMode; topic: Topic };
export type MapPlayRoute = { mode: MapMode; countryCodes: string[]; lessonId?: string };

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

export function lessonPath(route: LessonRoute) {
  if ("lessonId" in route) return pathWithParams("/lesson", { lesson: route.lessonId });
  return pathWithParams("/lesson", {
    mode: "review",
    topic: route.topic,
    countries: route.countryCodes.join(",")
  });
}

export function parseLessonRoute(search: string, state?: unknown): LessonRoute | null {
  const params = new URLSearchParams(search);
  const lessonId = params.get("lesson")?.trim();
  if (lessonId) return { lessonId };
  if (params.get("mode") === "review") {
    const codes = countryCodes(params.get("countries"));
    if (codes.length) return { mode: "review", countryCodes: codes, topic: topic(params.get("topic")) };
  }
  return legacyState<LessonRoute>(state, (value) =>
    (typeof value.lessonId === "string" && Boolean(value.lessonId)) ||
    (value.mode === "review" && Array.isArray(value.countryCodes) && value.countryCodes.length > 0)
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
    countries: route.countryCodes.join(","),
    lesson: route.lessonId
  });
}

export function parseMapPlayRoute(search: string, state?: unknown): MapPlayRoute | null {
  const params = new URLSearchParams(search);
  const codes = countryCodes(params.get("countries"));
  if (codes.length) {
    return {
      mode: params.get("mode") === "identify" ? "identify" : "locate",
      countryCodes: codes,
      lessonId: params.get("lesson")?.trim() || undefined
    };
  }
  return legacyState<MapPlayRoute>(state, (value) =>
    Array.isArray(value.countryCodes) &&
    value.countryCodes.length > 0 &&
    (value.mode === "locate" || value.mode === "identify")
  );
}
