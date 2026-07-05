import { Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Question } from "@flaggo/core/utils/quiz";
import { describeQuestion, type QuizOption } from "../quiz/describeQuestion";
import FlagImage from "./FlagImage";
import { Badge, MapPanel } from "./ui";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

// Controlled question view: the parent owns answered/selected state and the
// Next button, so this just renders the prompt + option rows for one question.
export default function QuestionCard({
  question,
  revealed,
  selectedKey,
  onSelect
}: {
  question: Question;
  revealed: boolean;
  selectedKey: string | null;
  onSelect: (option: QuizOption) => void;
}) {
  const described = describeQuestion(question);

  function optionState(o: QuizOption): "idle" | "correct" | "wrong" {
    if (!revealed) return "idle";
    if (o.correct) return "correct";
    if (o.key === selectedKey) return "wrong";
    return "idle";
  }

  function rowClasses(o: QuizOption) {
    const st = optionState(o);
    if (st === "correct") return "border-success bg-success/15";
    if (st === "wrong") return "border-error bg-error/15";
    if (revealed) return "border-line bg-paper opacity-45";
    return "border-line bg-paper";
  }

  return (
    <View className="gap-4 lg:gap-5">
      {/* Prompt */}
      <Animated.View key={question.id} entering={FadeInDown.duration(220)}>
        <View className="gap-3 lg:items-center">
          <Text className="text-[19px] font-extrabold text-ink lg:text-center">{described.subText}</Text>
          {described.promptFlagCode ? (
            <MapPanel height={190}>
              <FlagImage code={described.promptFlagCode} width={640} className="w-44 border-0" />
            </MapPanel>
          ) : null}
          {described.promptText ? (
            <MapPanel height={described.promptFlagCode ? 90 : 150}>
              <Text className="px-4 text-center text-3xl font-black text-ink">{described.promptText}</Text>
            </MapPanel>
          ) : null}
        </View>
      </Animated.View>

      {/* Options */}
      {described.layout === "flags" ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {described.options.map((o) => {
            const st = optionState(o);
            const ring =
              st === "correct" ? "border-success" : st === "wrong" ? "border-error" : "border-line";
            return (
              <View
                key={o.key}
                className={`w-[48%] rounded-2xl border-2 bg-paper p-2 md:w-[23.5%] ${ring} ${revealed && st === "idle" ? "opacity-45" : ""}`}
              >
                <Pressable disabled={revealed} onPress={() => onSelect(o)}>
                  <FlagImage code={o.flagCode!} width={320} className="border-0" />
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <View className="gap-2.5 md:flex-row md:flex-wrap md:justify-between md:gap-y-3">
          {described.options.map((o, i) => (
            <View key={o.key} className="md:w-[48.5%]">
              <Pressable
                disabled={revealed}
                onPress={() => onSelect(o)}
                className={`flex-row items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 ${rowClasses(o)}`}
              >
                <Badge letter={LETTERS[i]} state={optionState(o)} />
                <Text className="flex-1 text-[19px] font-bold text-ink">{o.label}</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
