import { BasicChoreoDetails, Choreo } from "../../models/choreo";

const getApiUrl = (endpoint: 
  "verify-user" | 
  "push-file" | 
  "choreos/summary" | 
  "choreos/file" | 
  "choreos/publish" |
  "file/current-version") => {
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
    const response = await fetch(`${getApiUrl("file/current-version")}?choreo_id=${choreoId}`);
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

// export const publishChoreo = async (
//   choreo: Choreo,
//   onSuccess: () => void,
//   onFailure: (status: number) => void
// ) => {
//   handlePublish(`${choreo.id}.mtr`, JSON.stringify(choreo), onSuccess, onFailure);
// }

export const publishChoreo = async (
  choreo: Choreo,
  isNew: boolean,
  onSuccess: () => void,
  onFailure: (status: number) => void
) => {
  try {
    const formData = new FormData();
    formData.append("file", JSON.stringify(choreo)); // File object
    formData.append("choreo_id", choreo.id);
    formData.append("is_new", isNew.toString());
    formData.append("name", choreo.name);
    formData.append("event_name", choreo.event ?? "");
    formData.append("event_start_date", choreo.startDate ?? "");
    formData.append("event_end_date", choreo.endDate ?? "");
    formData.append("stage_width", choreo.stageGeometry.stageWidth.toString());
    formData.append("stage_length", choreo.stageGeometry.stageLength.toString());
    formData.append("dancer_count", Object.keys(choreo.dancers).length.toString());
    formData.append("prop_count", Object.keys(choreo.props).length.toString());
    formData.append("version", (isNew ? 0 : (choreo.version ?? 0)).toString());
  
    const response = await fetch(getApiUrl("choreos/publish"), {
      method: "POST",
      headers: { 'Content-Type': 'application/json' },
      credentials: "include",
      body: formData,
    });
  
    const data = await response.json();
  
    if (response.ok) {
      onSuccess();
    } else {
      console.error(`Failed to save file. Status: ${response.status} message: ${data.message} error: ${data.error}`);
      onFailure(response.status);
    }
  } catch (e: any) {
    console.error((e as Error)?.message);
    onFailure(400);
  }
}

// const handlePublish = async (
//   fileName: string,
//   fileContents: string,
//   onSuccess: () => void,
//   onFailure: (status: number) => void
// ) => {
//   try {
//     const response = await fetch(getApiUrl("push-file"), {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({
//         fileName: fileName,
//         fileContent: fileContents,
//         commitMessage: `Upload ${fileName}`
//       }),
//       credentials: "include",
//     });

//     const data = await response.json() as { message?: string; error?: string };

//     if (!response.ok) {
//       console.error(`Failed to upload to Github. Status: ${response.status} message: ${data.message} error: ${data.error}`);
//       onFailure(response.status);
//       return;
//     }

//     onSuccess();
//   } catch (e: any) {
//     console.error((e as Error)?.message);
//     onFailure(400);
//   }
// };