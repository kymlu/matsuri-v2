const USERNAME = "USERNAME";
export function getUserName(): string | null {
  return localStorage.getItem(USERNAME);
}

export function setUserName(name: string) {
  localStorage.setItem(USERNAME, name);
}