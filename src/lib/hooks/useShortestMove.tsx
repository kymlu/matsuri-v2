import { useCallback, useEffect, useMemo, useState } from "react";
import { Dialog } from "@base-ui/react";
import { Choreo } from "../../models/choreo";
import { ChoreoSection } from "../../models/choreoSection";
import { StageEntities } from "../../models/history";
import { canPlanShortestMoves, planShortestMoves, ShortestMovePlan } from "../helpers/shortestMove";
import { moveUnitsTo } from "../helpers/stackHelper";
import ShortestMoveSheet, { ShortestMoveView } from "../../components/editor/ShortestMoveSheet";
import { PreviewRoute } from "../../components/grid/layers/PreviewRoutesLayer";
import CustomDialog from "../../components/basic/CustomDialog";
import Button from "../../components/basic/Button";

type Options = {
  state: Choreo,
  section: ChoreoSection,
  prevSection?: ChoreoSection,
  selectedIds: StageEntities<string[]>,
  commitState: (newState: Choreo) => void,
};

// Both plans are made once, when the button is pressed, from the choreo as it was then.
type Session = {
  base: Choreo,
  sectionId: string,
  // What the plans were made from, to re-plan when colours are left out.
  prev: ChoreoSection,
  formation: ChoreoSection["formation"],
  selectedIds: StageEntities<string[]>,
  sameColour: ShortestMovePlan,
  anyColour: ShortestMovePlan,
};

// What the stage shows while previewing.
export type ShortestMovePreview = {
  choreo: Choreo,
  section: ChoreoSection,
  fadedDancerIds: ReadonlySet<string>,
  routes: { routes: PreviewRoute[], kind: ShortestMoveView },
};

// Routes shorter than this aren't drawn (the person is practically in the same place).
const MIN_ROUTE = 0.05;

// 最短距離: the toolbar check, the preview sheet (in place of the toolbar), what the stage shows while
// previewing, and the dialog for when nothing would get shorter. Applying commits the previewed choreo
// itself, so it is one undo step and exactly what was shown.
export function useShortestMove({ state, section, prevSection, selectedIds, commitState }: Options) {
  const canShortestMove = useMemo(
    () => canPlanShortestMoves(prevSection?.formation, section.formation, selectedIds),
    [prevSection, section.formation, selectedIds]);

  const [session, setSession] = useState<Session | undefined>(undefined);
  const [noGainOpen, setNoGainOpen] = useState(false);
  const [sameColour, setSameColour] = useState(true);
  const [countsFollowPerson, setCountsFollowPerson] = useState(false);
  const [view, setView] = useState<ShortestMoveView>("after");
  const [excludedColours, setExcludedColours] = useState<ReadonlySet<string>>(new Set());
  const [colourFollowsPerson, setColourFollowsPerson] = useState(true);

  const startShortestMove = useCallback(() => {
    if (!prevSection) return;
    const plan = (same: boolean) => planShortestMoves(prevSection.formation, section.formation, selectedIds, { sameColour: same });
    const same = plan(true), any = plan(false);
    if (same.moves.length === 0 && any.moves.length === 0) {
      setNoGainOpen(true);
      return;
    }
    // Every opening starts from the safe defaults.
    setSameColour(true);
    setCountsFollowPerson(false);
    setView("after");
    setExcludedColours(new Set());
    setColourFollowsPerson(true);
    setSession({ base: state, sectionId: section.id, prev: prevSection, formation: section.formation, selectedIds, sameColour: same, anyColour: any });
  }, [prevSection, section, selectedIds, state]);

  // Cancelling puts people straight back, without the slide: the render that closes the preview still tells the
  // stage to jump, and the stage draws the real positions in that same render. Animation is back on after it.
  const [snapBack, setSnapBack] = useState(false);
  const close = useCallback(() => {
    setSnapBack(true);
    setSession(undefined);
  }, []);
  useEffect(() => {
    if (snapBack) setSnapBack(false);
  }, [snapBack]);

  // The plan would be stale if the choreo or the section changed underneath it (e.g. a sync).
  useEffect(() => {
    if (session && (state !== session.base || section.id !== session.sectionId)) setSession(undefined);
  }, [session, state, section.id]);

  // Every colour among the people taking part, in the order they appear. Turning one off keeps its people in place.
  const colours = useMemo(() => {
    if (!session) return [];
    const here = session.formation.dancerPositions;
    return Array.from(new Set(session.sameColour.considered.map(id => here[id].color)));
  }, [session]);

  // Plans for the colours left in, with and without the colour rule.
  const plans = useMemo(() => {
    if (!session) return undefined;
    if (excludedColours.size === 0) return { same: session.sameColour, any: session.anyColour };
    const plan = (same: boolean) =>
      planShortestMoves(session.prev.formation, session.formation, session.selectedIds, { sameColour: same, excludeColours: excludedColours });
    return { same: plan(true), any: plan(false) };
  }, [session, excludedColours]);
  const plan = plans && (sameColour ? plans.same : plans.any);
  const hasGain = (plan?.moves.length ?? 0) > 0;

  const toggleColour = useCallback((colour: string) => setExcludedColours(old => {
    const next = new Set(old);
    if (!next.delete(colour)) next.add(colour);
    return next;
  }), []);

  const after = useMemo(
    () => session && plan && plan.moves.length > 0
      ? moveUnitsTo(session.base, session.sectionId, plan.moves, countsFollowPerson ? "person" : "spot",
        sameColour || colourFollowsPerson ? "person" : "spot")
      : undefined,
    [session, plan, countsFollowPerson, sameColour, colourFollowsPerson]);

  // The preview closes itself once the new state arrives (the effect above), in the same render as the page's
  // section catching up. Closing here would show the old positions for a frame and animate people back.
  const apply = useCallback(() => {
    if (after) commitState(after);
    else setSession(undefined);
  }, [after, commitState]);

  const shortestMovePreview = useMemo((): ShortestMovePreview | undefined => {
    if (!session || !plan || !prevSection) return undefined;
    const kind: ShortestMoveView = hasGain ? view : "now";
    const choreo = kind === "after" && after ? after : session.base;
    const shown = choreo.sections.find(s => s.id === session.sectionId);
    if (!shown) return undefined;
    const considered = new Set(plan.considered);
    const changed = new Set(plan.moves.map(m => m.unit[0]));
    const here = shown.formation.dancerPositions;
    const routes = plan.considered.flatMap(id => {
      const from = prevSection.formation.dancerPositions[id], to = here[id];
      if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) < MIN_ROUTE) return [];
      return [{ id, from, to, color: to.color, changed: changed.has(id), path: shown.formation.dancerMovements?.[id] }];
    });
    return {
      choreo,
      section: shown,
      fadedDancerIds: new Set(Object.keys(here).filter(id => !considered.has(id))),
      routes: { routes, kind },
    };
  }, [session, plan, prevSection, hasGain, view, after]);

  const shortestMoveSheet = session && plan && prevSection
    ? <ShortestMoveSheet
        previousSectionName={prevSection.name}
        totalBefore={plan.totalBefore}
        totalAfter={plan.totalAfter}
        hasGain={hasGain}
        noGainMessage={hasGain ? undefined
          : colours.every(c => excludedColours.has(c)) ? "色を1つ以上選んでください"
          : sameColour ? "同じ色どうしでは、これ以上短くなりません"
          : "これ以上短くなりません"}
        colours={colours}
        colourFollowsPerson={colourFollowsPerson}
        onChangeColourFollowsPerson={setColourFollowsPerson}
        excludedColours={excludedColours}
        onToggleColour={toggleColour}
        view={view}
        onChangeView={setView}
        sameColour={sameColour}
        onChangeSameColour={setSameColour}
        showCountsOption={plan.countsAffected}
        countsFollowPerson={countsFollowPerson}
        onChangeCountsFollowPerson={setCountsFollowPerson}
        skippedStacked={plan.skippedStacked}
        onCancel={close}
        onApply={apply}/>
    : undefined;

  const shortestMoveDialog = <Dialog.Root open={noGainOpen} onOpenChange={setNoGainOpen}>
    <CustomDialog title="これ以上短くなりません">
      <Dialog.Close className="w-full mt-2">
        <Button asDiv full><span className="font-semibold">閉じる</span></Button>
      </Dialog.Close>
    </CustomDialog>
  </Dialog.Root>;

  return {
    canShortestMove, startShortestMove, isPreviewingShortestMove: session !== undefined,
    // The stage jumps rather than animates while previewing (flipping 今／最短) and when cancelling.
    shortestMoveInstantMoves: session !== undefined || snapBack,
    shortestMovePreview, shortestMoveSheet, shortestMoveDialog,
  };
}
