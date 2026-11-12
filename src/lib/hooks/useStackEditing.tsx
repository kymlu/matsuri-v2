import { Dispatch, SetStateAction, useCallback, useMemo, useRef, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Choreo } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { StageEntities } from "../../models/history";
import { ReorderStackDialog, StackMember, StackOrderDialog, StackPromptDialog, UnstackDialog } from "../../components/dialogs/StackDialogs";
import {
  countUnits, expandSelectionToStacks, findDropTarget, findStack, reorderStack, selectedWholeStack,
  StackKind, stackObjects, StackSpot, swapUnitPositions, swapUnits, unstackObjects,
} from "../helpers/stackHelper";
import { swapDancerPositions, swapPropPositions } from "../editor/commands/objectCommands";

type Selection = StageEntities<string[]>;

type Options = {
  state: Choreo,
  section: ChoreoSection,
  selectedIds: Selection,
  setSelectedIds: Dispatch<SetStateAction<Selection>>,
  commitState: (newState: Choreo) => void,
  // Folds a change into the last undo step (stacking right after the move that offered it).
  amendState: (newState: Choreo) => void,
  isAssigningActions: boolean,
  isEditingMovement: boolean,
};

// Everything the editor needs for stacks: what the selection means for them, the toolbar actions,
// the drop prompt, and the dialogs. The rules themselves live in stackHelper.
export function useStackEditing({ state, section, selectedIds, setSelectedIds, commitState, amendState, isAssigningActions, isEditingMovement }: Options) {
  const formation = section.formation;

  // Stage taps select whole stacks (not while assigning a count or editing a path).
  const setStageSelectedIds = useCallback((action: SetStateAction<Selection>) => {
    setSelectedIds(prev => {
      const next = typeof action === "function" ? action(prev) : action;
      return isAssigningActions || isEditingMovement ? next : expandSelectionToStacks(formation, prev, next);
    });
  }, [formation, isAssigningActions, isEditingMovement, setSelectedIds]);

  const stackKind: StackKind | undefined =
    selectedIds.obstacles.length > 0 ? undefined
    : selectedIds.props.length === 0 && selectedIds.dancers.length > 0 ? "dancers"
    : selectedIds.dancers.length === 0 && selectedIds.props.length > 0 ? "props"
    : undefined;
  const stackIds = useMemo(
    () => stackKind === "dancers" ? selectedIds.dancers : stackKind === "props" ? selectedIds.props : [],
    [stackKind, selectedIds.dancers, selectedIds.props]);
  const canStack = stackKind !== undefined && countUnits(formation, stackKind, stackIds) >= 2;
  const wholeStack = stackKind ? selectedWholeStack(formation, stackKind, stackIds) : undefined;

  // Selected objects that sit under the top of their stack, so can't be seen on the stage.
  const hiddenSelectedNames = useMemo(() => {
    const hidden = (stacks: string[][] | undefined, selected: string[]) =>
      (stacks ?? []).flatMap(stack => stack.slice(0, -1)).filter(id => selected.includes(id));
    return [
      ...hidden(formation.dancerStacks, selectedIds.dancers).map(id => state.dancers[id]?.name ?? ""),
      ...hidden(formation.propStacks, selectedIds.props).map(id => state.props[id]?.name ?? ""),
    ];
  }, [state, formation, selectedIds.dancers, selectedIds.props]);

  const stackMembers = useCallback((kind: StackKind, ids: string[]): StackMember[] => {
    return ids.map(id => kind === "dancers"
      ? { id, label: state.dancers[id]?.name ?? "", color: formation.dancerPositions[id]?.color }
      : { id, label: state.props[id]?.name ?? "", color: state.props[id]?.color });
  }, [state, formation]);

  // Top first: front-most unit on top, each existing stack keeping its own order.
  const defaultStackOrder = useCallback((kind: StackKind, ids: string[]): string[] => {
    const z = (id: string) => (kind === "dancers" ? formation.dancerPositions[id]?.z : formation.propPositions[id]?.z) ?? 0;
    const units: string[][] = [];
    ids.forEach(id => {
      if (units.some(u => u.includes(id))) return;
      const s = findStack(formation, kind, id);
      units.push(s ? [...s].reverse() : [id]);
    });
    return units.sort((a, b) => Math.max(...b.map(z)) - Math.max(...a.map(z))).flat();
  }, [formation]);

  // fromDrop: the pair key of the drop that led here. Stacking then joins the move's undo step;
  // backing out (そのまま, or closing) remembers the pair so the prompt doesn't keep coming back.
  const [stackOrder, setStackOrder] = useState<{ kind: StackKind, members: StackMember[], fromDrop?: string }>();
  const [reorderingStack, setReorderingStack] = useState<{ kind: StackKind, members: StackMember[] }>();
  const [unstacking, setUnstacking] = useState<{ kind: StackKind, members: StackMember[] }>();
  const [stackPrompt, setStackPrompt] = useState<{ kind: StackKind, members: StackMember[], text: string, pairKey: string }>();
  // Pairs the editor answered そのまま for, so moving them a little doesn't ask again.
  const keptApart = useRef<Set<string>>(new Set());
  // The 重ねる button also closes its dialog; this tells that close apart from backing out.
  const stackedDrop = useRef<string | undefined>(undefined);

  const onStack = useCallback(() => {
    if (!stackKind) return;
    setStackOrder({ kind: stackKind, members: stackMembers(stackKind, defaultStackOrder(stackKind, stackIds)) });
  }, [stackKind, stackIds, stackMembers, defaultStackOrder]);

  const onConfirmStack = useCallback((topFirst: string[], spot: StackSpot) => {
    if (!stackOrder) return;
    const stacked = stackObjects(state, section.id, stackOrder.kind, topFirst, spot);
    stackedDrop.current = stackOrder.fromDrop;
    // From a drop: same undo step as the move that offered it, so one undo puts everything back.
    if (stackOrder.fromDrop) amendState(stacked);
    else commitState(stacked);
    setSelectedIds(stackOrder.kind === "dancers"
      ? { dancers: topFirst, props: [], obstacles: [] }
      : { dancers: [], props: topFirst, obstacles: [] });
    setStackOrder(undefined);
  }, [stackOrder, state, section.id, amendState, commitState, setSelectedIds]);

  const onReorderStack = useCallback(() => {
    if (!stackKind || !wholeStack) return;
    const topFirst = [...wholeStack].reverse();
    if (wholeStack.length === 2) {
      // Two: just swap who is on top.
      commitState(reorderStack(state, section.id, stackKind, [...topFirst].reverse()));
    } else {
      setReorderingStack({ kind: stackKind, members: stackMembers(stackKind, topFirst) });
    }
  }, [stackKind, wholeStack, commitState, state, section.id, stackMembers]);

  const onUnstack = useCallback(() => {
    if (!stackKind || !wholeStack) return;
    if (wholeStack.length === 2) {
      commitState(unstackObjects(state, section.id, stackKind, wholeStack));
    } else {
      setUnstacking({ kind: stackKind, members: stackMembers(stackKind, [...wholeStack].reverse()) });
    }
  }, [stackKind, wholeStack, commitState, state, section.id, stackMembers]);

  // 位置交換 works on two separate things: people, props or whole stacks (not within one stack:
  // that's 上下入れ替え).
  const swapPair = stackKind ? swapUnits(formation, stackKind, stackIds) : undefined;
  const onSwap = useCallback(() => {
    if (!stackKind || !swapPair) return;
    const [a, b] = swapPair;
    if (a.length === 1 && b.length === 1) {
      // Two single objects: the original command (which also swaps front/back).
      commitState(stackKind === "dancers"
        ? swapDancerPositions(state, section.id, a[0], b[0])
        : swapPropPositions(state, section.id, a[0], b[0]));
    } else {
      commitState(swapUnitPositions(state, section.id, stackKind, a, b));
    }
  }, [stackKind, swapPair, commitState, state, section.id]);

  // After a move is saved: if one thing (or one stack) was dropped almost exactly onto another of the
  // same kind, offer to stack them.
  const offerStackOnDrop = useCallback((moved: Choreo, group: StageEntities<Record<string, unknown>>) => {
    const movedDancers = Object.keys(group.dancers);
    const movedProps = Object.keys(group.props);
    const kind: StackKind | undefined = Object.keys(group.obstacles).length > 0 ? undefined
      : movedProps.length === 0 ? "dancers" : movedDancers.length === 0 ? "props" : undefined;
    if (!kind) return;
    const movedIds = kind === "dancers" ? movedDancers : movedProps;
    const f = moved.sections.find(s => s.id === section.id)?.formation;
    if (!f) return;
    const target = findDropTarget(f, kind, movedIds, moved.props);
    const pairKey = target && `${section.id}:${[...movedIds, ...target].sort().join(",")}`;
    if (!target || !pairKey || keptApart.current.has(pairKey)) return;
    const name = (id: string) => kind === "dancers" ? moved.dancers[id]?.name : moved.props[id]?.name;
    const topFirst = [...movedIds, ...[...target].reverse()];
    setStackPrompt({
      kind,
      members: stackMembers(kind, topFirst),
      text: `${movedIds.map(name).join("・")}と${target.map(name).join("・")}を重ねます。`,
      pairKey,
    });
  }, [section.id, stackMembers]);

  const stackDialogs = <>
    <Dialog.Root open={stackOrder !== undefined} onOpenChange={open => {
      if (open) return;
      if (stackOrder?.fromDrop && stackedDrop.current !== stackOrder.fromDrop) keptApart.current.add(stackOrder.fromDrop);
      stackedDrop.current = undefined;
      setStackOrder(undefined);
    }}>
      {
        stackOrder &&
        <StackOrderDialog
          initial={stackOrder.members}
          onSubmit={onConfirmStack}
          onBack={stackOrder.fromDrop ? () => {
            setStackPrompt({ kind: stackOrder.kind, members: stackOrder.members, text: `${stackOrder.members.map(m => m.label).join("・")}を重ねます。`, pairKey: stackOrder.fromDrop! });
            setStackOrder(undefined);
          } : undefined}/>
      }
    </Dialog.Root>
    <Dialog.Root open={reorderingStack !== undefined} onOpenChange={open => { if (!open) setReorderingStack(undefined); }}>
      {
        reorderingStack &&
        <ReorderStackDialog
          initial={reorderingStack.members}
          onSubmit={topFirst => {
            commitState(reorderStack(state, section.id, reorderingStack.kind, topFirst));
            setReorderingStack(undefined);
          }}/>
      }
    </Dialog.Root>
    <Dialog.Root open={unstacking !== undefined} onOpenChange={open => { if (!open) setUnstacking(undefined); }}>
      {
        unstacking &&
        <UnstackDialog
          members={unstacking.members}
          onSubmit={ids => {
            commitState(unstackObjects(state, section.id, unstacking.kind, ids));
            setSelectedIds(unstacking.kind === "dancers"
              ? { dancers: ids, props: [], obstacles: [] }
              : { dancers: [], props: ids, obstacles: [] });
            setUnstacking(undefined);
          }}/>
      }
    </Dialog.Root>
    <Dialog.Root open={stackPrompt !== undefined} onOpenChange={open => {
      if (open) return;
      if (stackPrompt) keptApart.current.add(stackPrompt.pairKey);
      setStackPrompt(undefined);
    }}>
      {
        stackPrompt &&
        <StackPromptDialog
          text={stackPrompt.text}
          onKeep={() => {
            keptApart.current.add(stackPrompt.pairKey);
            setStackPrompt(undefined);
          }}
          onNext={() => {
            setStackOrder({ kind: stackPrompt.kind, members: stackPrompt.members, fromDrop: stackPrompt.pairKey });
            setStackPrompt(undefined);
          }}/>
      }
    </Dialog.Root>
  </>;

  return {
    setStageSelectedIds,
    stackKind, stackIds, canStack, wholeStack, hiddenSelectedNames,
    onStack, onReorderStack, onUnstack,
    canSwap: swapPair !== undefined, onSwap,
    offerStackOnDrop,
    stackDialogs,
  };
}
