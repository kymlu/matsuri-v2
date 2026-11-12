# Stacks: concerns

Running list, added to after each phase's review. 🔴 = must be handled before release, 🟡 = should be decided, ⚪ = known limit.

## Phase 1 (data and helpers)
- 🔴 **Older app versions erase stacks.** The formation schema is zod with default stripping. Anyone on a cached older version who opens and saves a choreography drops `dancerStacks` / `propStacks` silently. Needs a release where the schema keeps the fields before stacking ships, or a version check that blocks saving from old clients.
- 🟡 **Server validation.** If the server validates choreography JSON against its own schema, it has to accept the two new fields. Not checked from here.
- ⚪ **Rotated props** are centred on the prop below by their unrotated boxes, so a rotated top prop can look slightly off.
- ⚪ **The bottom member is the anchor.** Whatever a command does, members snap back to the bottom one. Moving a single non-bottom member on purpose (e.g. through find + drag) is silently undone, which is the "locked" rule, but there is no message.
