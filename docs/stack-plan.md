# Stacks: implementation plan

Branch: `feature/stack`, from main (find in view and edit mode already merged).
Spec: the "find dancer and stacking" mock page. Same-type stacks only (dancers on dancers, props on props).

## First draft, and its review

The first draft followed the spec literally:

1. `onTopOf: id` on every dancer and prop position.
2. Every editor command (move, align, distribute, swap, paste, delete, front/back, path edit) made stack-aware one by one.
3. Drag-to-reorder lists, a floating tap list on the stage, a docked member list, the 重ねますか prompt, the grey ×2 overlap badge, PDF markers, and panel lines in the viewer.

Review:

| Problem | Why it matters | Change |
|---|---|---|
| `onTopOf` links break when the middle item is deleted, from any of four delete paths | Deleting the middle person would drop the top person to the floor unless every delete path relinks | Store each stack as an ordered list on the formation: `dancerStacks: string[][]`, `propStacks: string[][]`, bottom first. Deleting an id just removes it from its list; lists under 2 disappear. Reorder, merge and flatten become list operations. |
| Making ~12 commands stack-aware one by one | Large, easy to miss one, hard to test | One **normaliser** run on every state change (history reducer): drop missing ids and short stacks, snap members to the bottom member's spot, keep z consecutive. Commands stay unaware; whatever they do, the invariant is restored with the bottom member as the anchor. |
| Selecting a stack as a whole | Every command then acts on all members, which keeps them together for free | Stage taps in the editor expand to whole stacks (tap again removes the whole stack). Find and toolbar selections stay per person. |
| Drag-to-reorder list | No drag-and-drop library in the project; touch drag lists are fiddly | ↑ / ↓ buttons per row in 重ねる順 and 並べ替え. Same result, accessible, small. |
| Floating tap list on the stage (viewer) | Needs positioning against the canvas, flipping near the panel, closing rules | A small standard dialog 「ここに◯人」 listing the members. Same content, existing component. |
| Docked member list (editor) | Camera pan, height cap, toolbar switching: a feature of its own | Not in this branch. Find (edit) already ticks individual people inside a stack. |
| Grey ×2, overlap warnings, PDF markers, shared paths | Each is its own piece of work | Not in this branch; listed as concerns. |
| Older app versions | zod drops unknown fields, so an old client saving would erase stacks | Cannot be fixed in code here; flagged. |

## Rewritten plan

### Phase 1: data and helpers
- `FormationSchema`: optional `dancerStacks` and `propStacks` (`string[][]`, bottom first).
- `stackHelper.ts` (pure, tested):
  - lookups: stack of an id, top, members above/below, "is hidden" (in a stack, not on top);
  - `normalizeStacks(choreo)`: per section, drop ids with no position, dedupe, drop stacks under 2, snap members to the bottom member (dancers by centre, props centred on the bottom prop), make z consecutive in stack order without moving anything else's relative order. Returns the same object when nothing changes;
  - commands: `stackObjects` (flatten everything selected into one stack, given order and spot), `unstackObjects` (take some out; under 2 left ends the stack), `reorderStack`;
  - `expandSelectionToStacks(prev, next)` for stage taps.

### Phase 2: editor integration
- History reducer runs `normalizeStacks` on every `SET_STATE`.
- Stage taps in the editor go through `expandSelectionToStacks`.
- Toolbar: 重ねる (two or more units of one type, no obstacles), 上下入れ替え (one stack of two), 並べ替え (one stack of three or more), 解除 (one stack).
- Dialogs: 重ねる順 (order with ↑/↓, spot: 一番下の人の位置 / 真ん中), 並べ替え (same list), 外す人を選ぶ (three or more; two ends straight away).
- Drop prompt: after a single unit is dragged so its centre lands within 0.2m of another unit of the same type, 「重ねますか？」 → 次へ → 重ねる順.

### Phase 3: stage drawing
- Layers icon on the top member of each stack (drawn shapes, not the icon font).
- When a hidden member is selected and the top is not: dashed red ring on the stack.
- View mode: icon turns red when a hidden member is selected (count selection shows who acts).

### Phase 4: view mode
- Tapping a stack opens 「ここに◯人」 (members top to bottom); picking one selects them.
- Position panel: grey line under 現在の位置 (〇〇の上 / 〇〇を乗せている) and under 次への移動 (〇〇から降りる / 〇〇に乗る).

### Phase 5: help, review, concerns
- Help article for stacking; concerns document; final review.
