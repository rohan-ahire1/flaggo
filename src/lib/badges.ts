import { BADGES } from "@flaggo/core/game/badges";
import type { EarnedBadgeResult } from "../components/RoundResults";
import type { IconName } from "../components/Icon";

export function earnedBadgeResults(ids: string[]): EarnedBadgeResult[] {
  const idSet = new Set(ids);
  return BADGES.filter((badge) => idSet.has(badge.id)).map((badge) => ({
    id: badge.id,
    name: badge.name,
    icon: badge.icon as IconName
  }));
}
