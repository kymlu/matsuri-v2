# Stacks: concerns

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
