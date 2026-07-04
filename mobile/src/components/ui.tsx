import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Line } from "react-native-svg";
import Icon, { type IconName } from "./Icon";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

// Soft card shadow used throughout the hi-fi mock.
export const softShadow: ViewStyle = {
  shadowColor: "#141e28",
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3
};

export function Card({
  children,
  className = "",
  style,
  onPress
}: {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const base = `rounded-[20px] border border-line bg-paper p-4 ${className}`;
  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [softShadow, StyleSheet.flatten(style), pressed ? { opacity: 0.86 } : null]}
        className={base}
      >
        {children}
      </Pressable>
    );
  }
  return (
    <View style={[softShadow, StyleSheet.flatten(style)]} className={base}>
      {children}
    </View>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Text className="text-[13px] font-extrabold uppercase tracking-[2px] text-muted">{children}</Text>
  );
}

type ButtonVariant = "primary" | "secondary" | "light";

export function PillButton({
  label,
  onPress,
  variant = "primary",
  icon,
  iconRight,
  className = ""
}: {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  className?: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const styles: Record<ButtonVariant, { box: string; text: string; icon: string }> = {
    primary: { box: "bg-primary", text: "text-white", icon: "#ffffff" },
    secondary: { box: "border-2 border-line bg-surface", text: "text-ink", icon: themeColor(theme, "ink") },
    light: { box: "bg-paper", text: "text-primary", icon: themeColor(theme, "primary") }
  };
  const s = styles[variant];
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        variant !== "secondary" ? softShadow : undefined,
        pressed ? { opacity: 0.86 } : null
      ]}
      className={`flex-row items-center justify-center gap-2 rounded-2xl px-6 py-4 ${s.box} ${className}`}
    >
      {icon ? <Icon name={icon} size={20} color={s.icon} /> : null}
      <Text className={`text-[17px] font-extrabold ${s.text}`}>{label}</Text>
      {iconRight ? <Icon name={iconRight} size={20} color={s.icon} /> : null}
    </Pressable>
  );
}

// Small rounded-full stat chip (streak / timer / score).
export function Pill({
  icon,
  label,
  tone = "ink",
  className = ""
}: {
  icon?: IconName;
  label: string;
  tone?: "ink" | "accent" | "success" | "error" | "muted";
  className?: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const toneColor = themeColor(theme, tone === "ink" ? "ink" : tone);
  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 ${className}`}
    >
      {icon ? <Icon name={icon} size={15} color={toneColor} /> : null}
      <Text className="text-[14px] font-extrabold text-ink">{label}</Text>
    </View>
  );
}

// Letter badge (A/B/C/D) for answer rows.
export function Badge({
  letter,
  state = "idle"
}: {
  letter: string;
  state?: "idle" | "correct" | "wrong";
}) {
  const box =
    state === "correct"
      ? "border-success bg-success/25"
      : state === "wrong"
        ? "border-error bg-error/25"
        : "border-line bg-surface";
  const text =
    state === "correct" ? "text-success" : state === "wrong" ? "text-error" : "text-muted";
  return (
    <View className={`h-[30px] w-[30px] items-center justify-center rounded-[9px] border-2 ${box}`}>
      <Text className={`text-[15px] font-extrabold ${text}`}>{letter}</Text>
    </View>
  );
}

// Circular score ring with a big fraction in the center.
export function ScoreRing({
  score,
  total,
  size = 150,
  caption
}: {
  score: number;
  total: number;
  size?: number;
  caption?: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total > 0 ? score / total : 0;
  return (
    <View style={{ width: size, height: size }} className="items-center justify-center">
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={themeColor(theme, "surface2")}
          strokeWidth={stroke}
          fill={themeColor(theme, "primary")}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={themeColor(theme, "accent")}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          fill="none"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text className="text-[40px] font-black text-white">
        {score}/{total}
      </Text>
      {caption ? <Text className="text-[13px] font-bold text-white/70">{caption}</Text> : null}
    </View>
  );
}

// Faint map-grid panel that frames the flag on the quiz screen.
export function MapPanel({
  children,
  height = 200,
  className = ""
}: {
  children?: ReactNode;
  height?: number;
  className?: string;
}) {
  const theme = useThemeStore((s) => s.theme);
  const line = themeColor(theme, "line");
  const step = 28;
  const cols = 18;
  const rows = Math.ceil(height / step) + 1;
  return (
    <View
      style={{ height }}
      className={`overflow-hidden rounded-[18px] border border-line bg-map ${className}`}
    >
      <Svg width="100%" height={height} style={{ position: "absolute" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={height} stroke={line} strokeWidth={1} opacity={0.4} />
        ))}
        {Array.from({ length: rows }).map((_, i) => (
          <Line key={`h${i}`} x1={0} y1={i * step} x2="100%" y2={i * step} stroke={line} strokeWidth={1} opacity={0.4} />
        ))}
      </Svg>
      <View className="flex-1 items-center justify-center p-4">{children}</View>
    </View>
  );
}
