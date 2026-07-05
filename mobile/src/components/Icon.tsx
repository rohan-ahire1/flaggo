import Svg, { Circle, Path, Rect } from "react-native-svg";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

export type IconName =
  | "today"
  | "play"
  | "book"
  | "user"
  | "users"
  | "flag"
  | "check"
  | "x"
  | "flame"
  | "star"
  | "chevron-right"
  | "map-pin"
  | "share"
  | "swap"
  | "clock"
  | "trophy"
  | "brain"
  | "arrow-right"
  | "globe"
  | "sparkle"
  | "library"
  | "stats"
  | "heart"
  | "bolt"
  | "target"
  | "review"
  | "grid"
  | "layers"
  | "plus"
  | "search"
  | "lock"
  | "chevron-left";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
};

// Minimal react-native-svg icon set (subset of the web Icon.tsx path data),
// stroked with currentColor-style `color` so it inherits the theme.
export default function Icon({ name, size = 24, color }: Props) {
  const resolvedColor = color ?? themeColor(useThemeStore((s) => s.theme), "ink");
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: resolvedColor,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };

  switch (name) {
    case "today":
      return (
        <Svg {...common}>
          <Rect x="3" y="4.5" width="18" height="16" rx="3" />
          <Path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </Svg>
      );
    case "play":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor}>
          <Path d="M7 4.5v15l12-7.5z" />
        </Svg>
      );
    case "book":
      return (
        <Svg {...common}>
          <Path d="M4 5.5A2 2 0 0 1 6 4h6v16H6a2 2 0 0 0-2 1.2z" />
          <Path d="M20 5.5A2 2 0 0 0 18 4h-6v16h6a2 2 0 0 1 2 1.2z" />
        </Svg>
      );
    case "user":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="8" r="3.5" />
          <Path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
        </Svg>
      );
    case "flag":
      return (
        <Svg {...common}>
          <Path d="M6 21V4" />
          <Path d="M6 4h11l-2.5 4L17 12H6" />
        </Svg>
      );
    case "check":
      return (
        <Svg {...common}>
          <Path d="M5 13l4 4L19 7" />
        </Svg>
      );
    case "x":
      return (
        <Svg {...common}>
          <Path d="M6 6l12 12M18 6L6 18" />
        </Svg>
      );
    case "flame":
      return (
        <Svg {...common}>
          <Path d="M12 3c1 3-2 4-2 7a2 2 0 1 0 4 0c0-1 .5-1.5.5-1.5C16 11 17 13 17 15a5 5 0 1 1-10 0c0-4 3-6 5-12z" />
        </Svg>
      );
    case "star":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor}>
          <Path d="M12 3l2.6 5.6 6.1.7-4.5 4.1 1.2 6-5.4-3-5.4 3 1.2-6L3.3 9.3l6.1-.7z" />
        </Svg>
      );
    case "chevron-right":
      return (
        <Svg {...common}>
          <Path d="M9 6l6 6-6 6" />
        </Svg>
      );
    case "arrow-right":
      return (
        <Svg {...common}>
          <Path d="M4 12h15M13 6l6 6-6 6" />
        </Svg>
      );
    case "users":
      return (
        <Svg {...common}>
          <Circle cx="9" cy="8" r="3.2" />
          <Path d="M2.5 20c0-3.3 2.9-5.5 6.5-5.5s6.5 2.2 6.5 5.5" />
          <Path d="M16 5.2a3.2 3.2 0 0 1 0 6M18.5 20c0-3-1.4-4.7-3.2-5.4" />
        </Svg>
      );
    case "map-pin":
      return (
        <Svg {...common}>
          <Path d="M12 21c5-5.3 7-8.4 7-11a7 7 0 1 0-14 0c0 2.6 2 5.7 7 11z" />
          <Circle cx="12" cy="10" r="2.5" />
        </Svg>
      );
    case "share":
      return (
        <Svg {...common}>
          <Circle cx="6" cy="12" r="2.5" />
          <Circle cx="18" cy="6" r="2.5" />
          <Circle cx="18" cy="18" r="2.5" />
          <Path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6" />
        </Svg>
      );
    case "swap":
      return (
        <Svg {...common}>
          <Path d="M7 4L3 8l4 4" />
          <Path d="M3 8h14a4 4 0 0 1 0 8h-1" />
          <Path d="M17 20l4-4-4-4" />
          <Path d="M21 16H8" />
        </Svg>
      );
    case "clock":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8.5" />
          <Path d="M12 7.5V12l3 2" />
        </Svg>
      );
    case "trophy":
      return (
        <Svg {...common}>
          <Path d="M7 4h10v4a5 5 0 0 1-10 0z" />
          <Path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
          <Path d="M12 13v3M9 20h6M9.5 20c0-2 .8-4 2.5-4s2.5 2 2.5 4" />
        </Svg>
      );
    case "brain":
      return (
        <Svg {...common}>
          <Path d="M9.5 4A2.5 2.5 0 0 0 7 6.5 2.5 2.5 0 0 0 5 11a2.5 2.5 0 0 0 1 4.5A2.5 2.5 0 0 0 9.5 20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
          <Path d="M14.5 4A2.5 2.5 0 0 1 17 6.5 2.5 2.5 0 0 1 19 11a2.5 2.5 0 0 1-1 4.5A2.5 2.5 0 0 1 14.5 20a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
        </Svg>
      );
    case "globe":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="9" />
          <Path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" />
        </Svg>
      );
    case "sparkle":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor}>
          <Path d="M12 2l1.8 5.2L19 9l-5.2 1.8L12 16l-1.8-5.2L5 9l5.2-1.8z" />
        </Svg>
      );
    case "library":
      return (
        <Svg {...common}>
          <Path d="M4 5v14M8 5v14" />
          <Rect x="11" y="5" width="4" height="14" rx="1" />
          <Path d="M17.5 6l3 12-3.8 1-3-12z" />
        </Svg>
      );
    case "stats":
      return (
        <Svg {...common}>
          <Path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </Svg>
      );
    case "heart":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor}>
          <Path d="M12 20s-7-4.4-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.6 12 20 12 20z" />
        </Svg>
      );
    case "bolt":
      return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill={resolvedColor}>
          <Path d="M13 2L4 14h6l-1 8 9-12h-6z" />
        </Svg>
      );
    case "target":
      return (
        <Svg {...common}>
          <Circle cx="12" cy="12" r="8.5" />
          <Circle cx="12" cy="12" r="4.5" />
          <Circle cx="12" cy="12" r="1" fill={resolvedColor} />
        </Svg>
      );
    case "review":
      return (
        <Svg {...common}>
          <Path d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4" />
        </Svg>
      );
    case "grid":
      return (
        <Svg {...common}>
          <Rect x="4" y="4" width="7" height="7" rx="1.5" />
          <Rect x="13" y="4" width="7" height="7" rx="1.5" />
          <Rect x="4" y="13" width="7" height="7" rx="1.5" />
          <Rect x="13" y="13" width="7" height="7" rx="1.5" />
        </Svg>
      );
    case "layers":
      return (
        <Svg {...common}>
          <Path d="M12 3l9 5-9 5-9-5z" />
          <Path d="M3 13l9 5 9-5M3 16.5l9 5 9-5" />
        </Svg>
      );
    case "plus":
      return (
        <Svg {...common}>
          <Path d="M12 5v14M5 12h14" />
        </Svg>
      );
    case "search":
      return (
        <Svg {...common}>
          <Circle cx="11" cy="11" r="7" />
          <Path d="M21 21l-4.3-4.3" />
        </Svg>
      );
    case "lock":
      return (
        <Svg {...common}>
          <Rect x="5" y="11" width="14" height="9" rx="2" />
          <Path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </Svg>
      );
    case "chevron-left":
      return (
        <Svg {...common}>
          <Path d="M15 6l-6 6 6 6" />
        </Svg>
      );
    default:
      return null;
  }
}
