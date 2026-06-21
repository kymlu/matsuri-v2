import { BasicChoreoDetails, Choreo } from "../../models/choreo";
import { Team } from "../../models/team";

const getApiUrl = (endpoint: 
  "auth/login" | 
  "auth/logout" | 
  "auth/set-password" | 
  "auth/verify-team" | 
  "auth/verify-user" | 
  "choreos/summary" | 
  "choreos/file" | 
  "choreos/file/current-version") => {
  return `/api/${endpoint}`
}

export const loginUserToTeam = async (
  teamId: string,
  email: string,
  password: string,
  onSuccess: () => void,
  onFailure: (status: number) => void
): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/login"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, team_id: teamId }),
    });

    const data = await response.json() as { message?: string; error?: string };

    if (!response.ok) {
      console.error(`Login failed: ${response.status} message: ${data.message} error: ${data.error}`);
      onFailure(response.status);
    } else {
      onSuccess();
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
    onFailure(400);
  }
}

export const logoutUserFromTeam = async (): Promise<void> => {
  try {
    const response = await fetch(getApiUrl("auth/logout"), {
      method: "POST",
      credentials: "include"
    });
    const data = await response.json() as { message?: string; error?: string };

    if (!response.ok) {
      console.error(`Login failed: ${response.status} message: ${data.message} error: ${data.error}`);
      throw new Error(data.message ?? "Login failed");
    }
  } catch (e: any) {
    console.error("login failed:", (e as Error)?.message);
    throw e;
  }
}

export const sendPasswordResetRequest = async (email: string, teamId: string): Promise<string> => {
  return "TODO";
}

export const resetPassword = async (userId: string, password: string): Promise<string> => {
  return "TODO";
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
      const data = await response.json() as { message?: string; error?: string };
      console.error(`getChoreoSummary failed: ${response.status} message: ${data.message} error: ${data.error}`);
      throw Error;
    }
  } catch (e: any) {
    console.error("getchoreoSummary failed:", (e as Error)?.message);
    return [] as BasicChoreoDetails[];
  }
}

export const getChoreoFile = async (teamId: string, choreoId: string, version: number): Promise<Choreo> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file")}?team_id=${teamId}&choreo_id=${choreoId}&version=${version}`);
    if (response.ok) {
      return await response.json() as Choreo;
    } else {
      const data = await response.json() as { message?: string; error?: string };
      console.error(`getChoreoFile failed: ${response.status} message: ${data.message} error: ${data.error}`);
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
      const data = await response.json() as { message?: string; error?: string };
      console.error(`Status: ${response.status} message: ${data.message} error: ${data.error}`);
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
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(`${getApiUrl("auth/verify-user")}?team_id=${teamId}`, {
      credentials: "include",
    });
  
    
    if (!response.ok) {
      const data = await response.json() as { message?: string; error?: string };
      console.error(`Status: ${response.status} message: ${data.message} error: ${data.error}`);
      onFailure(response.status);
      return;
    }
  
    onSuccess();
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
      const data = await response.json() as { message?: string; error?: string };
      console.error(`findCurrentVersion failed: ${response.status} message: ${data.message} error: ${data.error}`);
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
  onFailure: (status: number) => void
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
      }),
    });
  
    const data = await response.json();
  
    if (response.ok) {
      const result = data.newFile as Choreo;
      onSuccess(result);
    } else {
      console.error(`Failed to save file. Status: ${response.status} message: ${data.message} error: ${data.error}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error((e as Error)?.message);
    onFailure(400);
  }
}