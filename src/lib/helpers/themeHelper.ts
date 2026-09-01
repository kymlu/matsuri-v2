import { useCallback, useSyncExternalStore } from "react";
import { getTheme, setTheme as persistTheme } from "../dataAccess/LocalStorageController";
import { setPaletteTheme } from "../consts/colors";

export type Theme = "light" | "dark";

let currentTheme: Theme = getTheme();
const listeners = new Set<() => void>();

/** Push the theme everywhere that can't observe React state:
 *  the <html> class (Tailwind `dark:`) and the Konva colour palette. */
export function applyTheme(theme: Theme) {
  currentTheme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  setPaletteTheme(theme);
  listeners.forEach((l) => l());
}

/** Apply the persisted theme (defaults to light). Call once on app start. */
export function initTheme() {
  applyTheme(getTheme());
}

/** Persist + apply a new theme. */
export function setTheme(theme: Theme) {
  persistTheme(theme);
  applyTheme(theme);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Current theme, re-rendering the caller whenever it changes. */
export function useTheme(): [Theme, () => void] {
  const theme = useSyncExternalStore(
    subscribe,
    () => currentTheme,
    () => currentTheme,
  );

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme === "dark" ? "light" : "dark");
  }, []);

  return [theme, toggleTheme];
}
