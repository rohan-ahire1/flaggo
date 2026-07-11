import { useEffect, useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography, Graticule, Marker, Sphere } from "react-simple-maps";
import { geoCentroid } from "d3-geo";
import { feature } from "topojson-client";
import world110m from "@flaggo/core/data/world-110m.json";
import type { Country } from "@flaggo/core/types/country";
import { buildCcn3Index, geoIdToCountry, normalizeCcn3 } from "@flaggo/core/utils/geo";
import Icon from "./Icon";

type Rotation = [number, number, number];

const DEFAULT_ROTATION: Rotation = [-10, -18, 0];
const DEFAULT_SCALE = 300;
const MIN_SCALE = 210;
const MAX_SCALE = 1600;

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
  mapClassName = "h-[400px] w-full"
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

  const [rotation, setRotation] = useState<Rotation>(DEFAULT_ROTATION);
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const [markerCoords, setMarkerCoords] = useState<[number, number] | null>(null);

  // Refs drive the animation loop without forcing a render on every read.
  const rotationRef = useRef<Rotation>(DEFAULT_ROTATION);
  const focusRef = useRef<Rotation | null>(null); // target rotation to ease toward (identify)
  const draggingRef = useRef(false);
  const didDragRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistanceRef = useRef<number | null>(null);

  // When a country is highlighted (identify mode), ease the globe to face it and
  // drop a marker. In locate mode there is no highlight, so the globe free-spins
  // and the answer is never revealed.
  useEffect(() => {
    if (!highlightCode) {
      focusRef.current = null;
      setMarkerCoords(null);
      return;
    }
    const targetCcn3 = codeToCcn3.get(highlightCode);
    const targetFeature = countriesFeatureCollection.features.find((item) => normalizeCcn3(item.id as string | number | undefined) === targetCcn3);
    if (!targetFeature) return;
    const [longitude, latitude] = geoCentroid(targetFeature);
    focusRef.current = [-longitude, -latitude, 0];
    setMarkerCoords([longitude, latitude]);
  }, [codeToCcn3, highlightCode]);

  // Single rAF loop: ease toward a focus target if set, otherwise gently spin
  // while idle. Dragging and identify-mode holds both pause the idle spin.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const cur = rotationRef.current;
      const focus = focusRef.current;
      if (focus) {
        const dl = focus[0] - cur[0];
        const dp = focus[1] - cur[1];
        if (Math.abs(dl) < 0.15 && Math.abs(dp) < 0.15) {
          rotationRef.current = focus;
          focusRef.current = null;
          setRotation(focus);
        } else {
          const next: Rotation = [cur[0] + dl * 0.12, cur[1] + dp * 0.12, 0];
          rotationRef.current = next;
          setRotation(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [highlightCode]);

  function applyRotation(next: Rotation) {
    rotationRef.current = next;
    setRotation(next);
  }

  function onPointerDown(event: React.PointerEvent) {
    pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointersRef.current.size >= 2) {
      draggingRef.current = false;
      didDragRef.current = true;
      pinchDistanceRef.current = distanceBetweenPointers();
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }
    draggingRef.current = true;
    didDragRef.current = false;
    focusRef.current = null;
    lastPtRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event: React.PointerEvent) {
    if (pointersRef.current.has(event.pointerId)) {
      pointersRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }
    if (pointersRef.current.size >= 2) {
      event.preventDefault();
      const nextDistance = distanceBetweenPointers();
      const previousDistance = pinchDistanceRef.current;
      if (nextDistance && previousDistance) {
        zoom(nextDistance / previousDistance);
      }
      pinchDistanceRef.current = nextDistance;
      didDragRef.current = true;
      return;
    }
    if (!draggingRef.current || !lastPtRef.current) return;
    const dx = event.clientX - lastPtRef.current.x;
    const dy = event.clientY - lastPtRef.current.y;
    lastPtRef.current = { x: event.clientX, y: event.clientY };
    if (Math.abs(dx) + Math.abs(dy) > 2) didDragRef.current = true;
    const sensitivity = 0.4 * (DEFAULT_SCALE / scale);
    const cur = rotationRef.current;
    applyRotation([cur[0] + dx * sensitivity, Math.max(-89, Math.min(89, cur[1] - dy * sensitivity)), 0]);
  }

  function endDrag(event?: React.PointerEvent) {
    if (event) pointersRef.current.delete(event.pointerId);
    if (pointersRef.current.size < 2) pinchDistanceRef.current = null;
    draggingRef.current = false;
    lastPtRef.current = null;
  }

  function distanceBetweenPointers() {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return null;
    const [a, b] = points;
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function zoom(factor: number) {
    setScale((value) => Math.max(MIN_SCALE, Math.min(MAX_SCALE, value * factor)));
  }

  function resetView() {
    focusRef.current = null;
    applyRotation(DEFAULT_ROTATION);
    setScale(DEFAULT_SCALE);
  }

  useEffect(() => {
    const node = mapRef.current;
    if (!node) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      zoom(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    };
    node.addEventListener("wheel", wheel, { passive: false });
    return () => node.removeEventListener("wheel", wheel);
  }, []);

  // Deep-ocean atlas palette — fixed, independent of the active theme so the
  // globe always reads with strong land/water contrast.
  const OCEAN = "rgb(15 76 92)";
  const OCEAN_RIM = "rgb(9 50 62)";
  const LAND = "rgb(232 217 181)";
  const LAND_STROKE = "rgb(120 96 54)";
  const GRATICULE = "rgb(255 255 255 / 0.14)";
  const ACCENT = "rgb(var(--accent))";

  function fillFor(code?: string) {
    if (!code) return LAND;
    if (code === correctCode) return "rgb(var(--success) / 0.75)";
    if (code === wrongCode) return "rgb(var(--error) / 0.7)";
    if (code === highlightCode) return "rgb(var(--accent) / 0.85)";
    return LAND;
  }

  function strokeFor(code?: string) {
    if (!code) return LAND_STROKE;
    if (code === correctCode) return "rgb(var(--success))";
    if (code === wrongCode) return "rgb(var(--error))";
    if (code === highlightCode) return "rgb(var(--accent))";
    return LAND_STROKE;
  }

  return (
    <div
      ref={mapRef}
      className={`relative touch-none select-none overflow-hidden rounded-[24px] border border-line shadow-card ${mapClassName}`}
      style={{ backgroundColor: OCEAN_RIM, cursor: draggingRef.current ? "grabbing" : "grab" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={() => zoom(1.6)}
    >
      <div className="pointer-events-none absolute right-3 top-3 z-10 grid gap-2">
        <button
          type="button"
          onClick={() => zoom(1.3)}
          aria-label="Zoom in"
          className="icon-btn pointer-events-auto font-display text-xl font-black text-ink"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => zoom(1 / 1.3)}
          aria-label="Zoom out"
          className="icon-btn pointer-events-auto font-display text-xl font-black text-ink"
        >
          -
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="Reset globe view"
          className="icon-btn pointer-events-auto text-muted"
        >
          <Icon name="target" size={18} />
        </button>
      </div>
      <ComposableMap
        projection="geoOrthographic"
        projectionConfig={{ rotate: rotation, scale }}
        preserveAspectRatio="xMidYMid meet"
        className="h-full w-full touch-none"
        style={{ touchAction: "none" }}
      >
        <Sphere id="ocean-sphere" fill={OCEAN} stroke={OCEAN_RIM} strokeWidth={0.6} />
        <Graticule stroke={GRATICULE} strokeWidth={0.5} />
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
                    if (didDragRef.current) return;
                    if (interactive && code) onCountryTap?.(code);
                  }}
                  onKeyDown={(event) => {
                    if (!interactive || !code) return;
                    if (event.key === "Enter" || event.key === " ") onCountryTap?.(code);
                  }}
                  style={{
                    default: { fill: fillFor(code), stroke: strokeFor(code), strokeWidth: 0.75, outline: "none" },
                    hover: { fill: interactive && code ? "rgb(var(--surface))" : fillFor(code), stroke: "rgb(var(--primary))", strokeWidth: 0.9, outline: "none", cursor: interactive && code ? "pointer" : "grab" },
                    pressed: { fill: "rgb(var(--surface-2))", stroke: "rgb(var(--primary))", strokeWidth: 1, outline: "none" }
                  }}
                />
              );
            })
          }
        </Geographies>
        {markerCoords && (
          <Marker coordinates={markerCoords}>
            <g style={{ pointerEvents: "none" }}>
              <circle r={10} fill={ACCENT} opacity={0.25} />
              <circle r={4.5} fill={ACCENT} stroke="white" strokeWidth={1.4} />
            </g>
          </Marker>
        )}
      </ComposableMap>
    </div>
  );
}
