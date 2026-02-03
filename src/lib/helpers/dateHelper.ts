export function getJpDate(date?: Date): string {
  if (date === undefined) date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${YYYY}年${MM}月${dd}日 ${HH}:${mm}`;
}