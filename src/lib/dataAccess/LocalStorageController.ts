const USERNAME = "USERNAME";
export function getUserName(): string | null {
  return localStorage.getItem(USERNAME);
}

export function setUserName(name: string) {
  localStorage.setItem(USERNAME, name);
}

function getUnlockedChoreoKey(choreoId: string, version?: number): string {
  return `unlocked_${choreoId}_v${version}`;
}

const TRUE = "true";
const FALSE = "false";

export function setUnlockedChoreo(choreoId: string, version?: number) {
  localStorage.setItem(getUnlockedChoreoKey(choreoId, version), TRUE);

  if (version) {
    for (let i = 0; i < version; i++) {
      localStorage.removeItem(getUnlockedChoreoKey(choreoId, i));
    }
  }
}

export function checkUnlockedChoreo(choreoId: string, version?: number): boolean {
  return localStorage.getItem(getUnlockedChoreoKey(choreoId, version)) === TRUE;
}

const THEME = "THEME";
export function getTheme(): "light" | "dark" {
  return localStorage.getItem(THEME) === "dark" ? "dark" : "light";
}

export function setTheme(theme: "light" | "dark") {
  localStorage.setItem(THEME, theme);
}

const DO_NOT_SHOW_VIEW_INFO_DIALOG = "DO_NOT_SHOW_VIEW_INFO_DIALOG"
export function stopShowingViewPageInfoDialog(value: boolean) {
  localStorage.setItem(DO_NOT_SHOW_VIEW_INFO_DIALOG, value ? TRUE : FALSE);
}

export function checkShowingViewPageInfoDialog(): boolean {
  return localStorage.getItem(DO_NOT_SHOW_VIEW_INFO_DIALOG) === TRUE;
}

// Personal, per-device notes. Never synced to the server.
function getPersonalNotesKey(choreoId: string): string {
  return `personal_notes_${choreoId}`;
}

export function getPersonalNotesForChoreo(choreoId: string): Record<string, string> {
  const raw = localStorage.getItem(getPersonalNotesKey(choreoId));
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function getPersonalSectionNote(choreoId: string, sectionId: string): string {
  return getPersonalNotesForChoreo(choreoId)[sectionId] ?? "";
}

export function setPersonalSectionNote(choreoId: string, sectionId: string, note: string) {
  const notes = getPersonalNotesForChoreo(choreoId);
  if (note.trim() === "") {
    delete notes[sectionId];
  } else {
    notes[sectionId] = note;
  }
  localStorage.setItem(getPersonalNotesKey(choreoId), JSON.stringify(notes));
}
