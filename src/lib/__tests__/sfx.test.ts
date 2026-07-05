import { beforeEach, describe, expect, it, vi } from "vitest";
import { isSfxEnabled, playCorrect, playWrong, setSfxEnabled } from "../sfx";

function installAudioMock() {
  const oscillator = {
    type: "sine",
    frequency: { setValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  };
  const AudioContextMock = vi.fn(function MockAudioContext(this: {
    currentTime: number;
    destination: object;
    createOscillator: () => typeof oscillator;
    createGain: () => typeof gain;
  }) {
    this.currentTime = 0;
    this.destination = {};
    this.createOscillator = vi.fn(() => oscillator);
    this.createGain = vi.fn(() => gain);
  });
  vi.stubGlobal("AudioContext", AudioContextMock);
  return { AudioContextMock, oscillator };
}

describe("sfx", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("defaults sound effects on and persists toggles", () => {
    expect(isSfxEnabled()).toBe(true);
    setSfxEnabled(false);
    expect(isSfxEnabled()).toBe(false);
    expect(localStorage.getItem("flaggo-sfx")).toBe("off");
    setSfxEnabled(true);
    expect(isSfxEnabled()).toBe(true);
    expect(localStorage.getItem("flaggo-sfx")).toBe("on");
  });

  it("does not create audio when muted", () => {
    const { AudioContextMock } = installAudioMock();
    setSfxEnabled(false);
    playCorrect();
    expect(AudioContextMock).not.toHaveBeenCalled();
  });

  it("plays tones through AudioContext when enabled", () => {
    const { AudioContextMock, oscillator } = installAudioMock();
    playWrong();
    expect(AudioContextMock).toHaveBeenCalledTimes(1);
    expect(oscillator.start).toHaveBeenCalled();
  });
});
