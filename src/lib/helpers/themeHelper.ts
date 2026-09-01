import { useCallback, useEffect, useState } from "react";
import { getTheme, setTheme as storeTheme } from "../dataAccess/LocalStorageController";

export type Theme = "light" | "dark";

/** Reflect the theme onto <html> so Tailwind's `dark:` variants apply. */
export function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
}

/** Apply the persisted theme (defaults to light). Call once on app start. */
export function initTheme() {
  applyTheme(getTheme());
}

/** Returns the current theme and a toggle that persists the new value. */
export function useTheme(): [Theme, () => void] {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return [theme, toggleTheme];
}
