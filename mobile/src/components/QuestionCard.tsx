import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import type { Question } from "../utils/quiz";
import { describeQuestion, type QuizOption } from "../quiz/describeQuestion";
import FlagImage from "./FlagImage";
import { Badge, MapPanel } from "./ui";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
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
    <View className="gap-4">
      {/* Prompt */}
      <Animated.View key={question.id} entering={FadeInDown.duration(220)} className="gap-3">
        <Text className="text-[19px] font-extrabold text-ink">{described.subText}</Text>
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
      </Animated.View>

      {/* Options */}
      {described.layout === "flags" ? (
        <View className="flex-row flex-wrap justify-between gap-y-3">
          {described.options.map((o, i) => {
            const st = optionState(o);
            const ring =
              st === "correct" ? "border-success" : st === "wrong" ? "border-error" : "border-line";
            return (
              <Animated.View
                key={o.key}
                entering={FadeIn.delay(i * 40)}
                className={`w-[48%] rounded-2xl border-2 bg-paper p-2 ${ring} ${revealed && st === "idle" ? "opacity-45" : ""}`}
              >
                <Pressable disabled={revealed} onPress={() => onSelect(o)}>
                  <FlagImage code={o.flagCode!} width={320} className="border-0" />
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      ) : (
        <View className="gap-2.5">
          {described.options.map((o, i) => (
            <AnimatedPressable
              key={o.key}
              entering={FadeIn.delay(i * 40)}
              disabled={revealed}
              onPress={() => onSelect(o)}
              className={`flex-row items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 ${rowClasses(o)}`}
            >
              <Badge letter={LETTERS[i]} state={optionState(o)} />
              <Text className="flex-1 text-[19px] font-bold text-ink">{o.label}</Text>
            </AnimatedPressable>
          ))}
        </View>
      )}
    </View>
  );
}
