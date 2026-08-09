// Voice for Kids Mode. Pre-readers can't read prompts, so the mascot speaks
// country names and praise aloud. Uses the browser's built-in SpeechSynthesis
// (on-device, free, no network) and degrades silently where unsupported.

let enabled = true;

export function setVoiceEnabled(on: boolean) {
  enabled = on;
  if (!on) cancelSpeech();
}

export function voiceSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function cancelSpeech() {
  if (voiceSupported()) window.speechSynthesis.cancel();
}

export function speak(text: string, opts: { rate?: number; pitch?: number } = {}) {
  if (!enabled || !voiceSupported() || !text) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    // Slightly slower and higher — friendlier for young children.
    utter.rate = opts.rate ?? 0.9;
    utter.pitch = opts.pitch ?? 1.15;
    window.speechSynthesis.speak(utter);
  } catch {
    // ignore — voice is an enhancement, never required for play
  }
}
