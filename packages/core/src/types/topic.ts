export type Topic = "flag" | "capital" | "location" | "currency" | "language" | "neighbor";

export const PATH_TOPICS: Topic[] = ["flag", "capital", "currency", "location", "language"];
export const TOPICS: Topic[] = ["flag", "capital", "location", "currency", "language", "neighbor"];

export const reviewKey = (code: string, topic: Topic) => `${code}:${topic}`;

export const parseReviewKey = (key: string): { code: string; topic: Topic } => {
  const i = key.indexOf(":");
  if (i === -1) return { code: key, topic: "flag" };
  return { code: key.slice(0, i), topic: key.slice(i + 1) as Topic };
};
