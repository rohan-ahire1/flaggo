import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import Icon from "@/components/Icon";
import ScreenHeader from "@/components/ScreenHeader";
import { Card, PillButton, SectionLabel } from "@/components/ui";
import { countries } from "@/data/countries";
import { useProgress } from "@/state/ProgressProvider";
import {
  buildWeakDeck,
  countryCodesByRegion,
  createDeck,
  deckCountries,
  STARRED_DECK_ID
} from "@/utils/decks";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";
import type { Deck } from "@/types/progress";
import type { Topic } from "@/types/topic";

const REGIONS = ["Africa", "Americas", "Asia", "Europe", "Oceania"];

export default function DecksScreen() {
  const { progress, setProgress } = useProgress();
  const theme = useThemeStore((s) => s.theme);
  const [topic, setTopic] = useState<Topic>(progress.selectedTopic === "capital" ? "capital" : "flag");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [name, setName] = useState("");

  const decks = progress.decks.filter((d) => d.topic === topic);
  const filtered = useMemo(
    () =>
      countries
        .filter((c) => c.name.toLowerCase().includes(query.toLowerCase()) && (topic !== "capital" || c.capital?.trim()))
        .slice(0, 60),
    [query, topic]
  );

  function addDeck(deck: Deck) {
    setProgress({
      ...progress,
      decks: [...progress.decks.filter((d) => d.id !== deck.id || d.topic !== deck.topic), deck]
    });
  }
  function removeDeck(deck: Deck) {
    setProgress({ ...progress, decks: progress.decks.filter((d) => d !== deck) });
  }
  function practice(deck: Deck) {
    router.push({ pathname: "/quiz", params: { mode: "deck", deckId: deck.id, topic: deck.topic } });
  }
  function createManual() {
    if (!selected.length) return;
    addDeck(createDeck(name || "Custom deck", selected, topic));
    setSelected([]);
    setName("");
  }

  return (
    <SafeAreaView className="flex-1 bg-paper" edges={["top", "bottom"]}>
      <ScreenHeader title="Decks" subtitle="Build & drill your own sets." />
      <ScrollView contentContainerClassName="px-5 pb-8 gap-5 pt-2" keyboardShouldPersistTaps="handled">
        <View className="flex-row rounded-2xl bg-surface p-1">
          {(["flag", "capital"] as Topic[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setTopic(t)}
              className={`flex-1 items-center rounded-xl py-2.5 ${topic === t ? "bg-primary" : ""}`}
            >
              <Text className={`text-[14px] font-extrabold capitalize ${topic === t ? "text-white" : "text-muted"}`}>{t}</Text>
            </Pressable>
          ))}
        </View>

        {decks.length ? (
          <View className="gap-3">
            <SectionLabel>Your decks</SectionLabel>
            {decks.map((deck) => {
              const size = deckCountries(deck, countries).length;
              return (
                <Card key={`${deck.id}-${deck.topic}`} className="gap-3">
                  <View className="flex-row items-center gap-3">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent/20">
                      <Icon name={deck.id === STARRED_DECK_ID ? "star" : "layers"} size={22} color={themeColor(theme, "accent")} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[18px] font-black text-ink" numberOfLines={1}>
                        {deck.name}
                      </Text>
                      <Text className="font-bold text-muted">{size} countries</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <PillButton label="Practice" variant="primary" onPress={() => practice(deck)} />
                    </View>
                    <Pressable
                      onPress={() => removeDeck(deck)}
                      className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-surface"
                    >
                      <Icon name="x" size={22} color={themeColor(theme, "muted")} />
                    </Pressable>
                  </View>
                </Card>
              );
            })}
          </View>
        ) : null}

        <View className="gap-3">
          <SectionLabel>Quick builders</SectionLabel>
          <PillButton
            label="Weak countries"
            variant="secondary"
            icon="heart"
            onPress={() => {
              const codes = buildWeakDeck(progress, topic);
              if (codes.length) addDeck(createDeck("Weak countries", codes, topic));
            }}
          />
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {REGIONS.map((r) => (
              <Pressable
                key={r}
                onPress={() => addDeck(createDeck(r, countryCodesByRegion(countries, r), topic))}
                className="w-[48%] items-center rounded-2xl border-2 border-line bg-paper py-3"
              >
                <Text className="text-[15px] font-black text-ink">{r}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <SectionLabel>Manual deck</SectionLabel>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Deck name"
            placeholderTextColor={themeColor(theme, "muted")}
            className="rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] font-semibold text-ink"
          />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search countries"
            placeholderTextColor={themeColor(theme, "muted")}
            className="rounded-2xl border-2 border-line bg-paper px-4 py-3 text-[16px] font-semibold text-ink"
          />
          <View className="flex-row flex-wrap gap-2">
            {filtered.map((c) => {
              const active = selected.includes(c.code);
              return (
                <Pressable
                  key={c.code}
                  onPress={() =>
                    setSelected((v) => (active ? v.filter((x) => x !== c.code) : [...v, c.code]))
                  }
                  className={`rounded-xl border-2 px-3 py-2 ${active ? "border-primary bg-primary/10" : "border-line bg-paper"}`}
                >
                  <Text className={`text-[13px] font-bold ${active ? "text-primary" : "text-ink"}`}>{c.name}</Text>
                </Pressable>
              );
            })}
          </View>
          <PillButton
            label={`Create deck${selected.length ? ` (${selected.length})` : ""}`}
            variant="primary"
            icon="plus"
            onPress={createManual}
            className={selected.length ? "" : "opacity-40"}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
