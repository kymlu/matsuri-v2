import { BasicChoreoDetails, Choreo } from "../../models/choreo";

const getApiUrl = (endpoint: "verify-user" | "push-file" | "choreos/summary") => {
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
    const response = await fetch(`https://your-worker.workers.dev/choreos/file?choreo_id=${choreoId}&version=${version}`);
    if (response.status === 200) {
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

export const publishChoreo = async (
  choreo: Choreo,
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  handlePublish(`${choreo.id}.mtr`, JSON.stringify(choreo), onSuccess, onFailure);
}

const handlePublish = async (
  fileName: string,
  fileContents: string,
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(getApiUrl("push-file"), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: fileName,
        fileContent: fileContents,
        commitMessage: `Upload ${fileName}`
      }),
      credentials: "include",
    });

    const data = await response.json() as { message?: string; error?: string };

    if (!response.ok) {
      console.error(`Failed to upload to Github. Status: ${response.status} message: ${data.message} error: ${data.error}`);
      onFailure(response.status);
      return;
    }

    onSuccess();
  } catch (e: any) {
    console.error((e as Error)?.message);
    onFailure(400);
  }
};