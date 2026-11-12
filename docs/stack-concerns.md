# Stacks: concerns

## Summary (current)
Still open, most important first:
1. 🟡 **Old app versions erase stacks** (the schema drops unknown fields). Low risk: the server stores the choreography without reading it, and a web app picks up the new version on reload, so only a tab left open on the old version that then saves can lose stacks.
2. 🟡 **The rules live only in the client** (same spot, consecutive z, linked paths). Anything that edits choreography JSON outside the editor can break them until the editor next saves.
3. 🟡 **No page-level tests** for the drop prompt, drag-follow, selection expansion and paste message; covered by helper/dialog tests and manual browser checks only.
4. 🟡 **Members picked out of a stack** (同色選択, find) still snap back silently when moved alone.
5. 🟡 **Accidental overlaps** (same spot, not stacked) have no mark.
6. ⚪ Drop detection is centre-to-centre within 0.2 m; large props rarely trigger it.
7. ⚪ Only the drawn member's colour is visible; members can differ.
8. ⚪ Drag-follow moves stage nodes outside React; a re-render mid-drag that reset positions would make members jump apart.
9. ⚪ The normaliser runs over every section on each change (cheap now; grows with sections × stacks).
Handled separately: dancer on prop (and vice versa).

Done since the first summary: prop stacks in view mode, 整理 per stack (incl. even spacing), copy/paste keeps stacks, colour note and ×N badge, one undo step for drop-and-stack, the drop prompt returns after unstacking, 位置交換 between stacks and people, linked stack paths, changelog 重なり lines, PDF marks and followed-dancer stack lines, useStackEditing hook.


Running list, added to after each phase's review. 🔴 = must be handled before release, 🟡 = should be decided, ⚪ = known limit.

## Phase 1 (data and helpers)
- 🔴 **Older app versions erase stacks.** The formation schema is zod with default stripping. Anyone on a cached older version who opens and saves a choreography drops `dancerStacks` / `propStacks` silently. Needs a release where the schema keeps the fields before stacking ships, or a version check that blocks saving from old clients.
- 🟡 **Server validation.** If the server validates choreography JSON against its own schema, it has to accept the two new fields. Not checked from here.
- ⚪ **Rotated props** are centred on the prop below by their unrotated boxes, so a rotated top prop can look slightly off.
- ⚪ **The bottom member is the anchor.** Whatever a command does, members snap back to the bottom one. Moving a single non-bottom member on purpose (e.g. through find + drag) is silently undone, which is the "locked" rule, but there is no message.

## Phase 2 (editor)
- ✅ ~~**Hidden people can't be given a count.**~~ Fixed in phase 2: find now works while assigning a count (dancers only), and ticking someone there assigns them, hidden or not.
- 🟡 **Selections that aren't stage taps don't expand.** 同色選択, 同名選択, find and paste select people individually. Moving such a selection moves only the bottom member's stack as a whole; anyone else picked out of a stack snaps back. Consistent with "locked", but can surprise.
- 🟡 **Distribute (横均・縦均)** counts each member separately, so a stack inside a distribute leaves an uneven gap.
- 🟡 **Paths.** A stack is a multi-selection, and path editing needs exactly one selected, so a stack's path can't be edited. Members' paths stay independent (the spec wanted one shared path).
- ⚪ **そのまま is remembered per pair for the session**, not "until moved apart". Reloading clears it.
- ⚪ **Swap positions** on a stacked person and an outsider: the swap happens, then the stack snaps back to its bottom member, which can look like a partial swap.

## Phase 3 (stage drawing)
- 🟡 **PDF export** draws stacked people on top of each other with no mark, so a printed sheet hides the bottom person. Needs the mark (and a legend) in exportHelper.
- 🟡 **Accidental overlaps** (two people at one spot without 重ねる) still have no grey ×2, so they hide someone silently, as before stacks existed.
- ⚪ **Mark size.** At the default zoom on a phone the mark is about 10px across: visible, but small. Worth checking on a real device.
- ⚪ **Red mark in view mode means "a hidden member is selected"**, which is what a count does, but finding a hidden person by name also turns it red. Harmless; the dashed ring makes it clear who it is.

## Phase 4 (view mode)
- 🟡 **Prop stacks can't be inspected in view mode.** Props can't be tapped there, so the "order only" list from the spec isn't reachable. The mark still shows.
- ⚪ **The stack list is a small dialog**, not a popover next to the stack as mocked. Same content and rules (opens on tap only, the count stays until someone is picked), simpler and always on screen.
- ⚪ **Panel lines only look one section ahead** (降りる / 乗る / が降りる / が乗る). Changes of stack order alone (上下入れ替え between sections) aren't described.

## Phase 5 (final review)
- ✅ **Fixed a bug on main** found while testing the drop prompt: releasing a drag over another object counted as tapping that object, so it was added to the selection and the move was lost. A tap now has to start on the object.
- ✅ **New sections keep stacks.** 「＋」 copies positions from the previous section, so it copies stacks too; otherwise stacked people would just overlap. Duplicating a section already copied them.
- 🟡 **To check with choreographers:** whether stacks should carry into a new section (current: yes), the tier limit (current: none), and whether dancer-on-prop is needed.

## After user testing
- ✅ **Dragging one member moved only that member.** A drag that starts on one member (before the rest are selected, or when the stage only drags that node) now brings the whole stack by the same amount, and selects the whole stack.
- ✅ **Reordering uses drag handles** like the app's other sortable lists, instead of arrows.

## Follow-up round
- ✅ **Drop then stack was two undo steps.** Stacking from the drop prompt now folds into the move's undo step (AMEND_STATE).
- ✅ **The drop prompt only showed once per pair.** A pair is remembered only after そのまま (or closing), not when the prompt opens.
- ✅ **useStackEditing** holds the editor's stack state, actions, drop prompt and dialogs.
- ✅ **位置交換** works for stack↔stack and stack↔person; not for one stack on its own (上下入れ替え covers that).
- ✅ **Linked paths.** A stack with the same members as in the previous section has one path: tapping it while editing paths selects the whole stack, edits go to the bottom member, and the normaliser copies them to the rest. Stacks that form or break up keep separate paths.
- ✅ **Changelog** shows 重なり：〇〇の上 / 〇〇を乗せる / なし per section, with the previous value.
- ✅ **PDF** draws ×N on stacks with a legend; on a followed dancer's sheet they're drawn on top of their stack (red ×N) and their boxes get the stack lines.
- ⚪ On a followed dancer's sheet, whoever is above them is hidden instead; the red ×N and the 〇〇を乗せている line say so.
