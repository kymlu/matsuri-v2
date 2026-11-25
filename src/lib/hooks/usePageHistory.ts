import { useCallback, useEffect, useRef, useState } from "react";

// The app keeps one history entry above where it started, so the phone's back gesture returns home instead of leaving.
// Every page change, home included, replaces that entry; never history.back(), whose late arrival could undo a newer page.
export function usePageHistory<Mode extends string>(home: Mode) {
  const [mode, setMode] = useState<Mode>(home);
  // While set (e.g. the editor's stage-size sheet is open), back is ignored, like the disabled home button.
  const leaveBlockedRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const goTo = useCallback((next: Mode) => {
    if (window.history.state?.matsuriPage !== undefined) {
      window.history.replaceState({ matsuriPage: next }, "");
    } else if (next !== home) {
      window.history.pushState({ matsuriPage: next }, "");
    }
    setMode(next);
  }, [home]);

  useEffect(() => {
    // A reload keeps the old entry's state but starts at home.
    if (window.history.state?.matsuriPage !== undefined) {
      const { matsuriPage, ...rest } = window.history.state;
      window.history.replaceState(rest, "");
    }
    const onPopState = () => {
      if (leaveBlockedRef.current) {
        window.history.pushState({ matsuriPage: modeRef.current }, "");
        return;
      }
      setMode(home);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [home]);

  return { mode, goTo, leaveBlockedRef };
}
