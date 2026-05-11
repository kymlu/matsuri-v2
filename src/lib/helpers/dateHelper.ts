import { isNullOrUndefinedOrBlank } from "./globalHelper";

export function getJpDate(date?: Date, hasTime: boolean = true): string {
  if (date === undefined) date = new Date();
  const YYYY = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const HH = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return `${YYYY}年${MM}月${dd}日${hasTime ? `${HH}:${mm}`: ""}`;
}

export function getDate(date?: Date): string {
  if (date === undefined) date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

export function formatDateRange(startDate?: string, endDate?: string, showYear: boolean = true): string {
  const fmt = (date: string) => {
    const d = new Date(date);
    return showYear
      ? `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
      : `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);

    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth() && s.getDate() === e.getDate()) {
      return fmt(startDate);
    }
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return `${fmt(startDate)}〜${e.getDate()}日`;
    }
    if (s.getFullYear() === e.getFullYear()) {
      return `${fmt(startDate)}〜${e.getMonth() + 1}月${e.getDate()}日`;
    }
    return `${fmt(startDate)}〜${fmt(endDate)}`;
  }

  if (startDate) return fmt(startDate);
  if (endDate) return fmt(endDate);
  return "日程未定";
}

export function isPast(startDate?: string, endDate?: string): boolean {
  const dateStr = isNullOrUndefinedOrBlank(endDate) ? (isNullOrUndefinedOrBlank(startDate) ? null : startDate) : endDate;
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);
  return end < today;
}