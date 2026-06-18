import { useEffect, useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Sphere, ZoomableGroup } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import world110m from "../data/world-110m.json";
import type { Country } from "../types/country";
import { buildCcn3Index, geoIdToCountry, normalizeCcn3 } from "../utils/geo";
import Icon from "./Icon";

type Position = {
  coordinates: [number, number];
  zoom: number;
};

const defaultPosition: Position = { coordinates: [0, 20], zoom: 1 };
const countriesFeatureCollection = feature(
  world110m as never,
  (world110m as { objects: { countries: unknown } }).objects.countries as never
) as unknown as GeoJSON.FeatureCollection;

export default function WorldMap({
  countries,
  highlightCode,
  correctCode,
  wrongCode,
  onCountryTap,
  interactive = true,
  mapClassName = "h-[360px] w-full"
}: {
  countries: Country[];
  highlightCode?: string;
  correctCode?: string;
  wrongCode?: string;
  onCountryTap?: (code: string) => void;
  interactive?: boolean;
  mapClassName?: string;
}) {
  const ccn3Index = useMemo(() => buildCcn3Index(countries), [countries]);
  const codeToCcn3 = useMemo(() => new Map(countries.filter((country) => country.ccn3).map((country) => [country.code, country.ccn3!])), [countries]);
  const [position, setPosition] = useState<Position>(defaultPosition);

  useEffect(() => {
    if (!highlightCode) return;
    const targetCcn3 = codeToCcn3.get(highlightCode);
    const targetFeature = countriesFeatureCollection.features.find((item) => normalizeCcn3(item.id as string | number | undefined) === targetCcn3);
    if (!targetFeature) return;
    const [longitude, latitude] = geoCentroid(targetFeature);
    setPosition({ coordinates: [longitude, latitude], zoom: 2.8 });
  }, [codeToCcn3, highlightCode]);

  const OCEAN = "#CDE7FA";
  const LAND = "#EAF2D9";
  const LAND_STROKE = "#9FB870";

  function fillFor(code?: string) {
    if (code === correctCode) return "#A8E66B";
    if (code === wrongCode) return "#FFB0B0";
    if (code === highlightCode) return "#7FD0F7";
    return LAND;
  }

  function strokeFor(code?: string) {
    if (code === correctCode) return "#46A302";
    if (code === wrongCode) return "#E63939";
    if (code === highlightCode) return "#1899D6";
    return LAND_STROKE;
  }

  function zoom(delta: number) {
    setPosition((value) => ({ ...value, zoom: Math.max(1, Math.min(8, value.zoom + delta)) }));
  }

  return (
    <div className="relative overflow-hidden rounded-[24px] border border-flaggo-border shadow-card" style={{ backgroundColor: OCEAN }}>
      <div className="absolute right-3 top-3 z-10 grid gap-2">
        <button
          type="button"
          onClick={() => zoom(0.8)}
          aria-label="Zoom in"
          className="grid h-10 w-10 place-items-center rounded-full border border-flaggo-border bg-white font-display text-xl font-black text-flaggo-text shadow-card"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoom(-0.8)}
          aria-label="Zoom out"
          className="grid h-10 w-10 place-items-center rounded-full border border-flaggo-border bg-white font-display text-xl font-black text-flaggo-text shadow-card"
        >
          -
        </button>
        <button
          type="button"
          onClick={() => setPosition(defaultPosition)}
          aria-label="Reset map view"
          className="grid h-10 w-10 place-items-center rounded-full border border-flaggo-border bg-white text-flaggo-muted shadow-card"
        >
          <Icon name="target" size={18} />
        </button>
      </div>
      <ComposableMap projectionConfig={{ rotate: [-10, 0, 0], scale: 145 }} className={`touch-none ${mapClassName}`} style={{ touchAction: "none" }}>
        <ZoomableGroup
          center={position.coordinates}
          zoom={position.zoom}
          minZoom={1}
          maxZoom={8}
          onMoveEnd={(next) => setPosition(next as Position)}
        >
          <Sphere id="ocean-sphere" fill={OCEAN} stroke="#A6CDE8" strokeWidth={0.5} />
          <Graticule stroke="#B9DAF1" strokeWidth={0.4} />
          <Geographies geography={world110m}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const country = geoIdToCountry(geo.id, ccn3Index);
                const code = country?.code;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={interactive && code ? 0 : -1}
                    role={interactive && code ? "button" : undefined}
                    aria-label={country?.name}
                    onClick={() => {
                      if (interactive && code) onCountryTap?.(code);
                    }}
                    onKeyDown={(event) => {
                      if (!interactive || !code) return;
                      if (event.key === "Enter" || event.key === " ") onCountryTap?.(code);
                    }}
                    style={{
                      default: { fill: fillFor(code), stroke: strokeFor(code), strokeWidth: 0.7, outline: "none" },
                      hover: { fill: interactive && code ? "#F0FBFF" : fillFor(code), stroke: "#1CB0F6", strokeWidth: 0.9, outline: "none", cursor: interactive && code ? "pointer" : "default" },
                      pressed: { fill: "#DBF1FE", stroke: "#1CB0F6", strokeWidth: 1, outline: "none" }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
    </div>
  );
}
