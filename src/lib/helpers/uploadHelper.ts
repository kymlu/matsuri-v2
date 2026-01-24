import * as z from "zod"; 
import { Choreo, ChoreoSchema } from "../../models/choreo";

export const readUploadedFile = (
  file: File,
  onComplete: (choreo: Choreo) => void,
  onError: (message: string) => void
) => {
    const reader = new FileReader();
  
    reader.addEventListener(
      "load",
      (event) => {
        if (event.target?.result) {
          try {
            const uploadResult = JSON.parse(event.target.result.toString());
            const parsedResult = z.parse(ChoreoSchema, uploadResult);
            onComplete(parsedResult);
          } catch (e) {
            if (e instanceof Error) {
              console.log("Error parsing data:", e.message);
              onError("Error parsing data:" + e.message);
            } else {
              console.error('An unknown error occurred:', e);
              onError("Unknown error occurred");
            }
          }
        }
      },
      false,
    );

    try {
      reader.readAsText(file);
    } catch {
      console.error("No file was read.");
    }
  }