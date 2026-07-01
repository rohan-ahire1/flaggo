import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "@/components/Icon";
import ScreenHeader from "@/components/ScreenHeader";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import world110m from "@/data/world-110m.json";
import { countries } from "@/data/countries";
import { mapPresentCountries } from "@/utils/geo";
import { getPopularityGroups } from "@/utils/popularity";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { MapMode } from "@/utils/quiz";

type PickerMode = "tier" | "region";

export default function MapMenuScreen() {
  const theme = useThemeStore((s) => s.theme);
  const mapCountries = useMemo(() => mapPresentCountries(countries, world110m as never), []);
  const groups = useMemo(() => getPopularityGroups(mapCountries), [mapCountries]);
  const regions = useMemo(
    () => ["World", ...Array.from(new Set(mapCountries.map((c) => c.continent)))].filter(Boolean) as string[],
    [mapCountries]
  );
  const [mode, setMode] = useState<MapMode>("locate");
  const [picker, setPicker] = useState<PickerMode>("tier");
  const [selectedId, setSelectedId] = useState(groups[0]?.id ?? "World");

  const selectedCountries = useMemo(() => {
    if (picker === "region") {
      if (selectedId === "World") return mapCountries;
      return mapCountries.filter((c) => c.continent === selectedId);
    }
    return groups.find((g) => g.id === selectedId)?.countries ?? mapCountries;
  }, [groups, mapCountries, picker, selectedId]);

  function start() {
    const codes = selectedCountries.map((c) => c.code).join(",");
    router.push({ pathname: "/map/play", params: { mode, codes } });
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="World Map" subtitle="Locate or identify countries on the map." />
      <ScrollView contentContainerClassName="px-5 pb-8 gap-5 pt-2">
        <View className="gap-3">
          {(
            [
              ["locate", "Locate", "Tap the named country on the map.", "target"],
              ["identify", "Identify", "Name the highlighted country.", "globe"]
            ] as const
          ).map(([value, title, copy, iconName]) => {
            const on = mode === value;
            return (
              <Card
                key={value}
                onPress={() => setMode(value as MapMode)}
                className={`flex-row items-center gap-3 ${on ? "border-2 border-primary" : ""}`}
              >
                <View className={`h-11 w-11 items-center justify-center rounded-2xl ${on ? "bg-primary/15" : "bg-surface"}`}>
                  <Icon name={iconName} size={22} color={themeColor(theme, on ? "primary" : "muted")} />
                </View>
                <View className="flex-1">
                  <Text className="text-[18px] font-black text-ink">{title}</Text>
                  <Text className="text-[13px] font-semibold text-muted">{copy}</Text>
                </View>
              </Card>
            );
          })}
        </View>

        <View className="gap-2">
          <SectionLabel>Country set</SectionLabel>
          <View className="flex-row rounded-2xl bg-surface p-1">
            {(["tier", "region"] as PickerMode[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => {
                  setPicker(p);
                  setSelectedId(p === "tier" ? groups[0]?.id ?? "" : "World");
                }}
                className={`flex-1 items-center rounded-xl py-2.5 ${picker === p ? "bg-primary" : ""}`}
              >
                <Text className={`text-[14px] font-extrabold capitalize ${picker === p ? "text-white" : "text-muted"}`}>{p}</Text>
              </Pressable>
            ))}
          </View>
          <View className="gap-2">
            {(picker === "tier"
              ? groups.map((g) => ({ id: g.id, label: `${g.title} (${g.countries.length})` }))
              : regions.map((r) => ({
                  id: r,
                  label: `${r} (${r === "World" ? mapCountries.length : mapCountries.filter((c) => c.continent === r).length})`
                }))
            ).map((o) => {
              const on = o.id === selectedId;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setSelectedId(o.id)}
                  className={`rounded-2xl border-2 px-4 py-3 ${on ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
                >
                  <Text className={`text-[15px] font-black ${on ? "text-primary" : "text-ink"}`}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <PillButton label="Start map practice" variant="primary" icon="bolt" onPress={start} />
        <PillButton label="Explore map" variant="secondary" icon="globe" onPress={() => router.push("/map/explore")} />
      </ScrollView>
    </SafeAreaView>
  );
}
