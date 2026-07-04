import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "@/components/Icon";
import FlagImage from "@/components/FlagImage";
import ScreenHeader from "@/components/ScreenHeader";
import { countries } from "@/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import { isStarred, toggleStarredDeck } from "@/utils/decks";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

const CONTINENTS = ["All", "Africa", "Americas", "Asia", "Europe", "Oceania"];

export default function LibraryScreen() {
  const { progress, setProgress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const [query, setQuery] = useState("");
  const [continent, setContinent] = useState("All");
  const topic = progress.selectedTopic === "location" ? "flag" : progress.selectedTopic;

  const filtered = useMemo(
    () =>
      countries
        .filter((c) => {
          if (query && !c.name.toLowerCase().includes(query.toLowerCase())) return false;
          if (continent !== "All" && c.continent !== continent) return false;
          return true;
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [query, continent]
  );

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Flag library" subtitle={`${filtered.length} countries`} />
      <View className="w-full max-w-[1120px] self-center gap-3 px-5 pb-2 pt-2 lg:px-8">
        <View className="flex-row items-center gap-2 rounded-2xl border-2 border-line bg-paper px-3.5 py-2.5">
          <Icon name="search" size={18} color={themeColor(theme, "muted")} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search flags"
            placeholderTextColor={themeColor(theme, "muted")}
            className="flex-1 text-[16px] font-semibold text-ink"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {CONTINENTS.map((c) => {
            const on = c === continent;
            return (
              <Pressable
                key={c}
                onPress={() => setContinent(c)}
                className={`rounded-full border-2 px-4 py-1.5 ${on ? "border-primary bg-primary" : "border-line bg-surface"}`}
              >
                <Text className={`text-[13px] font-extrabold ${on ? "text-white" : "text-ink"}`}>{c}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerClassName="w-full max-w-[1120px] self-center px-5 pb-8 pt-1 lg:px-8">
        <View className="flex-row flex-wrap justify-between gap-y-4">
          {filtered.map((c) => {
            const starred = isStarred(progress, c.code, topic);
            return (
              <View key={c.code} className="w-[31%] md:w-[18.5%] lg:w-[13.5%]">
                <View className="relative">
                  <FlagImage code={c.code} width={160} />
                  <Pressable
                    onPress={() => setProgress(toggleStarredDeck(progress, c.code, topic))}
                    hitSlop={8}
                    className={`absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full ${starred ? "bg-accent" : "bg-ink/45"}`}
                  >
                    <Icon name="star" size={13} color="#ffffff" />
                  </Pressable>
                </View>
                <Text className="mt-1 text-[12px] font-bold text-ink" numberOfLines={1}>
                  {c.name}
                </Text>
              </View>
            );
          })}
        </View>
        {filtered.length === 0 ? (
          <Text className="mt-8 text-center font-bold text-muted">No flags match those filters.</Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
