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
type Session = { base: Choreo, sectionId: string, sameColour: ShortestMovePlan, anyColour: ShortestMovePlan };

// What the stage shows while previewing.
export type ShortestMovePreview = {
  choreo: Choreo,
  section: ChoreoSection,
  fadedDancerIds: ReadonlySet<string>,
  routes: { routes: PreviewRoute[], kind: ShortestMoveView },
};

// Routes shorter than this aren't drawn (the person is practically in the same place).
const MIN_ROUTE = 0.05;

// 移動を短く: the toolbar check, the preview sheet (in place of the toolbar), what the stage shows while
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
    setSession({ base: state, sectionId: section.id, sameColour: same, anyColour: any });
  }, [prevSection, section, selectedIds, state]);

  const close = useCallback(() => setSession(undefined), []);

  // The plan would be stale if the choreo or the section changed underneath it (e.g. a sync).
  useEffect(() => {
    if (session && (state !== session.base || section.id !== session.sectionId)) setSession(undefined);
  }, [session, state, section.id]);

  const plan = session && (sameColour ? session.sameColour : session.anyColour);
  const hasGain = (plan?.moves.length ?? 0) > 0;

  const after = useMemo(
    () => session && plan && plan.moves.length > 0
      ? moveUnitsTo(session.base, session.sectionId, plan.moves, countsFollowPerson ? "person" : "spot")
      : undefined,
    [session, plan, countsFollowPerson]);

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
    const here = shown.formation.dancerPositions;
    const routes = plan.considered.flatMap(id => {
      const from = prevSection.formation.dancerPositions[id], to = here[id];
      if (!from || !to || Math.hypot(to.x - from.x, to.y - from.y) < MIN_ROUTE) return [];
      return [{ id, from, to, color: to.color }];
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
    <CustomDialog title="入れ替えても移動は短くなりません">
      <Dialog.Close className="w-full mt-2">
        <Button asDiv full><span className="font-semibold">閉じる</span></Button>
      </Dialog.Close>
    </CustomDialog>
  </Dialog.Root>;

  return { canShortestMove, startShortestMove, isPreviewingShortestMove: session !== undefined, shortestMovePreview, shortestMoveSheet, shortestMoveDialog };
}
