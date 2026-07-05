const SFX_KEY = "flaggo-sfx";

let audioContext: AudioContext | null = null;

function store() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

export function isSfxEnabled(): boolean {
  return store()?.getItem(SFX_KEY) !== "off";
}

export function setSfxEnabled(enabled: boolean): void {
  const storage = store();
  if (!storage) return;
  storage.setItem(SFX_KEY, enabled ? "on" : "off");
}

function getAudioContext(): AudioContext | null {
  if (!isSfxEnabled() || typeof window === "undefined") return null;
  const AudioCtor = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioCtor) return null;
  audioContext ??= new AudioCtor();
  return audioContext;
}

function playTone(frequency: number, type: OscillatorType, durationMs: number, offsetMs = 0) {
  const ctx = getAudioContext();
  if (!ctx) return;
  const start = ctx.currentTime + offsetMs / 1000;
  const duration = durationMs / 1000;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.08, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.01);
}

export function playCorrect(): void {
  playTone(880, "sine", 90);
}

export function playWrong(): void {
  playTone(220, "triangle", 140);
}

export function playComplete(): void {
  [523, 659, 784].forEach((frequency, index) => playTone(frequency, "sine", 80, index * 90));
}
