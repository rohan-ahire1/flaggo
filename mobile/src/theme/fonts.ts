import { StyleSheet, Text, TextInput } from "react-native";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black
} from "@expo-google-fonts/figtree";

// The fonts to load at startup (matches the hi-fi mock, which uses Figtree).
export const FIGTREE_FONTS = {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  Figtree_900Black
};

// Map a CSS/RN fontWeight to the matching named Figtree family. Named families
// carry their own weight, so we drop fontWeight to avoid faux-bold synthesis.
function familyForWeight(weight?: string | number): string {
  switch (String(weight ?? "400")) {
    case "500":
      return "Figtree_500Medium";
    case "600":
      return "Figtree_600SemiBold";
    case "700":
    case "bold":
      return "Figtree_700Bold";
    case "800":
      return "Figtree_800ExtraBold";
    case "900":
      return "Figtree_900Black";
    default:
      return "Figtree_400Regular";
  }
}

/**
 * Patch <Text>/<TextInput> so every text node app-wide renders in Figtree,
 * with the family chosen from the (NativeWind-produced) fontWeight. This lets
 * existing `font-semibold` / `font-bold` / `font-black` classes just work.
 */
export function applyFigtreeDefault() {
  for (const Comp of [Text, TextInput] as any[]) {
    const proto = Comp.render ? Comp : Comp.prototype;
    const original = Comp.render;
    if (!original || (Comp as any).__figtreePatched) continue;
    Comp.render = function render(...args: any[]) {
      const el = original.apply(this, args);
      const incoming = el.props?.style;
      const flat = StyleSheet.flatten(incoming);
      const family = familyForWeight(flat?.fontWeight);
      return {
        ...el,
        props: {
          ...el.props,
          // Family wins so Figtree always applies; leftover fontWeight is harmless.
          style: { ...flat, fontFamily: family }
        }
      };
    };
    (Comp as any).__figtreePatched = true;
    void proto;
  }
}
