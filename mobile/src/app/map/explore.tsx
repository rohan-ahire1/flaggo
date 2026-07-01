import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import FlagImage from "@/components/FlagImage";
import ScreenHeader from "@/components/ScreenHeader";
import { Card } from "@/components/ui";
import WorldMap from "@/components/WorldMap";
import { countries } from "@/data/countries";
import type { Country } from "@/types/country";

export default function ExploreMapScreen() {
  const byCode = useMemo(() => new Map(countries.map((c) => [c.code, c])), []);
  const [selected, setSelected] = useState<Country | null>(null);

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Explore" subtitle="Pinch to zoom, drag to pan, tap a country." />
      <View className="flex-1 px-5 pt-2">
        <WorldMap
          countries={countries}
          highlightCode={selected?.code}
          interactive
          onCountryTap={(code) => setSelected(byCode.get(code) ?? null)}
          height={420}
        />
        <View className="mt-4">
          {selected ? (
            <Card className="flex-row items-center gap-3">
              <View className="w-16">
                <FlagImage code={selected.code} width={160} />
              </View>
              <View className="flex-1">
                <Text className="text-[20px] font-black text-ink">{selected.name}</Text>
                <Text className="text-[13px] font-semibold text-muted">
                  {[selected.capital, selected.continent].filter(Boolean).join(" · ")}
                </Text>
                {typeof selected.population === "number" ? (
                  <Text className="text-[13px] font-semibold text-muted">
                    Pop. {selected.population.toLocaleString()}
                  </Text>
                ) : null}
              </View>
            </Card>
          ) : (
            <Card>
              <Text className="text-center font-semibold text-muted">Tap a country to see details.</Text>
            </Card>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
