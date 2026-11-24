import { useEffect, useState } from "react";
import { RosterSong } from "../../models/song";
import { getSongs } from "../helpers/apiHelper";

// undefined while loading or when it can't load (offline, logged out, viewer): everything then works as without songs.
export function useSongs(teamId: string | undefined, enabled: boolean): RosterSong[] | undefined {
  const [songs, setSongs] = useState<RosterSong[]>();

  useEffect(() => {
    if (!teamId || !enabled) {
      setSongs(undefined);
      return;
    }
    let isCancelled = false;
    getSongs(teamId)
      .then(result => {
        if (!isCancelled) {
          setSongs(result);
        }
      })
      .catch(e => console.error((e as Error)?.message));
    return () => {
      isCancelled = true;
    };
  }, [teamId, enabled]);

  return songs;
}
