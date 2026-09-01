import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Choreo } from "../models/choreo";
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
import { checkShowingViewPageInfoDialog, stopShowingViewPageInfoDialog, getPersonalSectionNote, setPersonalSectionNote } from "../lib/dataAccess/LocalStorageController";
import Divider from "../components/basic/Divider";
import { calculateMovementCache } from "../lib/helpers/editorCalculationHelper";
import { DancerActionTiming } from "../models/dancerAction";
import { SetStateAction } from "react";

const exportDialog = Dialog.createHandle<{}>();

export default function ChoreoViewPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
  currentChoreoStatus: ChoreoStatus,
  goToEditPage: () => void,
  savedDancerName: string | null,
  teamId?: string,
}) {
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
    if (!isNullOrUndefinedOrBlank(props.savedDancerName)) {
      const dancer = Object.values(props.currentChoreo.dancers).find(x => strEquals(x.name, props.savedDancerName));
      if (dancer) {
        setSelectedIds({dancers: [dancer.id], props: [], obstacles: []});
        setShowHintDialog(false);
      } else {
        resetSelectedIds();
        setShowHintDialog(!checkShowingViewPageInfoDialog());
      }
    } else {
      setShowHintDialog(!checkShowingViewPageInfoDialog());
    }
    const res = calculateMovementCache(props.currentChoreo, false);
    setDancerAnimationCache(res.newDancerAnimationCache);
    setDancerMovementCache(res.newDancerMovementCache);
    setPropAnimationCache(res.newPropAnimationCache);
  }, [props.currentChoreo, resetSelectedIds]);

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

  // ---- Header handlers ----
  const openExportDialog = useCallback(() => setExportDialogOpen(true), []);
  const toggleShowGrid = useCallback(() => {
    setAppSettings(prev => ({...prev, showGrid: !prev.showGrid}));
  }, []);
  const toggleShowPath = useCallback(() => setShowPaths(prev => !prev), []);

  // ---- ViewerSidebar handlers ----
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
      onChangeSection={changeSection}
    />
  ), [currentSection.id, props.currentChoreo.sections, changeSection]);

  // ---- MainStage handlers ----
  const onSetSelectedIds = useCallback((action: SetStateAction<StageEntities<string[]>>) => {
    setSelectedIds(action);
    setSelectedTimingId(undefined);
  }, []);

  const selectedDancerMovement = useMemo(() => (
    showPaths && selectedIds.dancers.length === 1 && !selectedTimingId && nextSection ?
    {
      current: currentSection.formation.dancerPositions[selectedIds.dancers[0]],
      next: nextSection.formation.dancerPositions[selectedIds.dancers[0]]
     } :
    undefined
  ), [showPaths, selectedIds.dancers, selectedTimingId, nextSection, currentSection]);

  const closeHintDialog = useCallback(() => setShowHintDialog(false), []);
  const closeExportDialog = useCallback(() => setExportDialogOpen(false), []);

  return (
    <div className='flex flex-col h-[100svh] max-h-[100svh] overflow-hidden'>
      <Header
        returnHome={props.goToHomePage}
        currentChoreo={props.currentChoreo}
        onDownload={openExportDialog}
        changeShowGrid={toggleShowGrid}
        appSettings={appSettings}
        goToEdit={props.goToEditPage}
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
      <div className="relative flex-1 overflow-hidden border-b-2 md:flex">
        <ViewerSidebar
          actions={currentSection.formation.dancerActions}
          note={currentSection.note}
          personalNote={personalNote}
          sectionId={currentSection.id}
          sections={props.currentChoreo.sections}
          onChangeSection={changeSection}
          onPersonalNoteChange={onPersonalNoteChange}
          dancer={props.currentChoreo.dancers[selectedIds.dancers[0]]}
          position={currentSection.formation.dancerPositions[selectedIds.dancers[0]]}
          nextPosition={nextSection?.formation.dancerPositions[selectedIds.dancers[0]]}
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
          canSelectProps={false}
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
        />
      </div>

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
          />
        }
      </Dialog.Root>
    </div>
  )
}