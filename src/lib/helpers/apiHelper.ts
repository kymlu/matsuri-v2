import { BasicChoreoDetails, Choreo } from "../../models/choreo";

const getApiUrl = (endpoint: 
  "verify-user" | 
  "choreos/summary" | 
  "choreos/file" | 
  "choreos/file/current-version") => {
  return `/api/${endpoint}`
}

export const getChoreoSummary = async (): Promise<BasicChoreoDetails[]> => {
  try {
    const response = await fetch(getApiUrl("choreos/summary"), {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json() as BasicChoreoDetails[];
    return data;
  } catch (e: any) {
    console.error("getchoreoSummary failed:", (e as Error)?.message);
    return [] as BasicChoreoDetails[];
  }
}

export const getChoreoFile = async (choreoId: string, version: number): Promise<Choreo> => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file")}?choreo_id=${choreoId}&version=${version}`);
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

export const checkLogin = async(
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(getApiUrl("verify-user"), {
      credentials: "include",
    });
  
    const data = await response.json() as { message?: string; error?: string };
    
    if (!response.ok) {
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
  choreoId: string
) => {
  try {
    const response = await fetch(`${getApiUrl("choreos/file/current-version")}?choreo_id=${choreoId}`);
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
      var result = data.newFile as Choreo;
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