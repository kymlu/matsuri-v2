import { ErrorResponse } from "../../models/api";
import { BasicChoreoDetails, Choreo, ChoreoVersion } from "../../models/choreo";
import { Team } from "../../models/team";
import { RoleType, User } from "../../models/user";
import { AddRosterNamesResult, AddRosterNamesResultSchema, PropDefaults, Roster, RosterKind, RosterDefaultsItem, RosterDefaultsResult, RosterDefaultsResultSchema, RosterLink, RosterLinksResult, RosterLinksResultSchema, RosterRemoveResult, RosterRemoveResultSchema, RosterRestoreResult, RosterRestoreResultSchema, RosterSchema } from "../../models/roster";
import * as z from "zod";

const getApiUrl = (endpoint: 
  "auth/login" | 
  "auth/logout" | 
  "auth/reset-password" | 
  "auth/forgot-password" | 
  "auth/verify-team" | 
  "auth/verify-user" | 
  "auth/verify-invite" | 
  "auth/accept-invite" | 
  "team/invite-user" |
  "team/members" |
  "team/members/role" |
  "team/members/name" |
  "team/members/remove" |
  "choreos/summary" | 
  "choreos/file/history" | 
  "choreos/file/history/public" | 
  "choreos/verify" |
  "choreos/get-password" |
  "choreos/file" | 
  "choreos/file/current-version" |
  "roster" |
  "roster/names/add" |
  "roster/names/update" |
  "roster/names/remove" |
  "roster/categories/save" |
  "roster/links" |
  "roster/names/restore" |
  "roster/names/defaults") => {
  return `/api/${endpoint}`
}

// What went wrong with a failed response. Never throws: a body that isn't JSON (for example a proxy's
// HTML error page) goes into the summary as a short excerpt, so the real status isn't lost to a parse error.
// message is the server's own message, for passing on to the user.
const readFailure = async (response: Response): Promise<{ message?: string, summary: string }> => {
  const text = await response.text().catch(() => "");
  let message: string | undefined;
  let detail: string | undefined;
  try {
    message = (JSON.parse(text) as ErrorResponse)?.message;
    detail = message;
  } catch {
    detail = text ? `(not JSON) ${text.replace(/\s+/g, " ").slice(0, 200)}` : undefined;
  }
  return { message, summary: `${response.status} ${response.statusText}`.trim() + (detail ? `: ${detail}` : "") };
}

export const loginUserToTeam = async (
  teamId: string,
  email: string,
  password: string,
  onSuccess: (name: string, role: RoleType, teamMemberId: string) => void,
  onFailure: (status: number) => void
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, team_id: teamId }),
    });

    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`loginUserToTeam failed: ${failure.summary}`);
      onFailure(response.status);
    } else {
      const data = await response.json() as { success?: boolean; name: string; role: RoleType, teamMemberId: string };
      onSuccess(data.name, data.role, data.teamMemberId);
    }
  } catch (e: any) {
    console.error("loginUserToTeam failed:", e);
    onFailure(400);
  }
}

export const logoutUserFromTeam = async (
  onSuccess: () => void,
  onFailure: () => void,
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/logout"), {
      method: "POST",
      credentials: "include"
    });
    
    if (!response.ok) {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("logoutUserFromTeam failed:", e);
    onFailure();
    throw e;
  }
}

export const sendPasswordResetRequest = async (
  email: string,
  teamId: string,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/forgot-password"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, team_id: teamId }),
    });
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`sendPasswordResetRequest failed: ${failure.summary}`);
      onFailure(response.status);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("sendPasswordResetRequest failed:", e);
    throw e;
  }
}

export const verifyInvite = async (
  teamId: string,
  setupToken: string,
  onSuccess: (email: string) => void,
  onFailure: (status: number, message: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("auth/verify-invite")}?team_id=${teamId}&setup=${setupToken}`, {
      method: "GET",
      credentials: "include",
    });
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`verifyInvite failed: ${failure.summary}`);
      onFailure(response.status, failure.message ?? "");
    } else {
      const data = await response.json() as {email: string};
      onSuccess(data.email);
    }
  } catch (e: any) {
    console.error("verifyInvite failed:", e);
    throw e;
  }
}

export const acceptInvite = async (
  teamId: string,
  setupToken: string,
  password: string,
  onSuccess: () => void,
  onFailure: (status: number, message: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/accept-invite"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ team_id: teamId, setup: setupToken, password }),
    });
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`acceptInvite failed: ${failure.summary}`);
      onFailure(response.status, failure.message ?? "");
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("acceptInvite failed:", e);
    throw e;
  }
}

export const resetPassword = async (
  email: string,
  teamId: string,
  code: string,
  password: string,
  onSuccess: () => void,
  onFailure: (status: number, message: string) => void,
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/reset-password"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, team_id: teamId, code, password }),
    });
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`resetPassword failed: ${failure.summary}`);
      onFailure(response.status, failure.message ?? "");
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("resetPassword failed:", e);
    throw e;
  }
}

export const inviteUser = async (
  email: string,
  teamId: string,
  role: RoleType,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/invite-user")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, role }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const failure = await readFailure(response);
      console.error(`inviteUser failed: ${failure.summary}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("inviteUser failed:", e);
    onFailure(400);
  }
}

export const getAllMembers = async (teamId: string): Promise<User[]> => {
  try {
    const response = await fetch(`${getApiUrl("team/members")}?team_id=${teamId}`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json() as User[];
      return data;
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("getAllMembers failed:", e);
    return [] as User[]; // todo: show error dialog
  }
}

export const changeUserRole = async (
  memberId: string,
  teamId: string,
  role: RoleType,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/role")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ member_id: memberId, role }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const failure = await readFailure(response);
      console.error(`changeUserRole failed: ${failure.summary}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("changeUserRole failed:", e);
    onFailure(400);
  }
}

export const removeUserFromTeam = async (
  memberId: string,
  teamId: string,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/remove")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ member_id: memberId }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const failure = await readFailure(response);
      console.error(`removeUserFromTeam failed: ${failure.summary}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("removeUserFromTeam failed:", e);
    onFailure(400);
  }
}

export const changeUserName = async (
  name: string,
  teamId: string,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/name")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const failure = await readFailure(response);
      console.error(`changeUserName failed: ${failure.summary}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("changeUserName failed:", e);
    onFailure(400);
  }
}

export const getChoreoSummary = async (teamId?: string): Promise<BasicChoreoDetails[]> => {
  try {
    if (!teamId) return [];

    const response = await fetch(`${getApiUrl("choreos/summary")}?team_id=${teamId}`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json() as BasicChoreoDetails[];
      return data;
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("getChoreoSummary failed:", e);
    return [] as BasicChoreoDetails[]; // todo: show error dialog
  }
}

export const verifyChoreoPassword = async (
  teamId: string,
  choreoId: string,
  password: string,
  onSuccess: () => void,
  onFailure: (status: number) => void
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("choreos/verify"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, choreo_id: choreoId, team_id: teamId }),
    });

    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`verifyChoreoPassword failed: ${failure.summary}`);
      onFailure(response.status);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("verifyChoreoPassword failed:", e);
    throw e;
  }
}

export const getChoreoPassword = async (
  teamId: string,
  choreoId: string,
  onSuccess: (password?: string) => void,
  onFailure: (status: number) => void
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/get-password")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choreo_id: choreoId, team_id: teamId }),
    });

    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`getChoreoPassword failed: ${failure.summary}`);
      onFailure(response.status);
    } else {
      const data = await response.json() as { password?: string };
      onSuccess(data.password);
    }
  } catch (e: any) {
    console.error("getChoreoPassword failed:", e);
    throw e;
  }
}

export const getChoreoFile = async (teamId: string, choreoId: string, version: number): Promise<Choreo> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file")}?team_id=${teamId}&choreo_id=${choreoId}&version=${version}`);
    if (response.ok) {
      return await response.json() as Choreo;
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("getChoreoFile failed:", e);
    throw e;
  }
}

export const getPublicChoreoHistory = async (teamId: string, choreoId: string): Promise<ChoreoVersion[]> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file/history/public")}?team_id=${teamId}&choreo_id=${choreoId}`);
    if (response.ok) {
      return await response.json() as ChoreoVersion[];
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("getPublicChoreoHistory failed:", e);
    throw e;
  }
}

export const getChoreoHistory = async (teamId: string, choreoId: string): Promise<ChoreoVersion[]> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file/history")}?team_id=${teamId}&choreo_id=${choreoId}`);
    if (response.ok) {
      return await response.json() as ChoreoVersion[];
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("getChoreoHistory failed:", e);
    throw e;
  }
}

export const verifyTeam = async(
  teamSlug: string,
  onSuccess: (team: Team) => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(`${getApiUrl("auth/verify-team")}?team_slug=${teamSlug}`, {
      credentials: "include",
    });
  
    
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`verifyTeam failed: ${failure.summary}`);
      onFailure(response.status);
      return;
    } else {
      const data = await response.json() as Team;
      onSuccess(data);
    }
  } catch (e: any) {
    console.error("verifyTeam failed:", e);
    onFailure(400);
  }
}

export const checkLogin = async(
  teamId: string,
  onSuccess: (name: string, role: RoleType, teamMemberId: string) => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(`${getApiUrl("auth/verify-user")}?team_id=${teamId}`, {
      credentials: "include",
    });

    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`checkLogin failed: ${failure.summary}`);
      onFailure(response.status);
      return;
    } else {
      const data = await response.json() as { teamMemberId: string, name: string, role: RoleType };
      onSuccess(data.name, data.role, data.teamMemberId);
    }
  
  } catch (e: any) {
    console.error("checkLogin failed:", e);
    onFailure(400);
  }
}

export const findCurrentVersion = async (
  teamId: string,
  choreoId: string, 
) => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file/current-version")}?team_id=${teamId}&choreo_id=${choreoId}`);
    if (response.ok) {
      return await response.json() as {version: number};
    } else {
      const failure = await readFailure(response);
      throw new Error(`HTTP ${failure.summary}`);
    }
  } catch (e: any) {
    console.error("findCurrentVersion failed:", e);
    throw e;
  }
}

export const publishChoreo = async (
  teamId: string,
  choreo: Choreo,
  isNew: boolean,
  onSuccess: (newChoreo: Choreo) => void,
  onFailure: (status: number) => void,
  password?: string
) => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file")}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        team_id: teamId,
        file: choreo,
        choreo_id: choreo.id,
        is_new: isNew,
        name: choreo.name,
        event_name: choreo.event ?? "",
        event_start_date: choreo.startDate ?? "",
        event_end_date: choreo.endDate ?? "",
        stage_width: choreo.stageGeometry.stageWidth,
        stage_length: choreo.stageGeometry.stageLength,
        dancer_count: Object.keys(choreo.dancers).length,
        prop_count: Object.keys(choreo.props).length,
        version: isNew ? 0 : (choreo.version ?? 0),
        password: password,
      }),
    });
  
    if (response.ok) {
      const data = await response.json();
      onSuccess(data.newFile as Choreo);
    } else {
      const failure = await readFailure(response);
      console.error(`publishChoreo failed: ${failure.summary}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("publishChoreo failed:", e);
    onFailure(400);
  }
}

export const getRoster = async (teamId: string): Promise<Roster> => {
  const response = await fetch(`${getApiUrl("roster")}?team_id=${teamId}`, {
    method: "GET",
    credentials: "include",
  });
  if (!response.ok) {
    const failure = await readFailure(response);
    throw new Error(`getRoster failed: ${failure.summary}`);
  }
  const parsed = RosterSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`getRoster returned an unexpected shape: ${parsed.error.message}`);
  }
  return parsed.data;
}

// The roster routes all POST a body and answer with JSON in a known shape.
// A response in the wrong shape is reported as 500, so it isn't mistaken for a network failure.
const postRoster = async <T,>(
  endpoint: "roster/names/add" | "roster/names/update" | "roster/names/remove" | "roster/categories/save" | "roster/links" | "roster/names/restore" | "roster/names/defaults",
  teamId: string,
  body: object,
  schema: z.ZodType<T>,
  onSuccess: (result: T) => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl(endpoint)}?team_id=${teamId}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const failure = await readFailure(response);
      console.error(`${endpoint} failed: ${failure.summary}`);
      onFailure(response.status);
      return;
    }
    const data = await response.json();
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      console.error(`${endpoint} returned an unexpected shape: ${parsed.error.message}`);
      onFailure(500);
      return;
    }
    onSuccess(parsed.data);
  } catch (e: any) {
    console.error(`${endpoint} failed:`, e);
    onFailure(400);
  }
}

export const addRosterNames = (
  teamId: string,
  kind: RosterKind,
  names: string[],
  categoryIds: string[],
  onSuccess: (result: AddRosterNamesResult) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/add", teamId, { kind, names, category_ids: categoryIds }, AddRosterNamesResultSchema, onSuccess, onFailure);

// Prop names can also set their default size and colour; leave defaults out to keep them.
export const updateRosterName = (
  teamId: string,
  id: string,
  name: string,
  categoryIds: string[],
  defaults: PropDefaults | undefined,
  onSuccess: (roster: Roster) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/update", teamId, { id, name, category_ids: categoryIds, ...defaults }, RosterSchema, onSuccess, onFailure);

export const removeRosterName = (
  teamId: string,
  id: string,
  onSuccess: (roster: Roster) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/remove", teamId, { id }, RosterSchema, onSuccess, onFailure);

export const saveRosterCategories = (
  teamId: string,
  kind: RosterKind,
  categories: { id?: string, name: string }[],
  deletedIds: string[],
  onSuccess: (roster: Roster) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/categories/save", teamId, { kind, categories, deleted_ids: deletedIds }, RosterSchema, onSuccess, onFailure);

// Selection mode: add and remove exact name–category links, reporting the ones that changed.
export const updateRosterLinks = (
  teamId: string,
  add: RosterLink[],
  remove: RosterLink[],
  onSuccess: (result: RosterLinksResult) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/links", teamId, { add, remove }, RosterLinksResultSchema, onSuccess, onFailure);

// All or nothing; reports the names actually removed.
export const removeRosterNames = (
  teamId: string,
  ids: string[],
  onSuccess: (result: RosterRemoveResult) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/remove", teamId, { ids }, RosterRemoveResultSchema, onSuccess, onFailure);

// Sets or clears the default size and colour of many prop names, each with its own values.
export const updateRosterDefaults = (
  teamId: string,
  items: RosterDefaultsItem[],
  onSuccess: (result: RosterDefaultsResult) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/defaults", teamId, { items }, RosterDefaultsResultSchema, onSuccess, onFailure);

// Undoes removeRosterNames, skipping names whose spelling has been added again since.
export const restoreRosterNames = (
  teamId: string,
  ids: string[],
  onSuccess: (result: RosterRestoreResult) => void,
  onFailure: (status: number) => void,
) => postRoster("roster/names/restore", teamId, { ids }, RosterRestoreResultSchema, onSuccess, onFailure);
