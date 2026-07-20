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

const DO_NOT_SHOW_VIEW_INFO_DIALOG = "DO_NOT_SHOW_VIEW_INFO_DIALOG"
export function stopShowingViewPageInfoDialog(value: boolean) {
  localStorage.setItem(DO_NOT_SHOW_VIEW_INFO_DIALOG, value ? TRUE : FALSE);
}

export function checkShowingViewPageInfoDialog(): boolean {
  return localStorage.getItem(DO_NOT_SHOW_VIEW_INFO_DIALOG) === TRUE;
}
