import type { Country } from "@flaggo/core/types/country";

const loaded = new Set<string>();

export function preloadFlags(countries: Country[]) {
  const easy = countries.filter((country) => country.difficulty === "easy");
  const rest = countries.filter((country) => country.difficulty !== "easy");
  const queue = [...easy, ...rest];

  const run = () => loadChunk(queue, 0);
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(run);
  } else {
    globalThis.setTimeout(run, 2000);
  }
}

function loadChunk(countries: Country[], start: number) {
  countries.slice(start, start + 20).forEach((country) => {
    if (loaded.has(country.flagUrl)) return;
    loaded.add(country.flagUrl);
    const image = new Image();
    image.decoding = "async";
    image.src = country.flagUrl;
  });
  if (start + 20 < countries.length) {
    globalThis.setTimeout(() => loadChunk(countries, start + 20), 200);
  }
}
