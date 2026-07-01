import { View } from "react-native";

export default function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View className="h-3 w-full overflow-hidden rounded-full bg-surface-2">
      <View className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </View>
  );
}
