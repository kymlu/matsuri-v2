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
  } catch {
    throw new Error("ファイルに問題があります。")
  }
}

export const readUploadedFile = (
  file: File,
  onComplete: (choreo: Choreo) => void,
  onError: (message: string) => void
) => {
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

        const mtrFiles = Object.values(zip.files).filter(
          f => !f.dir && f.name.toLowerCase().endsWith(".mtr")
        );

        if (mtrFiles.length === 0) {
          throw new Error("ZIPに .mtr ファイルが含まれていません。");
        }

        if (mtrFiles.length > 1) {
          throw new Error(".mtr ファイル、または .mtr ファイルを1つだけ含む ZIP ファイルに対応しています。");
        }

        const text = await mtrFiles[0].async("text");
        onComplete(parseChoreo(text));
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
        onComplete(parseChoreo(text));
      } catch (e) {
        onError((e as Error).message);
      }
    }
    reader.readAsText(file);
  } else {
    onError("対応している形式は .mtr ファイル、または ZIP ファイルです。")
  }
}