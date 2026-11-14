import { useEffect, useState } from "react";
import { Roster } from "../../models/roster";
import { getRoster } from "../helpers/apiHelper";

// The team's 名簿 for suggesting dancer names. It isn't stored on the device: it's fetched when the
// editor opens, and stays undefined while loading or when it can't be loaded (offline, logged out,
// viewer), in which case the name dialogs work as they do without it.
export function useRoster(teamId: string | undefined, enabled: boolean): Roster | undefined {
  const [roster, setRoster] = useState<Roster>();

  useEffect(() => {
    if (!teamId || !enabled) {
      setRoster(undefined);
      return;
    }
    let isCancelled = false;
    getRoster(teamId)
      .then(result => {
        if (!isCancelled) {
          setRoster(result);
        }
      })
      .catch(e => console.error(e));
    return () => {
      isCancelled = true;
    };
  }, [teamId, enabled]);

  return roster;
}
