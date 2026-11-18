import { Choreo } from "../../models/choreo";
import type { ChoreoStatus } from "../../pages/HomePage";

// A chart on this phone, when the team's list couldn't be loaded: one that was ever published (has a version) is
// shown as edited rather than 未公開, since the server can't be asked.
export function statusWithoutTeamList(choreo: Pick<Choreo, "version">): ChoreoStatus {
  return choreo.version ? "edited" : "localOnly";
}
