// "Me": the dancer name this device is matched to. Saved per team, with the old
// device-wide key used outside a team and as a fallback for teams not yet saved.
const USERNAME = "USERNAME";
const getMyDancerNameKey = (teamId?: string) => teamId ? `${USERNAME}_${teamId}` : USERNAME;

export function getMyDancerName(teamId?: string): string | null {
  if (teamId) {
    const teamName = localStorage.getItem(getMyDancerNameKey(teamId));
    if (teamName !== null) return teamName;
  }
  return localStorage.getItem(USERNAME);
}

// A blank name is kept as "" so a team stays cleared instead of falling back to the old key.
export function setMyDancerName(teamId: string | undefined, name: string) {
  localStorage.setItem(getMyDancerNameKey(teamId), name.trim());
}

// The token the server gave for a choreo's password. It's sent with every download of that choreo,
// and stays valid until the password changes.
const getUnlockTokenKey = (choreoId: string) => `unlock_${choreoId}`;

export function setUnlockedChoreo(choreoId: string, token: string | undefined) {
  if (token) localStorage.setItem(getUnlockTokenKey(choreoId), token);
  else localStorage.removeItem(getUnlockTokenKey(choreoId));
  // Flags from before the server checked passwords.
  Object.keys(localStorage)
    .filter(key => key.startsWith(`unlocked_${choreoId}_v`))
    .forEach(key => localStorage.removeItem(key));
}

export function getChoreoUnlockToken(choreoId: string): string | null {
  return localStorage.getItem(getUnlockTokenKey(choreoId));
}

export function checkUnlockedChoreo(choreoId: string): boolean {
  return getChoreoUnlockToken(choreoId) !== null;
}

const TRUE = "true";
const FALSE = "false";

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

// Last version opened in view mode, per device. Used for the change log.
function getSeenVersionKey(choreoId: string): string {
  return `seen_version_${choreoId}`;
}

export function getSeenVersion(choreoId: string): number | undefined {
  try {
    const version = Number(localStorage.getItem(getSeenVersionKey(choreoId)));
    return Number.isInteger(version) && version > 0 ? version : undefined;
  } catch {
    return undefined;
  }
}

export function setSeenVersion(choreoId: string, version: number) {
  try {
    localStorage.setItem(getSeenVersionKey(choreoId), version.toString());
  } catch {}
}

export function clearSeenVersion(choreoId: string) {
  try {
    localStorage.removeItem(getSeenVersionKey(choreoId));
  } catch {}
}

// The choreo last opened on this device, per team, for the home page shortcut.
const LAST_SEEN = "LAST_SEEN_CHOREO";
const getLastSeenKey = (teamId?: string) => teamId ? `${LAST_SEEN}_${teamId}` : LAST_SEEN;

export function getLastSeenChoreo(teamId?: string): string | null {
  try {
    return localStorage.getItem(getLastSeenKey(teamId));
  } catch {
    return null;
  }
}

export function setLastSeenChoreo(teamId: string | undefined, choreoId: string | undefined) {
  try {
    if (choreoId) localStorage.setItem(getLastSeenKey(teamId), choreoId);
    else localStorage.removeItem(getLastSeenKey(teamId));
  } catch {
    // Blocked storage: no shortcut.
  }
}
