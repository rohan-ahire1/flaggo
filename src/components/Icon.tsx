import type { SVGProps } from "react";

export type IconName =
  | "learn"
  | "review"
  | "library"
  | "stats"
  | "profile"
  | "check"
  | "lock"
  | "star"
  | "close"
  | "flame"
  | "coin"
  | "bolt"
  | "globe"
  | "trophy"
  | "search"
  | "chevron"
  | "x"
  | "heart"
  | "target"
  | "sparkle"
  | "today"
  | "play"
  | "flag"
  | "book"
  | "user"
  | "pin";

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
};

/**
 * Single-source icon set. Stroke-based, rounded joins to match the playful brand.
 * Use `currentColor` so icons inherit text color; pass `className` to size/color.
 */
export default function Icon({ name, size = 24, className = "", ...rest }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2.2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    "aria-hidden": true,
    ...rest
  };

  switch (name) {
    case "learn":
      return (
        <svg {...common}>
          <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H12v15.5H6.5A2.5 2.5 0 0 1 4 17V6.5Z" />
          <path d="M20 6.5A2.5 2.5 0 0 0 17.5 4H12v15.5h5.5A2.5 2.5 0 0 0 20 17V6.5Z" />
        </svg>
      );
    case "review":
      return (
        <svg {...common}>
          <path d="M3 12a9 9 0 1 0 3-6.7" />
          <path d="M3 4v4h4" />
        </svg>
      );
    case "library":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        </svg>
      );
    case "stats":
      return (
        <svg {...common}>
          <path d="M4 20V10" />
          <path d="M10 20V4" />
          <path d="M16 20v-7" />
          <path d="M3 20h18" />
        </svg>
      );
    case "profile":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
        </svg>
      );
    case "check":
      return (
        <svg {...common} strokeWidth={3}>
          <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </svg>
      );
    case "star":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.6l2.9 5.9 6.5.95-4.7 4.58 1.1 6.47L12 17.5 6.1 20.5l1.1-6.47L2.5 9.45l6.5-.95L12 2.6Z" />
        </svg>
      );
    case "close":
    case "x":
      return (
        <svg {...common} strokeWidth={2.6}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5c.4 3.2-1.6 4.6-2.9 6.2-1.3 1.6-2.1 3-2.1 5A5.1 5.1 0 0 0 12 19a5.1 5.1 0 0 0 5-5.3c0-1.2-.4-2.2-1-3-.3 1-1 1.7-1.8 1.9.5-2.6-.6-4.9-2.2-6.6-.7-.8-.9-2.3 0-3.5Z" />
        </svg>
      );
    case "coin":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v9M9.8 9.3c0-1 1-1.8 2.2-1.8s2.2.8 2.2 1.8-1 1.6-2.2 1.6-2.2.8-2.2 1.8 1 1.8 2.2 1.8 2.2-.8 2.2-1.8" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M13 2 4 13h6l-1 9 9-11h-6l1-9Z" />
        </svg>
      );
    case "globe":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.6 2.4 4 5.7 4 9s-1.4 6.6-4 9c-2.6-2.4-4-5.7-4-9s1.4-6.6 4-9Z" />
        </svg>
      );
    case "trophy":
      return (
        <svg {...common}>
          <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
          <path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />
          <path d="M12 13v3M9 20h6M10 20l.5-4h3l.5 4" />
        </svg>
      );
    case "search":
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.3-3.3" />
        </svg>
      );
    case "chevron":
      return (
        <svg {...common}>
          <path d="m9 6 6 6-6 6" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 20.5 4.3 13a4.6 4.6 0 0 1 6.5-6.5l1.2 1.2 1.2-1.2A4.6 4.6 0 0 1 19.7 13L12 20.5Z" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M12 2.5c.5 3.8 1.7 5 5.5 5.5-3.8.5-5 1.7-5.5 5.5-.5-3.8-1.7-5-5.5-5.5 3.8-.5 5-1.7 5.5-5.5Z" />
          <path d="M18.5 13.5c.3 1.9.8 2.4 2.7 2.7-1.9.3-2.4.8-2.7 2.7-.3-1.9-.8-2.4-2.7-2.7 1.9-.3 2.4-.8 2.7-2.7Z" />
        </svg>
      );
    case "today":
      return (
        <svg {...common}>
          <rect x="3" y="4.5" width="18" height="16" rx="3" />
          <path d="M3 9h18M8 2.5v4M16 2.5v4" />
        </svg>
      );
    case "play":
      return (
        <svg {...common} fill="currentColor" stroke="none">
          <path d="M7 4.5v15l12-7.5z" />
        </svg>
      );
    case "flag":
      return (
        <svg {...common}>
          <path d="M6 21V4" />
          <path d="M6 4h11l-2.5 4L17 12H6" />
        </svg>
      );
    case "book":
      return (
        <svg {...common}>
          <path d="M4 5.5A2 2 0 0 1 6 4h6v16H6a2 2 0 0 0-2 1.2z" />
          <path d="M20 5.5A2 2 0 0 0 18 4h-6v16h6a2 2 0 0 1 2 1.2z" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
        </svg>
      );
    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s6.5-5.6 6.5-10.5A6.5 6.5 0 1 0 5.5 10.5C5.5 15.4 12 21 12 21z" />
          <circle cx="12" cy="10" r="2.4" />
        </svg>
      );
    default:
      return null;
  }
}
