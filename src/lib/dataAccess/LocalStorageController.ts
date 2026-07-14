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

const IS_UNLOCKED = "true";

export function setUnlockedChoreo(choreoId: string, version?: number) {
  localStorage.setItem(getUnlockedChoreoKey(choreoId, version), IS_UNLOCKED);

  if (version) {
    for (let i = 0; i < version; i++) {
      localStorage.removeItem(getUnlockedChoreoKey(choreoId, version));
    }
  }
}

export function checkUnlockedChoreo(choreoId: string, version?: number): boolean {
  return localStorage.getItem(getUnlockedChoreoKey(choreoId, version)) === IS_UNLOCKED;
}