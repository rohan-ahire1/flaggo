// The Kids Mode mascot: a smiley animated globe. Pure CSS/SVG — no art assets.
// Mood changes its face so it can react (cheer on a right answer, encourage on a
// wrong one). Matches the Flaggo Kids design mascot.

export type GlobeMood = "idle" | "happy" | "cheer" | "think";

export default function Globe({
  mood = "idle",
  size = 120,
  className = "",
  bob = false
}: {
  mood?: GlobeMood;
  size?: number;
  className?: string;
  /** Use the livelier bob (translate + rotate) instead of a gentle float. */
  bob?: boolean;
}) {
  const showCheeks = mood === "cheer" || mood === "happy";
  return (
    <div
      className={`${bob ? "animate-kid-bob" : "animate-float"} ${className}`}
      style={{ width: size, height: size, filter: "drop-shadow(0 8px 8px rgba(20,50,80,.22))" }}
      aria-hidden
    >
      <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: "block" }}>
        {/* Ocean sphere */}
        <circle cx="50" cy="50" r="47" fill="#43b8ea" />
        {/* Land blobs */}
        <path d="M20 42 Q30 30 44 38 Q50 44 42 52 Q30 56 24 50 Z" fill="#5cc85a" />
        <path d="M58 30 Q72 32 72 44 Q68 52 60 50 Q54 42 58 30 Z" fill="#5cc85a" />
        <path d="M60 62 Q72 62 70 72 Q60 76 56 68 Z" fill="#5cc85a" />
        {/* Highlight + rim */}
        <ellipse cx="36" cy="32" rx="18" ry="10" fill="#fff" opacity="0.18" />
        <circle cx="50" cy="50" r="47" fill="none" stroke="#2a97cf" strokeWidth="3" />
        {/* Cheeks */}
        {showCheeks && (
          <>
            <ellipse cx="33" cy="60" rx="6" ry="4" fill="#ff9db0" opacity="0.8" />
            <ellipse cx="67" cy="60" rx="6" ry="4" fill="#ff9db0" opacity="0.8" />
          </>
        )}
        {/* Face */}
        <Eyes mood={mood} />
        <Mouth mood={mood} />
      </svg>
    </div>
  );
}

function Eyes({ mood }: { mood: GlobeMood }) {
  const cy = mood === "cheer" ? 48 : 49;
  return (
    <g fill="#22314c">
      <ellipse cx="40" cy={cy} rx="4.6" ry="6" />
      <ellipse cx="60" cy={cy} rx="4.6" ry="6" />
      <circle cx="41.6" cy={cy - 2.4} r="1.5" fill="#fff" />
      <circle cx="61.6" cy={cy - 2.4} r="1.5" fill="#fff" />
    </g>
  );
}

function Mouth({ mood }: { mood: GlobeMood }) {
  if (mood === "cheer") {
    // Big open smile
    return (
      <>
        <ellipse cx="50" cy="64" rx="9" ry="7" fill="#22314c" />
        <ellipse cx="50" cy="67" rx="4" ry="3" fill="#ff7a90" />
      </>
    );
  }
  const d =
    mood === "think"
      ? "M46 63 Q50 66 54 63" // small curious
      : "M39 61 Q50 71 61 61"; // gentle smile (idle/happy)
  return <path d={d} stroke="#22314c" strokeWidth="3.6" fill="none" strokeLinecap="round" />;
}
