import type { SVGProps } from "react";
import {
  BookOpenIcon,
  BooksIcon,
  CalendarDotsIcon,
  CaretRightIcon,
  ChartBarIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  CoinIcon,
  FireIcon,
  FlagIcon,
  GlobeHemisphereWestIcon,
  GraduationCapIcon,
  HeartIcon,
  type Icon as PhosphorIcon,
  LightningIcon,
  LockIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PlayIcon,
  SparkleIcon,
  StarIcon,
  TargetIcon,
  TrophyIcon,
  UserCircleIcon,
  UserIcon,
  XIcon,
  type IconWeight
} from "@phosphor-icons/react";

export type IconName =
  | "learn"
  | "review"
  | "library"
  | "stats"
  | "profile"
  | "check"
  | "lock"
  | "star"
  | "close"
  | "flame"
  | "coin"
  | "bolt"
  | "globe"
  | "trophy"
  | "search"
  | "chevron"
  | "x"
  | "heart"
  | "target"
  | "sparkle"
  | "today"
  | "play"
  | "flag"
  | "book"
  | "user"
  | "pin";

type Props = SVGProps<SVGSVGElement> & {
  name: IconName;
  size?: number;
  weight?: IconWeight;
};

/**
 * Single-source icon set — Phosphor "duotone": a soft filled base plus a
 * darker detail line, both inheriting the current text color. This warm,
 * rounded style matches the cartographic brand (cream + teal, Fredoka type,
 * dotted textures). Swap the whole look here; call sites never change.
 *
 * ICON_SCALE nudges every icon up a touch so they don't read small against
 * the chunky type — tune here rather than at each call site.
 */
const GLYPH: Record<IconName, PhosphorIcon> = {
  learn: GraduationCapIcon,
  review: ClockCounterClockwiseIcon,
  library: BooksIcon,
  stats: ChartBarIcon,
  profile: UserCircleIcon,
  check: CheckIcon,
  lock: LockIcon,
  star: StarIcon,
  close: XIcon,
  x: XIcon,
  flame: FireIcon,
  coin: CoinIcon,
  bolt: LightningIcon,
  globe: GlobeHemisphereWestIcon,
  trophy: TrophyIcon,
  search: MagnifyingGlassIcon,
  chevron: CaretRightIcon,
  heart: HeartIcon,
  target: TargetIcon,
  sparkle: SparkleIcon,
  today: CalendarDotsIcon,
  play: PlayIcon,
  flag: FlagIcon,
  book: BookOpenIcon,
  user: UserIcon,
  pin: MapPinIcon
};

const ICON_SCALE = 1.15;

export default function Icon({ name, size = 24, weight = "duotone", className = "", ...rest }: Props) {
  const Glyph = GLYPH[name];
  return <Glyph size={Math.round(size * ICON_SCALE)} weight={weight} className={className} aria-hidden {...rest} />;
}
