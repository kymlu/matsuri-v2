import { Choreo } from "../../models/choreo";

export function exportToMtr (
  choreo: Choreo,
  filename?: string,
) {
const blob = new Blob([JSON.stringify(choreo)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = (filename ?? choreo.name) + ".mtr";

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}



export function exportToPdf (
  choreo: Choreo,
  followingId: string
) {

}