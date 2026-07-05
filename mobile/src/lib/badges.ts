import { BADGES } from "@flaggo/core/game/badges";
import type { EarnedBadgeResult } from "@/components/RoundResults";
import type { IconName } from "@/components/Icon";

function iconName(icon: string): IconName {
  return (icon === "pin" ? "map-pin" : icon) as IconName;
}

export function earnedBadgeResults(ids: string[]): EarnedBadgeResult[] {
  const idSet = new Set(ids);
  return BADGES.filter((badge) => idSet.has(badge.id)).map((badge) => ({
    id: badge.id,
    name: badge.name,
    icon: iconName(badge.icon)
  }));
}
