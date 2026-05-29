import { Choreo } from "../../models/choreo";

const getApiUrl = (endpoint: "verify-user" | "push-file") => {
  const apiUrl = process.env.REACT_APP_API_URL;
  return `${apiUrl}/api/${endpoint}`
}

export const checkLogin = async(
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  const response = await fetch(getApiUrl("verify-user"), {
    credentials: "include",
  });

  const data = await response.json() as { message?: string; error?: string };
  
  if (!response.ok) {
    console.error(`Status: ${response.status} data: ${data}`);
    onFailure(response.status);
    return;
  }

  onSuccess();
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
  const response = await fetch(getApiUrl("push-file"), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileName,
      fileContent: fileContents,
      commitMessage: `Upload ${fileName}`
    }),
    credentials: "include"
  });

  const data = await response.json() as { message?: string; error?: string };

  if (!response.ok) {
    console.error(`Failed to upload to Github. Status: ${response.status} data: ${data}`);
    onFailure(response.status);
    return;
  }

  onSuccess();
};