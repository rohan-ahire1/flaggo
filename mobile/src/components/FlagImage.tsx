import { Image } from "expo-image";
import { View } from "react-native";

// flagcdn serves SVG (which RN's <Image> can't render) and PNG. We always use
// the PNG raster variant, keyed by the ISO alpha-2 code. expo-image caches it.
export function flagPng(code: string, width = 320) {
  return `https://flagcdn.com/w${width}/${code.toLowerCase()}.png`;
}

export default function FlagImage({
  code,
  className,
  width = 320
}: {
  code: string;
  className?: string;
  width?: number;
}) {
  return (
    <View className={`overflow-hidden rounded-2xl border border-line bg-white ${className ?? ""}`}>
      <Image
        source={{ uri: flagPng(code, width) }}
        style={{ width: "100%", aspectRatio: 3 / 2 }}
        contentFit="cover"
        transition={150}
        cachePolicy="disk"
      />
    </View>
  );
}
