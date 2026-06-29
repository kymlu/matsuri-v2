import { ErrorResponse } from "../../models/api";
import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import { Team } from "../../models/team";
import { RoleType, User } from "../../models/user";

const getApiUrl = (endpoint: 
  "auth/login" | 
  "auth/logout" | 
  "auth/reset-password" | 
  "auth/forgot-password" | 
  "auth/verify-team" | 
  "auth/verify-user" | 
  "team/invite-user" |
  "team/members" |
  "team/members/role" |
  "team/members/name" |
  "team/members/remove" |
  "choreos/summary" | 
  "choreos/verify" |
  "choreos/get-password" |
  "choreos/file" | 
  "choreos/file/current-version") => {
  return `/api/${endpoint}`
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
      const data = await response.json() as ErrorResponse;
      console.error(`Login failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    } else {
      const data = await response.json() as { success?: boolean; name: string; role: RoleType, teamMemberId: string };
      onSuccess(data.name, data.role, data.teamMemberId);
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Login failed: ${response.status} message: ${data.message}`);
      throw new Error(data.message ?? "Login failed");
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Reset password failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Reset password failed: ${response.status} message: ${data.message}`);
      onFailure(response.status, data.message);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("Reset password failed:", (e as Error)?.message);
    throw e;
  }
}

export const inviteUser = async (
  email: string,
  role: RoleType,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/invite-user")}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ email, role }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`inviteUser failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error("inviteUser failed:", (e as Error)?.message);
    onFailure(400);
  }
}

export const getAllMembers = async (): Promise<User[]> => {
  try {
    const response = await fetch(`${getApiUrl("team/members")}`, {
      method: "GET",
      credentials: "include",
    });
    if (response.ok) {
      const data = await response.json() as User[];
      return data;
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`getAllMembers failed: ${response.status} message: ${data.message}`);
      throw Error;
    }
  } catch (e: any) {
    console.error("getAllMembers failed:", (e as Error)?.message);
    return [] as User[]; // todo: show error dialog
  }
}

export const changeUserRole = async (
  memberId: string,
  role: RoleType,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/role")}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ member_id: memberId, role }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`changeUserRole failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error(`changeUserRole failed: ${(e as Error)?.message}`);
    onFailure(400);
  }
}

export const removeUserFromTeam = async (
  memberId: string,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/remove")}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ member_id: memberId }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`removeUserFromTeam failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error(`removeUserFromTeam failed: ${(e as Error)?.message}`);
    onFailure(400);
  }
}

export const changeUserName = async (
  name: string,
  onSuccess: () => void,
  onFailure: (status: number) => void,
): Promise<void> => {
  try {
    const response = await fetch(`${getApiUrl("team/members/name")}`, {
      method: "POST",
      credentials: "include",
      body: JSON.stringify({ name }),
    });
    if (response.ok) {
      onSuccess();
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`changeUserName failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error(`changeUserName failed: ${(e as Error)?.message}`);
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
      const data = await response.json() as ErrorResponse;
      console.error(`getChoreoSummary failed: ${response.status} message: ${data.message}`);
      throw Error;
    }
  } catch (e: any) {
    console.error("getchoreoSummary failed:", (e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Choreo password validation failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
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
    const response = await fetch(getApiUrl("choreos/get-password"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choreo_id: choreoId, team_id: teamId }),
    });

    if (!response.ok) {
      const data = await response.json() as ErrorResponse;
      console.error(`Choreo password validation failed: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    } else {
      const data = await response.json() as { password?: string };
      onSuccess(data.password);
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
    throw e;
  }
}

export const getChoreoFile = async (teamId: string, choreoId: string, version: number): Promise<Choreo> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file")}?team_id=${teamId}&choreo_id=${choreoId}&version=${version}`);
    if (response.ok) {
      return await response.json() as Choreo;
    } else {
      const data = await response.json() as ErrorResponse;
      console.error(`getChoreoFile failed: ${response.status} message: ${data.message}`);
      throw Error;
    }
  } catch (e: any) {
    console.error("getChoreoFile failed:", (e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Status: ${response.status} message: ${data.message}`);
      onFailure(response.status);
      return;
    } else {
      const data = await response.json() as Team;
      onSuccess(data);
    }
  } catch (e: any) {
    console.error((e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`Status: ${response.status} message: ${data.message}`);
      onFailure(response.status);
      return;
    } else {
      const data = await response.json() as { teamMemberId: string, name: string, role: RoleType };
      onSuccess(data.name, data.role, data.teamMemberId);
    }
  
  } catch (e: any) {
    console.error((e as Error)?.message);
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
      const data = await response.json() as ErrorResponse;
      console.error(`findCurrentVersion failed: ${response.status} message: ${data.message}`);
      throw Error;
    }
  } catch (e: any) {
    console.error("findCurrentVersion failed:", (e as Error)?.message);
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
    const response = await fetch(getApiUrl("choreos/file"), {
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
  
    const data = await response.json();
  
    if (response.ok) {
      const result = data.newFile as Choreo;
      onSuccess(result);
    } else {
      console.error(`Failed to save file. Status: ${response.status} message: ${data.message}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error((e as Error)?.message);
    onFailure(400);
  }
}