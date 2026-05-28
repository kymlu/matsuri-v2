import { Choreo } from "../../models/choreo";

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
  const apiUrl = process.env.REACT_APP_API_URL;
  
  const response = await fetch(`${apiUrl}/api/push-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: fileName,
      fileContent: fileContents,
      commitMessage: `Upload ${fileName}`
    })
  });

  const data = await response.json() as { message?: string; error?: string };

  if (!response.ok) {
    console.log(response, data);
    console.error("Failed to upload to Github", data?.error, data?.message);
    onFailure(response.status);
    return;
  }

  onSuccess();
};