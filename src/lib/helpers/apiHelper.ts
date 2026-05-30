import { Choreo } from "../../models/choreo";

const getApiUrl = (endpoint: "verify-user" | "push-file") => {
  const apiUrl = process.env.REACT_APP_API_URL;
  return `/api/${endpoint}`
}

export const checkLogin = async(
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  try {
    const response = await fetch(getApiUrl("verify-user"), {
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

export const uploadChoreo = async (
  choreo: Choreo,
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  handleUpload(`${choreo.id}.mtr`, JSON.stringify(choreo), onSuccess, onFailure);
}

const handleUpload = async (
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