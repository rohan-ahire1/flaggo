export type Topic = "flag" | "capital" | "location";

export const PATH_TOPICS: Topic[] = ["flag", "capital"];
export const TOPICS: Topic[] = ["flag", "capital", "location"];

export const reviewKey = (code: string, topic: Topic) => `${code}:${topic}`;

export const parseReviewKey = (key: string): { code: string; topic: Topic } => {
  const i = key.indexOf(":");
  if (i === -1) return { code: key, topic: "flag" };
  return { code: key.slice(0, i), topic: key.slice(i + 1) as Topic };
};
