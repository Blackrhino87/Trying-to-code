import { afterEach, beforeEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

/* Recharts measures its container; jsdom has no layout engine. */
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

if (!window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  });
}

beforeEach(() => {
  localStorage.clear();
  // Supabase config is committed, so the app would show the sign-in gate.
  // These tests are about the local persistence path — the one that must
  // never lose data. The gate itself is covered separately.
  localStorage.setItem("fight-camp-local-only", "1");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
