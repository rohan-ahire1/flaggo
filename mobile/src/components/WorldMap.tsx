import { useMemo } from "react";
import { Platform, View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { geoEqualEarth, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import world110m from "@flaggo/core/data/world-110m.json";
import type { Country } from "@flaggo/core/types/country";
import { buildCcn3Index, geoIdToCountry } from "@flaggo/core/utils/geo";
import { themeColor } from "@/theme/palettes";
import { useThemeStore } from "@/theme/store";

const W = 800;
const H = 440;

const AnimatedPath = Animated.createAnimatedComponent(Path);

const fc = feature(
  world110m as never,
  (world110m as { objects: { countries: unknown } }).objects.countries as never
) as unknown as GeoJSON.FeatureCollection;

const projection = geoEqualEarth().fitSize([W, H], fc);
const pathGen = geoPath(projection);

// Precompute path strings + ids once (module scope — the geometry never changes).
const SHAPES = fc.features.map((f) => ({
  id: f.id as string | number | undefined,
  d: pathGen(f) ?? ""
}));

export default function WorldMap({
  countries,
  highlightCode,
  correctCode,
  wrongCode,
  onCountryTap,
  interactive = true,
  height = 360
}: {
  countries: Country[];
  highlightCode?: string;
  correctCode?: string;
  wrongCode?: string;
  onCountryTap?: (code: string) => void;
  interactive?: boolean;
  height?: number;
}) {
  const theme = useThemeStore((s) => s.theme);
  const ccn3Index = useMemo(() => buildCcn3Index(countries), [countries]);

  const ocean = themeColor(theme, "surface2");
  const land = themeColor(theme, "paper");
  const landStroke = themeColor(theme, "muted");
  const primary = themeColor(theme, "primary");

  const shapes = useMemo(
    () =>
      SHAPES.map((s) => {
        const country = geoIdToCountry(s.id, ccn3Index);
        return { d: s.d, code: country?.code };
      }),
    [ccn3Index]
  );

  function fillFor(code?: string) {
    if (code && code === correctCode) return themeColor(theme, "success");
    if (code && code === wrongCode) return themeColor(theme, "error");
    if (code && code === highlightCode) return themeColor(theme, "accent");
    return land;
  }
  function strokeFor(code?: string) {
    if (code && (code === correctCode || code === wrongCode || code === highlightCode)) return primary;
    return landStroke;
  }

  // Pinch to zoom + pan.
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      startScale.value = scale.value;
    })
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(6, startScale.value * e.scale));
    });
  const pan = Gesture.Pan()
    .minPointers(1)
    .averageTouches(true)
    .onBegin(() => {
      startX.value = tx.value;
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      tx.value = startX.value + e.translationX;
      ty.value = startY.value + e.translationY;
    });
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      scale.value = withTiming(1);
      tx.value = withTiming(0);
      ty.value = withTiming(0);
    });
  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }]
  }));
  const webWheelProps =
    Platform.OS === "web"
      ? ({
          onWheel: (event: { preventDefault: () => void; deltaY: number }) => {
            event.preventDefault();
            const next = scale.value + (event.deltaY > 0 ? -0.25 : 0.25);
            scale.value = Math.max(1, Math.min(6, next));
          }
        } as Record<string, unknown>)
      : {};

  return (
    <View
      {...webWheelProps}
      style={{ height, backgroundColor: ocean }}
      className="overflow-hidden rounded-[24px] border border-line"
    >
      <GestureDetector gesture={gesture}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          <Svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
            <Rect x={0} y={0} width={W} height={H} fill={ocean} />
            {shapes.map((s, i) => (
              <AnimatedPath
                key={i}
                d={s.d}
                fill={fillFor(s.code)}
                stroke={strokeFor(s.code)}
                strokeWidth={0.7}
                onPress={() => {
                  if (interactive && s.code) onCountryTap?.(s.code);
                }}
              />
            ))}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
