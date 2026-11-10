import { createContext, ReactNode, useCallback, useContext, useMemo, useState } from "react";
import HelpSheet, { HelpTarget } from "./HelpSheet";
import { HelpReader } from "../../lib/helpers/helpHelper";

type OpenHelp = (target?: HelpTarget) => void;

const HelpContext = createContext<OpenHelp>(() => {});

// One help sheet for the whole app. It opens over the current screen, so the editor
// keeps its state (and undo history) while help is open.
export function HelpProvider({ reader, children }: { reader: HelpReader, children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<HelpTarget>();
  const openHelp = useCallback<OpenHelp>((t) => {
    setTarget(t ?? {});
    setOpen(true);
  }, []);
  const close = useCallback(() => setOpen(false), []);
  // Keep the reader object stable so the contents aren't rebuilt on every App render.
  const stableReader = useMemo(() => reader,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reader.hasTeam, reader.isLoggedIn, reader.isViewer, reader.isAdmin]);

  return <HelpContext.Provider value={openHelp}>
    {children}
    <HelpSheet open={open} target={target} reader={stableReader} onClose={close}/>
  </HelpContext.Provider>;
}

export function useHelp(): OpenHelp {
  return useContext(HelpContext);
}
