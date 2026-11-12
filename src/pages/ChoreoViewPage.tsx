import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BasicChoreoDetails, Choreo } from "../models/choreo";
import { ChoreoSection, MovementCacheBySectionIdByObjectId, PathSvgCacheByObjectIdBySectionId } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";
import { AppSetting } from "../models/appSettings";
import { isNullOrUndefinedOrBlank, strEquals } from "../lib/helpers/globalHelper";
import ViewerSidebar from "../components/editor/ViewerSidebar";
import { StageEntities } from "../models/history";
import { DancerPosition } from "../models/dancer";
import { Obstacle, PropPosition } from "../models/prop";
import ExportDialog from "../components/dialogs/ExportDialog";
import { Dialog } from "@base-ui/react";
import { ChoreoStatus } from "./HomePage";
import BaseErrorDialog from "../components/dialogs/BaseErrorDialog";
import CustomSwitch from "../components/inputs/CustomSwitch";
import { checkShowingViewPageInfoDialog, stopShowingViewPageInfoDialog, getPersonalSectionNote, setPersonalSectionNote, getSeenVersion, setSeenVersion } from "../lib/dataAccess/LocalStorageController";
import Divider from "../components/basic/Divider";
import { calculateMovementCache } from "../lib/helpers/editorCalculationHelper";
import { DancerActionTiming } from "../models/dancerAction";
import { SetStateAction } from "react";
import { SAMPLE_PARADE_ID, SAMPLE_STAGE_ID } from "../lib/consts/consts";
import { getChoreoFile } from "../lib/helpers/apiHelper";
import { buildChangeLog, ChangeLog, hasShownChanges } from "../lib/helpers/changeLogHelper";
import ChangeLogDialog from "../components/dialogs/ChangeLogDialog";
import Icon from "../components/basic/Icon";
import InstructionMessage from "../components/basic/InstructionMessage";
import { useHelp } from "../components/help/HelpContext";
import { findMyDancerId } from "../lib/helpers/myDancerHelper";
import FindDancerDialog from "../components/dialogs/FindDancerDialog";
import { StackListDialog, StackMember } from "../components/dialogs/StackDialogs";
import { findStack, stackNotes } from "../lib/helpers/stackHelper";

const exportDialog = Dialog.createHandle<{}>();

export default function ChoreoViewPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
  currentChoreoStatus: ChoreoStatus,
  goToEditPage: () => void,
  pastVersion?: number,
  myDancerName: string | null,
  // Only given when logged out: logged in, the name is the account name and is changed from home.
  setSavedDancerName?: (name: string) => void,
  teamId?: string,
  serverChoreo?: BasicChoreoDetails,
}) {
  const openHelp = useHelp();
  const openHelpHere = useCallback(() => openHelp({ group: "view" }), [openHelp]);
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: [], obstacles: []});
  const [selectedTimingId, setSelectedTimingId] = useState<string | undefined>();
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    showPreviousSection: false,
    dancerDisplayType: "large",
  });

  const [showHintDialog, setShowHintDialog] = useState<boolean>(false);
  const personalNote = useMemo(
    () => getPersonalSectionNote(props.currentChoreo.id, currentSection.id),
    [props.currentChoreo.id, currentSection.id]
  );

  const [sidebarHeight, setSidebarHeight] = useState<number>(0);

  const entityCount = useMemo(() => ({
    props: Object.keys(props.currentChoreo.props).length,
    dancers: Object.keys(props.currentChoreo.dancers).length,
    obstacles: props.currentChoreo.obstacles ? Object.keys(props.currentChoreo.obstacles).length : 0,
  } as StageEntities<number>), [props.currentChoreo.dancers, props.currentChoreo.props, props.currentChoreo.obstacles]);
  const [dancerMovementCache, setDancerMovementCache] = useState<MovementCacheBySectionIdByObjectId>({});
  const [dancerAnimationCache, setDancerAnimationCache] = useState<PathSvgCacheByObjectIdBySectionId>({});
  const [propAnimationCache, setPropAnimationCache] = useState<PathSvgCacheByObjectIdBySectionId>({});

  const resetSelectedIds = useCallback(() => setSelectedIds({props: [], dancers: [], obstacles: []}), []);

  useEffect(() => {
    // The how-to hint is for a first look at the current version, not for checking an old one.
    const shouldShowHint = props.pastVersion === undefined && !checkShowingViewPageInfoDialog();
    if (!isNullOrUndefinedOrBlank(props.myDancerName)) {
      const myDancerId = findMyDancerId(props.currentChoreo.dancers, props.myDancerName);
      if (myDancerId) {
        setSelectedIds({dancers: [myDancerId], props: [], obstacles: []});
        setShowHintDialog(false);
      } else {
        resetSelectedIds();
        setShowHintDialog(shouldShowHint);
      }
    } else {
      setShowHintDialog(shouldShowHint);
    }
    const res = calculateMovementCache(props.currentChoreo, false);
    setDancerAnimationCache(res.newDancerAnimationCache);
    setDancerMovementCache(res.newDancerMovementCache);
    setPropAnimationCache(res.newPropAnimationCache);
  }, [props.currentChoreo, props.pastVersion, resetSelectedIds]);

  // Read once, before the effect below stores the current version.
  const [seenVersionAtOpen] = useState(() => getSeenVersion(props.currentChoreo.id));
  const isChangeLogEligible = props.pastVersion === undefined &&
    props.currentChoreoStatus === "upToDate" &&
    !isNullOrUndefinedOrBlank(props.teamId) &&
    props.currentChoreo.version !== undefined &&
    !strEquals(props.currentChoreo.id, SAMPLE_STAGE_ID) &&
    !strEquals(props.currentChoreo.id, SAMPLE_PARADE_ID);

  const hasNewVersion = isChangeLogEligible && seenVersionAtOpen !== undefined && seenVersionAtOpen < props.currentChoreo.version!!;

  // With a newer version, it's only stored once compared below, so a failed load is retried next time.
  useEffect(() => {
    if (isChangeLogEligible && !hasNewVersion) {
      setSeenVersion(props.currentChoreo.id, props.currentChoreo.version!!);
    }
  }, [isChangeLogEligible, hasNewVersion, props.currentChoreo.id, props.currentChoreo.version]);
  const [changeLog, setChangeLog] = useState<ChangeLog>();
  const [isChangeLogBannerShown, setIsChangeLogBannerShown] = useState<boolean>(true);
  const [changeLogSelection, setChangeLogSelection] = useState<string>(); // undefined when closed

  useEffect(() => {
    if (!hasNewVersion) return;
    let cancelled = false;
    getChoreoFile(props.teamId!!, props.currentChoreo.id, seenVersionAtOpen!!)
      .then(oldChoreo => {
        try {
          const log = buildChangeLog(oldChoreo, props.currentChoreo);
          if (cancelled) return;
          setSeenVersion(props.currentChoreo.id, props.currentChoreo.version!!);
          if (hasShownChanges(log)) {
            setChangeLog(log);
          }
        } catch (e) {
          console.error("Failed to build change log", e);
        }
      })
      .catch(() => {}); // getChoreoFile already logs download failures
    return () => { cancelled = true; };
  }, [hasNewVersion, props.teamId, props.currentChoreo, seenVersionAtOpen]);

  const selectedObjects = useMemo(() => ({
    dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]),
    props: [],
    obstacles: []
  } as StageEntities<PropPosition[], DancerPosition[], Obstacle[]>), [selectedIds, currentSection]);

  const nextSection = useMemo(() => {
    const sections = props.currentChoreo.sections;
    const index = sections.findIndex(s => strEquals(s.id, currentSection.id));
    return index >= 0 && index < sections.length - 1 ? sections[index + 1] : undefined;
  }, [props.currentChoreo.sections, currentSection.id]);

  const changeSection = useCallback((section: ChoreoSection) => {
    if (selectedTimingId) {
      setSelectedTimingId(undefined);
      resetSelectedIds();
    }
    setCurrentSection(section);
  }, [selectedTimingId, resetSelectedIds]);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const handleExportDialogOpen = useCallback((isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setExportDialogOpen(isOpen);
  }, []);

  // Opens on the selected dancer if they have changes, otherwise on 全体 (including when a count is selected).
  const openChangeLog = useCallback(() => {
    const id = selectedIds.dancers.length === 1 && selectedTimingId === undefined ? selectedIds.dancers[0] : "";
    setChangeLogSelection(changeLog?.dancers[id] ? id : "");
  }, [selectedIds.dancers, selectedTimingId, changeLog]);
  const closeChangeLog = useCallback(() => setChangeLogSelection(undefined), []);

  // ---- Header handlers ----
  const openExportDialog = useCallback(() => setExportDialogOpen(true), []);
  const toggleShowGrid = useCallback(() => {
    setAppSettings(prev => ({...prev, showGrid: !prev.showGrid}));
  }, []);
  const toggleShowPath = useCallback(() => setShowPaths(prev => !prev), []);

  // ---- ViewerSidebar handlers ----
  // Notes are saved per choreo, not per version, so they're hidden on past versions.
  const isPersonalNoteShown = props.pastVersion === undefined;
  const onPersonalNoteChange = useCallback((newNote: string) => {
    setPersonalSectionNote(props.currentChoreo.id, currentSection.id, newNote);
  }, [props.currentChoreo.id, currentSection.id]);

  const onSelectTiming = useCallback((timing?: DancerActionTiming) => {
    if (timing) {
      setSelectedIds({props: [], dancers: timing.dancerIds, obstacles: []});
      setSelectedTimingId(timing.id);
    } else {
      resetSelectedIds();
      setSelectedTimingId(undefined);
    }
  }, [resetSelectedIds]);

  const onChangeHeight = useCallback((height: number) => setSidebarHeight(height), []);

  const formationSelectionToolbar = useMemo(() => (
    <FormationSelectionToolbar
      currentSectionId={currentSection.id}
      sections={props.currentChoreo.sections}
      showFirstSectionButton
      onChangeSection={changeSection}
    />
  ), [currentSection.id, props.currentChoreo.sections, changeSection]);

  // ---- MainStage handlers ----
  // Tapping a stack lists who is there instead of selecting the top person; the count stays until someone is picked.
  const [stackList, setStackList] = useState<{ kind: "dancers" | "props", members: StackMember[] }>();
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;
  const onSetSelectedIds = useCallback((action: SetStateAction<StageEntities<string[]>>) => {
    const next = typeof action === "function" ? action(selectedIdsRef.current) : action;
    // Props can't be selected here; only a stacked prop responds, by showing what's in the stack.
    if (next.props.length > 0) {
      const propStack = next.props.length === 1 ? findStack(currentSection.formation, "props", next.props[0]) : undefined;
      if (propStack) {
        setStackList({ kind: "props", members: [...propStack].reverse().map(id => ({
          id,
          label: props.currentChoreo.props[id]?.name ?? "",
          color: props.currentChoreo.props[id]?.color,
        })) });
      }
      return;
    }
    const tapped = next.dancers.length === 1 ? next.dancers[0] : undefined;
    const stack = tapped ? findStack(currentSection.formation, "dancers", tapped) : undefined;
    if (stack) {
      setStackList({ kind: "dancers", members: [...stack].reverse().map(id => ({
        id,
        label: props.currentChoreo.dancers[id]?.name ?? "",
        color: currentSection.formation.dancerPositions[id]?.color,
      })) });
      return;
    }
    setSelectedIds(next);
    setSelectedTimingId(undefined);
  }, [currentSection.formation, props.currentChoreo.dancers, props.currentChoreo.props]);

  const stackNote = useMemo(() => {
    if (selectedIds.dancers.length !== 1) return {};
    return stackNotes(currentSection.formation, nextSection?.formation, selectedIds.dancers[0],
      id => props.currentChoreo.dancers[id]?.name ?? "");
  }, [selectedIds.dancers, currentSection.formation, nextSection, props.currentChoreo.dancers]);

  const selectedDancerMovement = useMemo(() => (
    showPaths && selectedIds.dancers.length === 1 && !selectedTimingId && nextSection ?
    {
      current: currentSection.formation.dancerPositions[selectedIds.dancers[0]],
      next: nextSection.formation.dancerPositions[selectedIds.dancers[0]]
     } :
    undefined
  ), [showPaths, selectedIds.dancers, selectedTimingId, nextSection, currentSection]);

  const closeHintDialog = useCallback(() => setShowHintDialog(false), []);

  // ---- Find dancer ----
  const [findDancerOpen, setFindDancerOpen] = useState(false);
  const [focusDancerRequest, setFocusDancerRequest] = useState(0);
  const openFind = useCallback(() => setFindDancerOpen(true), []);
  const myDancerId = useMemo(
    () => findMyDancerId(props.currentChoreo.dancers, props.myDancerName),
    [props.currentChoreo.dancers, props.myDancerName]
  );
  const { setSavedDancerName } = props;
  const onFindDancer = useCallback((dancerId: string, saveAsMe: boolean) => {
    setSelectedIds({props: [], dancers: [dancerId], obstacles: []});
    setSelectedTimingId(undefined);
    setFocusDancerRequest(n => n + 1);
    if (saveAsMe && setSavedDancerName) {
      setSavedDancerName(props.currentChoreo.dancers[dancerId].name);
    }
  }, [props.currentChoreo.dancers, setSavedDancerName]);
  const closeExportDialog = useCallback(() => setExportDialogOpen(false), []);

  return (
    <div className='flex flex-col h-[100svh] max-h-[100svh] overflow-hidden'>
      <Header
        returnHome={props.goToHomePage}
        currentChoreo={props.currentChoreo}
        onDownload={props.pastVersion === undefined ? openExportDialog : undefined}
        changeShowGrid={toggleShowGrid}
        appSettings={appSettings}
        goToEdit={props.pastVersion === undefined ? props.goToEditPage : undefined}
        toggleShowPath={toggleShowPath}
        showPath={showPaths}
        isShowPathBtnDisabled={selectedIds.dancers.length !== 1 || selectedTimingId !== undefined}
        stageLength={props.currentChoreo.stageGeometry.stageLength}
        stageWidth={props.currentChoreo.stageGeometry.stageWidth}
        dancerCount={entityCount.dancers}
        propCount={entityCount.props}
        version={props.currentChoreo.version}
        choreoStatus={props.currentChoreoStatus}
        />
      {
        props.pastVersion !== undefined &&
        <div className="px-3 py-1 text-sm font-semibold text-center border-b-2 border-primary text-primary bg-surface">
          過去の版（v{props.pastVersion}）を表示中です。最新版ではありません。
        </div>
      }
      <div className="relative flex-1 overflow-hidden border-b-2 md:flex">
        <ViewerSidebar
          actions={currentSection.formation.dancerActions}
          note={currentSection.note}
          personalNote={isPersonalNoteShown ? personalNote : undefined}
          sectionId={currentSection.id}
          sections={props.currentChoreo.sections}
          onChangeSection={changeSection}
          onPersonalNoteChange={isPersonalNoteShown ? onPersonalNoteChange : undefined}
          dancer={props.currentChoreo.dancers[selectedIds.dancers[0]]}
          position={currentSection.formation.dancerPositions[selectedIds.dancers[0]]}
          nextPosition={nextSection?.formation.dancerPositions[selectedIds.dancers[0]]}
          stackNote={stackNote.now}
          stackMoveNote={stackNote.next}
          stackLine={section => stackNotes(section.formation, undefined, selectedIds.dancers[0],
            id => props.currentChoreo.dancers[id]?.name ?? "").now}
          geometry={props.currentChoreo.stageGeometry}
          isPositionHintShown={
            selectedIds.dancers.length === 1 &&
            selectedTimingId === undefined &&
            selectedObjects.dancers.length === 1 &&
            selectedObjects.props.length === 0 &&
            props.currentChoreo.dancers[selectedIds.dancers[0]] !== undefined
          }
          deselectPosition={resetSelectedIds}
          onSelectTiming={onSelectTiming}
          selectedTiming={selectedTimingId}
          formationSelectionToolbar={formationSelectionToolbar}
          onChangeHeight={onChangeHeight}
        />
        <MainStage
          appSettings={appSettings}
          canEdit={false}
          canSelectProps={!!currentSection.formation.propStacks?.length}
          canSelectObstacles={false}
          hideTransformerBorder
          canSelectDancers
          canToggleSelection={false}
          currentChoreo={props.currentChoreo}
          currentSection={currentSection}
          selectedIds={selectedIds}
          selectedObjects={selectedObjects}
          canResizeProps={false}
          setSelectedIds={onSetSelectedIds}
          selectedDancerMovement={selectedDancerMovement}
          bottomMarginPercent={sidebarHeight}
          dancerMovementCache={dancerMovementCache}
          dancerAnimationCache={dancerAnimationCache}
          propAnimationCache={propAnimationCache}
          openChangeLog={changeLog && !isChangeLogBannerShown ? openChangeLog : undefined}
          openHelp={openHelpHere}
          openFind={entityCount.dancers > 0 ? openFind : undefined}
          focusSelectionRequest={focusDancerRequest}
        />
      </div>

      {
        changeLog && isChangeLogBannerShown &&
        <InstructionMessage
          instruction={
            <button
              className="flex items-center gap-1"
              onClick={() => {
                // Once seen, the stage button takes over from the message.
                setIsChangeLogBannerShown(false);
                openChangeLog();
              }}>
              <Icon src="releaseAlert" colour="primary" size="xs"/>
              前回から変更があります。<b>タップして確認</b>
            </button>
          }
          onClose={() => setIsChangeLogBannerShown(false)}
        />
      }

      <Dialog.Root onOpenChange={closeHintDialog} open={showHintDialog}>
        <BaseErrorDialog title="利用方法" fullWidth onClose={closeHintDialog}>
          <div>名前をタップすると、位置情報が表示されます。</div>
          <Divider/>
          <CustomSwitch
            label="今後このメッセージを表示しない"
            defaultChecked={false}
            onChange={(value) => stopShowingViewPageInfoDialog(value)}/>
        </BaseErrorDialog>
      </Dialog.Root>

      <Dialog.Root open={stackList !== undefined} onOpenChange={open => { if (!open) setStackList(undefined); }}>
        {
          stackList &&
          <StackListDialog
            members={stackList.members}
            kind={stackList.kind}
            onPick={stackList.kind === "props" ? undefined : id => {
              setSelectedIds({ dancers: [id], props: [], obstacles: [] });
              setSelectedTimingId(undefined);
              setStackList(undefined);
            }}/>
        }
      </Dialog.Root>

      <Dialog.Root open={findDancerOpen} onOpenChange={setFindDancerOpen}>
        {
          findDancerOpen &&
          <FindDancerDialog
            dancers={props.currentChoreo.dancers}
            shownId={selectedIds.dancers.length === 1 && selectedTimingId === undefined ? selectedIds.dancers[0] : undefined}
            myDancerId={myDancerId}
            myDancerName={props.myDancerName}
            canSaveAsMe={props.setSavedDancerName !== undefined}
            onConfirm={onFindDancer}/>
        }
      </Dialog.Root>

      <Dialog.Root onOpenChange={closeChangeLog} open={changeLogSelection !== undefined}>
        {
          changeLog && changeLogSelection !== undefined &&
          <ChangeLogDialog
            log={changeLog}
            fromVersion={seenVersionAtOpen!!}
            choreo={props.currentChoreo}
            publishedAt={props.serverChoreo?.lastUpdated}
            initialSelection={changeLogSelection}
            onClose={closeChangeLog}
          />
        }
      </Dialog.Root>

      <Dialog.Root
        handle={exportDialog}
        open={exportDialogOpen}
        onOpenChange={handleExportDialogOpen}
      >
        {
          exportDialogOpen &&
          <ExportDialog
            choreo={props.currentChoreo}
            selectedId={selectedIds.dancers.length === 1 ? selectedIds.dancers[0] : ""}
            onClose={closeExportDialog}
            showPaths={showPaths}
            canIncludePersonalNotes={isPersonalNoteShown}
          />
        }
      </Dialog.Root>
    </div>
  )
}