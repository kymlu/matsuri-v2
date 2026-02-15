import { Choreo, ChoreoSchema } from "../../models/choreo";
import JSZip from "jszip";

function getExtension(file: File): string | null {
  const name = file.name
  const idx = name.lastIndexOf(".")
  if (idx === -1) return null
  return name.slice(idx + 1).toLowerCase()
}

function parseChoreo(text: string): Choreo {
  try {
    const json = JSON.parse(text);
    return ChoreoSchema.parse(json);
  } catch(e) {
    console.log(e);
    throw new Error("ファイルに問題があります。")
  }
}

export async function readUploadedFile (
  file: File,
  onCompleteOne: (newChoreo: Choreo) => void,
  onCompleteBatch: (newChoreos: Choreo[], errorMessage?: string) => void,
  onError: (message: string) => void
) {
  const reader = new FileReader();
  const ext = getExtension(file);

  if (ext === "zip") {
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result;
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error("ZIPの読み込みに失敗しました。");
        }

        const zip = await JSZip.loadAsync(buffer);

        const mtrFiles = Object.values(zip.files).filter(f => {
          if (f.dir) return false;

          const name = f.name.toLowerCase();
          const baseName = name.split("/").pop() ?? "";

          return (
            name.endsWith(".mtr") &&
            !name.startsWith("__macosx/") &&
            !baseName.startsWith("._")
          );
        });

        if (mtrFiles.length === 0) {
          throw new Error("ZIPに .mtr ファイルが含まれていません。");
        } else if (mtrFiles.length === 1) {
          onCompleteOne(parseChoreo(await mtrFiles[0].async("text")));
        } else {
          const successfulChoreos: Choreo[] = [];
          const failedChoreos: string[] = [];
        
          for (let i = 0; i < mtrFiles.length; i++) {
            const f = mtrFiles[i];
            try {
              successfulChoreos.push(parseChoreo(await f.async("text")));
            } catch {
              failedChoreos.push(f.name.split("/").pop() ?? "");
            }
          }
  
          onCompleteBatch(
            successfulChoreos,
            failedChoreos.length > 0 ?
              "以下のファイルに問題がありました：\n" + failedChoreos.map(c => "・" + c).join("\n") :
              undefined
          );
        }

      } catch (e) {
        onError((e as Error).message)
      }
    }
    reader.readAsArrayBuffer(file);
  } else if (ext === "mtr") {
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (typeof text !== "string") {
          throw new Error(".mtr の読み込みに失敗しました。");
        }
        onCompleteOne(parseChoreo(text));
      } catch (e) {
        onError((e as Error).message);
      }
    }
    reader.readAsText(file);
  } else {
    onError("対応している形式は .mtr ファイル、または ZIP ファイルです。")
  }
}