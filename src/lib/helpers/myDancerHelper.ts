import { Dancer } from "../../models/dancer";
import { isNullOrUndefinedOrBlank, strEquals } from "./globalHelper";

// The name to match "me" by: the saved name if one was ever saved (blank means cleared on purpose),
// otherwise the logged-in account name as a first guess.
export function resolveMyDancerName(savedName: string | null, accountName?: string | null): string | null {
  if (savedName !== null) return savedName;
  return isNullOrUndefinedOrBlank(accountName) ? null : accountName!;
}

// The id of the one dancer with exactly this name. Two or more matches are left for the user to pick.
export function findMyDancerId(dancers: Record<string, Dancer>, name: string | null | undefined): string | undefined {
  if (isNullOrUndefinedOrBlank(name?.trim())) return undefined;
  const matches = Object.values(dancers).filter(d => strEquals(d.name.trim(), name!.trim()));
  return matches.length === 1 ? matches[0].id : undefined;
}
