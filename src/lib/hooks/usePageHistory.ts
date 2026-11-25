import { useCallback, useEffect, useRef, useState } from "react";

// Pages other than home get one history entry, so the phone's back gesture returns home instead of leaving.
// Switching between pages replaces that entry, so one back always reaches home.
export function usePageHistory<Mode extends string>(home: Mode) {
  const [mode, setMode] = useState<Mode>(home);
  // While set (e.g. the editor's stage-size sheet is open), back is ignored, like the disabled home button.
  const leaveBlockedRef = useRef(false);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const goTo = useCallback((next: Mode) => {
    const onPage = window.history.state?.matsuriPage !== undefined;
    if (next === home) {
      if (onPage) window.history.back();
    } else if (onPage) {
      window.history.replaceState({ matsuriPage: next }, "");
    } else {
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
