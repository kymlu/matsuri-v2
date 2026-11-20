import { DancerAction } from "../../models/dancerAction";
import { strEquals } from "./globalHelper";

export type CountBadge = { text: string, red: boolean };

const NO_COUNT = "–";

// Each dancer's count in the action; the top of a stack lists the whole stack's, top first ("1/3").
export function countBadges(action: DancerAction | undefined, redTimingId: string | undefined, stacks: string[][] | undefined): Record<string, CountBadge> {
  const badges: Record<string, CountBadge> = {};
  action?.timings.forEach(timing => timing.dancerIds.forEach(id => {
    badges[id] = { text: timing.name, red: strEquals(timing.id, redTimingId) };
  }));
  (stacks ?? []).forEach(stack => {
    const members = [...stack].reverse().map(id => badges[id]);
    if (members.every(b => !b)) return;
    const names = members.map(b => b?.text ?? NO_COUNT);
    badges[stack[stack.length - 1]] = {
      text: names.every(n => n === names[0]) ? names[0] : names.join("/"),
      red: members.some(b => b?.red),
    };
  });
  return badges;
}
