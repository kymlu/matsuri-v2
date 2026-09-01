import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { BasicChoreoDetails, Choreo, EventDetails, getBasicChoreoDetails } from "../models/choreo";
import { EditHistory, StageEntities } from "../models/history";
import { addSection, assignDancersToTiming, duplicateSection, editDancerActions, editSectionNote, removeSection, renameSection, reorderSections } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection, Movement, MovementCacheBySectionIdByObjectId, MovementType, PathSvgCacheByObjectIdBySectionId } from "../models/choreoSection";
import { debounce, indexByKey, isNullOrUndefinedOrBlank, strEquals, stringifyEvent } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportChoreo } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, SAMPLE_PARADE_ID, SAMPLE_STAGE_ID } from "../lib/consts/consts";
import { AppSetting } from "../models/appSettings";
import { changeStageGeometryAndType, renameChoreo } from "../lib/editor/commands/choreoCommands";
import EditChoreoInfoDialog from "../components/dialogs/EditChoreoInfoDialog";
import EditDancerColourDialog from "../components/dialogs/EditDancerColourDialog";
import { DancerPosition } from "../models/dancer";
import { ActionManagerDialog } from "../components/dialogs/ActionManagerDialog";
import { DancerAction, DancerActionTiming } from "../models/dancerAction";
import ActionSelectionToolbar from "../components/editor/ActionSelectionToolbar";
import ConfirmDeletionDialog from "../components/dialogs/ConfirmDeletionDialog";
import EditSectionNoteDialog from "../components/dialogs/EditSectionNoteDialog";
import { getPersonalNotesForChoreo } from "../lib/dataAccess/LocalStorageController";
import { Coordinates } from "../models/base";
import { colorPalette } from "../lib/consts/colors";
import { addDancer, addObstacle, addObstacles, addProp, alignHorizontalPositions, alignVerticalPositions, changeObjectColours, changePropInUse, distributePositions, duplicateProps, editAndDeleteProps, editDancerPath, editPropPath, moveObjectPositions, pastePositions, rearrangePositions, removeObjects, renameAndDeleteDancers, renameDancer, renameObstacle, renameProp, setZOnAllPositions, swapDancerPositions, swapPropPositions, updateObstacleSizeAndRotate, updatePropSizeAndRotate } from "../lib/editor/commands/objectCommands";
import { Obstacle, PropPosition } from "../models/prop";
import { DancerManagerDialog } from "../components/dialogs/DancerManagerDialog";
import ExportDialog from "../components/dialogs/ExportDialog";
import { PropManagerDialog } from "../components/dialogs/PropManagerDialog";
import EditNameDialog from "../components/dialogs/EditNameDialog";
import CustomDialog from "../components/basic/CustomDialog";
import { IconLabelButton } from "../components/basic/Button";
import EditDancerNameDialog from "../components/dialogs/EditDancerNameDialog";
import AbsentDancersWarningDialog from "../components/dialogs/AbsentDancersWarningDialog";
import InstructionMessage from "../components/basic/InstructionMessage";
import { ChoreoStatus } from "./HomePage";
import PublishConfirmationDialog from "../components/dialogs/PublishConfirmationDialog";
import BaseEditDialog from "../components/dialogs/BaseEditDialog";
import { getChoreoPassword } from "../lib/helpers/apiHelper";
import { calculateMovementCache, cornerToCentreFromProp } from "../lib/helpers/editorCalculationHelper";
import { Distribution, HorizontalAlignment, Rearrangement, VerticalAlignment } from "../models/alignment";

const resizeDialog = Dialog.createHandle<Choreo>();
const editChoreoInfoDialog = Dialog.createHandle<string>();
const sectionManagerDialog = Dialog.createHandle<string>();
const renameDancerDialog = Dialog.createHandle<string>();
const renamePropDialog = Dialog.createHandle<string>();
const renameObstacleDialog = Dialog.createHandle<string>();
const editDancerColourDialog = Dialog.createHandle<string>();
const editDancerActionsDialog = Dialog.createHandle<string>();
const dancerManagerDialog = Dialog.createHandle<string>();
const propManagerDialog = Dialog.createHandle<string>();
const propSizeDialog = Dialog.createHandle<string>();
const renameSectionDialog = Dialog.createHandle<ChoreoSection>();
const addNoteToSectionDialog = Dialog.createHandle<ChoreoSection>();
const deleteSectionDialog = Dialog.createHandle<ChoreoSection>();
const dancerWarningDialog = Dialog.createHandle<Choreo>();
const publishConfirmationDialog = Dialog.createHandle<null>();
const publishSuccessDialog = Dialog.createHandle<null>();
const exportDialog = Dialog.createHandle<{}>();

const manageSectionsTodo = () => console.log("TODO: implement Manage Sections");

type SelectedEntity = { id: string, type: "dancer" | "prop" };

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
  currentChoreoStatus: ChoreoStatus,
  goToViewPage: (newChoreo: Choreo) => void,
  eventList: EventDetails[],
  dancerNamesByEvent: Record<string, Record<string, string[]>>,
  onChoreoEdited: () => void,
  serverChoreo?: BasicChoreoDetails,
  isLoggedIn: boolean,
  isViewer: boolean,
  teamId?: string,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [currentAction, setCurrentAction] = useState<DancerAction | undefined>();
  const [currentTiming, setCurrentTiming] = useState<DancerActionTiming | undefined>();
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: [], obstacles: []});
  const [isAddingDancers, setIsAddingDancers] = useState<boolean>(false);
  const [showPaths, setShowPaths] = useState<boolean>(false);
  const [isEditingMovement, setIsEditingMovement] = useState<boolean>(false);
  const [isAddingProps, setIsAddingProps] = useState<boolean>(false);
  const [isAddingObstacles, setIsAddingObstacles] = useState<boolean>(false);
  const [isAssigningActions, setIsAssigningActions] = useState<boolean>(false);
  const [areObstaclesLocked, setAreObstaclesLocked] = useState<boolean>(true);
  const [isPropResizeLocked, setIsPropResizeLocked] = useState<boolean>(true);
  const [password, setPassword] = useState<string | undefined>();
  const [editEnabled, setEditEnabled] = useState<boolean>(true);
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    showPreviousSection: false,
    dancerDisplayType: "large",
  });
  const isDirty = useRef(false);
  const hasInitialized = useRef(false);

  const [history, dispatch] = useReducer(historyReducer,
    {
      undoStack: [],
      presentState: {state: setZOnAllPositions(props.currentChoreo), currentSectionId: props.currentChoreo.sections[0].id},
      redoStack: [],
    } as EditHistory<Choreo>);

  const currentStateRef = useRef(history.presentState.state);
  useEffect(() => {
    currentStateRef.current = history.presentState.state;
  }, [history.presentState.state]);

  // shared helper for the common "commit a new Choreo state" dispatch shape
  const commitState = useCallback((newState: Choreo, sectionId?: string) => {
    dispatch({
      type: "SET_STATE",
      newState,
      currentSectionId: sectionId ?? currentSection.id,
      commit: true,
    });
  }, [currentSection.id]);

  const debouncedSave = useMemo(
    () =>
      debounce(async () => {
        onSaveRef.current();
      }, 1000),
    []
  );

  const entityCount = useMemo(() => ({
    props: Object.keys(history.presentState.state.props).length,
    dancers: Object.keys(history.presentState.state.dancers).length,
    obstacles: history.presentState.state.obstacles ? Object.keys(history.presentState.state.obstacles).length : 0,
  } as StageEntities<number>), [history.presentState.state.dancers, history.presentState.state.props, history.presentState.state.obstacles]);

  const [personalNotes, setPersonalNotes] = useState<Record<string, string>>({});
  useEffect(() => {
    setPersonalNotes(getPersonalNotesForChoreo(history.presentState.state.id));
  }, [history.presentState.state.id]);

  const personalNote = useMemo(
    () => personalNotes[currentSection.id] ?? "",
    [personalNotes, currentSection.id]
  );

  const [dancerMovementCache, setDancerMovementCache] = useState<MovementCacheBySectionIdByObjectId>({});
  const [dancerAnimationCache, setDancerAnimationCache] = useState<PathSvgCacheByObjectIdBySectionId>({});
  const [propMovementCache, setPropMovementCache] = useState<MovementCacheBySectionIdByObjectId>({});
  const [propAnimationCache, setPropAnimationCache] = useState<PathSvgCacheByObjectIdBySectionId>({});

  useEffect(() => {
    const res = calculateMovementCache(history.presentState.state, true);
    setDancerMovementCache(res.newDancerMovementCache);
    setDancerAnimationCache(res.newDancerAnimationCache);
    setPropMovementCache(res.newPropMovementCache);
    setPropAnimationCache(res.newPropAnimationCache);
  }, [history.presentState.state.sections])

  useEffect(() => {
    hasInitialized.current = false;
  }, [props.currentChoreo]);

  useEffect(() => {
    if (hasInitialized.current) {
      isDirty.current = true;
      debouncedSave()
    } else {
      hasInitialized.current = true;
    }
  }, [history.presentState.state]);

  const currentChoreoDetails = useMemo(() =>
    {
      return {
        id: history.presentState.state.id,
        name: history.presentState.state.name,
        event: history.presentState.state.event,
        startDate: history.presentState.state.startDate,
        endDate: history.presentState.state.endDate,
        dancerCount: entityCount.dancers,
        propCount: entityCount.props,
        lastUpdated: history.presentState.state.lastUpdated,
        stageLength: history.presentState.state.stageGeometry.stageLength,
        stageWidth: history.presentState.state.stageGeometry.stageWidth,
        isDirty: history.presentState.state.isDirty,
      } as BasicChoreoDetails
    }
  , [history.presentState.state.name,
    history.presentState.state.event,
    history.presentState.state.startDate,
    history.presentState.state.endDate,
    history.presentState.state.dancers,
    history.presentState.state.props,
    history.presentState.state.lastUpdated,
    history.presentState.state.stageGeometry]);

  const prevSection = useMemo(() => {
    const sections = history.presentState.state.sections;
    const index = sections.findIndex(s => strEquals(s.id, currentSection.id));
    return index > 0 ? sections[index - 1] : undefined;
  }, [history.presentState.state.sections, currentSection.id]);

  const resetSelectedIds = useCallback(() => setSelectedIds({props: [], dancers: [], obstacles: []}), []);

  useEffect(() => {
    // assigning actions
    if (isAssigningActions && currentAction && currentTiming && currentTiming.dancerIds.length !== selectedIds.dancers.length) {
      commitState(assignDancersToTiming(history.presentState.state, currentSection.id, currentAction.id, currentTiming.id, selectedIds.dancers));
      setCurrentTiming({...currentTiming, dancerIds: selectedIds.dancers})
    }
  }, [selectedIds, history.presentState, currentSection, commitState]);

  useEffect(() => {
    // undo/redo timing
    if (currentAction && currentTiming) {
      const newTiming = currentSection.formation.dancerActions.find(x => strEquals(currentAction.id, x.id))?.timings.find(x => strEquals(currentTiming.id, x.id));
      if (newTiming && newTiming.dancerIds.length !== selectedIds.dancers.length) {
        setCurrentTiming(newTiming);
        setSelectedIds({dancers: [...newTiming.dancerIds], props: [], obstacles: []});
      }
    }
  }, [currentSection]);

  useEffect(() => {
    if ((selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) > 0) {
      if (isAddingDancers) setIsAddingDancers(false);
      if (isAddingProps) setIsAddingProps(false);
      if (isAddingObstacles) setIsAddingObstacles(false);
    }
    if (currentSection.formation.dancerActions.length === 0 && isAssigningActions) {
      setIsAssigningActions(false);
      setCurrentAction(undefined);
      setCurrentTiming(undefined);
      resetSelectedIds();
    };
  }, [selectedIds]);

  const selectedObjects = useMemo(() => {
    const dancers = Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]);
    const props = Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.props.includes(x[0])).map(x => x[1]);
    const obstacles = history.presentState.state.obstacles ? Object.entries(history.presentState.state.obstacles).filter(x => selectedIds.obstacles.includes(x[0])).map(x => x[1]) : [];

    return {
      dancers: dancers,
      props: props,
      obstacles: obstacles,
    } as StageEntities<PropPosition[], DancerPosition[], Obstacle[]>;
  }, [selectedIds, currentSection]);

  const firstSelectedDancerProp: SelectedEntity | undefined = useMemo(() => {
    if (selectedIds.obstacles.length > 0 || selectedIds.dancers.length > 1 || selectedIds.props.length > 1) return;

    if (selectedIds.dancers.length === 1 && selectedIds.props.length === 0) {
      return {id: selectedIds.dancers[0], type: "dancer"} as SelectedEntity;
    } else if (selectedIds.dancers.length === 0 && selectedIds.props.length === 1) {
      return {id: selectedIds.props[0], type: "prop"} as SelectedEntity;
    }
  }, [selectedIds.dancers, selectedIds.props]);

  const firstSelectedDancerPropMovement: Movement | undefined = useMemo(() => {
    if (!firstSelectedDancerProp) return;
    if (firstSelectedDancerProp.type === "dancer") {
      return currentSection.formation.dancerMovements?.[firstSelectedDancerProp.id];
    } else {
      return currentSection.formation.propMovements?.[firstSelectedDancerProp.id];
    }
  }, [firstSelectedDancerProp, currentSection]);

  const selectedColour = useMemo(() => {
    const colours = new Set([
      ...selectedObjects.dancers.map(x => x.color),
      ...Object.entries(history.presentState.state.props).filter(x => selectedIds.props.includes(x[0])).map(x => x[1].color),
      ...selectedObjects.obstacles.map(x => x.color)
    ]);

    return colours.size === 1 ? Array.from(colours)[0] : undefined;
  }, [selectedObjects]);

  const copyBuffer = useRef<StageEntities<Record<string, PropPosition>, Record<string, DancerPosition>>>({props: {}, dancers: {}, obstacles: {}});

  useEffect(() => {
    const newSection = history.presentState.state.sections.find(s => strEquals(s.id, history.presentState.currentSectionId));

    if (newSection === undefined) {
      setCurrentSection(history.presentState.state.sections[0]);
    } else {
      setCurrentSection(newSection);
    }
  }, [history.presentState]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      if (!ctrlOrCmd) return;

      // Ignore typing in inputs / textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key === "z") {
        // UNDO
        e.preventDefault();
        dispatch({ type: "UNDO" });
      } else if (e.key === "y") {
        // REDO
        e.preventDefault();
        dispatch({ type: "REDO" });
      } else if (e.key === "s") {
        // SAVE
        e.preventDefault();
        onSaveRef.current();
      } else if (e.key === "c") {
        // COPY
        e.preventDefault();
        onCopyRef.current();
      } else if (e.key === "v") {
        // PASTE
        e.preventDefault();
        onPasteRef.current();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dispatch]);

  const onSave = useCallback(() => {
    if (isDirty.current) {
      props.onChoreoEdited();
      saveChoreo(history.presentState.state, () => { isDirty.current = false }, true);
    }
  }, [history.presentState.state]);

  const onSaveAfterPublish = useCallback((newState: Choreo) => {
    saveChoreo(newState, () => {
      publishConfirmationDialog.close();
      setPublishConfirmationDialogOpen(false);
      setPublishSuccessDialogOpen(true);
    }, false, false);
  }, [history.presentState.state]);

  const onCopy = useCallback(() => {
    if ((selectedIds.dancers.length + selectedIds.props.length) === 0) {
      copyBuffer.current = ({props: {}, dancers: {}, obstacles: {}});
      return;
    }

    const copyRecordDancer: Record<string, DancerPosition> = {};
    const copyRecordProp: Record<string, PropPosition> = {};

    selectedIdsRef.current.dancers.forEach(id => {
      const dancerPosition = currentSection.formation.dancerPositions[id];
      if (dancerPosition) {
        copyRecordDancer[id] = dancerPosition;
      }
    });
    selectedIdsRef.current.props.forEach(id => {
      const propPosition = currentSection.formation.propPositions[id];
      if (propPosition) {
        copyRecordProp[id] = propPosition;
      }
    });

    copyBuffer.current = ({ props: copyRecordProp, dancers: copyRecordDancer, obstacles: {} });
  }, [
    selectedIds,
    currentSection.formation.dancerPositions,
  ]);

  const onPaste = useCallback(() => {
    commitState(pastePositions(
      history.presentState.state,
      currentSection.id,
      copyBuffer.current
    ));
  }, [
    commitState,
    history.presentState.state,
    currentSection.id,
    copyBuffer,
  ]);

  const onSaveRef = useRef(onSave);
  const onSaveAfterPublishRef = useRef(onSaveAfterPublish);
  const onCopyRef = useRef(onCopy);
  const onPasteRef = useRef(onPaste);
  const selectedIdsRef = useRef(selectedIds);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  useEffect(() => {
    onCopyRef.current = onCopy;
  }, [onCopy]);

  useEffect(() => {
    onPasteRef.current = onPaste;
  }, [onPaste]);

  useEffect(() => {
    selectedIdsRef.current = selectedIds;
  }, [selectedIds]);

  // dialogs
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
  const [editChoreoInfoDialogOpen, setEditChoreoInfoDialogOpen] = useState(false);
  const [sectionManagerDialogOpen, setSectionManagerDialogOpen] = useState(false);
  const [renameDancerDialogOpen, setRenameDancerDialogOpen] = useState(false);
  const [renamePropDialogOpen, setRenamePropDialogOpen] = useState(false);
  const [renameObstacleDialogOpen, setRenameObstacleDialogOpen] = useState(false);
  const [editDancerColourDialogOpen, setEditDancerColourDialogOpen] = useState(false);
  const [editDancerActionsDialogOpen, setEditDancerActionsDialogOpen] = useState(false);
  const [dancerManagerDialogOpen, setDancerManagerDialogOpen] = useState(false);
  const [propManagerDialogOpen, setPropManagerDialogOpen] = useState(false);
  const [propSizeDialogOpen, setPropSizeDialogOpen] = useState(false);
  const [renameSectionDialogOpen, setRenameSectionDialogOpen] = useState(false);
  const [addNoteToSectionDialogOpen, setAddNoteToSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [dancerWarningDialogOpen, setDancerWarningDialogOpen] = useState(false);
  const [publishConfirmationDialogOpen, setPublishConfirmationDialogOpen] = useState(false);
  const [publishSuccessDialogOpen, setPublishSuccessDialogOpen] = useState(false);

  const handleRenameSectionDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenameSectionDialogOpen(isOpen);
  };

  const handleAddNoteToSectionDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setAddNoteToSectionDialogOpen(isOpen);
  };

  const handleDeleteSectionDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDeleteSectionDialogOpen(isOpen);
  };

  const handleResizeDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setResizeDialogOpen(isOpen);
  };

  const handleEditChoreoInfoDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditChoreoInfoDialogOpen(isOpen);
  };

  const handleSectionManagerDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setSectionManagerDialogOpen(isOpen);
  };

  const handleRenameDancerDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenameDancerDialogOpen(isOpen);
  };

  const handleRenamePropDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenamePropDialogOpen(isOpen);
  };

  const handleRenameObstacleDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenameObstacleDialogOpen(isOpen);
  };

  const handleEditDancerColourDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditDancerColourDialogOpen(isOpen);
  };

  const handleEditDancerActionsDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditDancerActionsDialogOpen(isOpen);
  };

  const handleDancerManagerDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDancerManagerDialogOpen(isOpen);
  };

  const handlePropManagerDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPropManagerDialogOpen(isOpen);
  };

  const handlePropSizeDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPropSizeDialogOpen(isOpen);
  };

  const handleDancerWarningDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDancerWarningDialogOpen(isOpen);
  };

  const handlePublishConfirmationDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPublishConfirmationDialogOpen(isOpen);
  };

  const handlePublishSuccessDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setPublishSuccessDialogOpen(isOpen);
  };

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const handleExportDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setExportDialogOpen(isOpen);
  };

  const onSwapPositions = useCallback(() => {
    if (selectedIds.dancers[0] && selectedIds.dancers[1]) {
      commitState(swapDancerPositions(history.presentState.state, currentSection.id, selectedIds.dancers[0], selectedIds.dancers[1]));
    } else if (selectedIds.props[0] && selectedIds.props[1]) {
      commitState(swapPropPositions(history.presentState.state, currentSection.id, selectedIds.props[0], selectedIds.props[1]));
    }
  }, [commitState, selectedIds, history.presentState.state, currentSection.id]);

  const [movementUpdateGroup, setMovementUpdateGroup] = useState<StageEntities<Record<string, Coordinates>>>({props: {}, dancers: {}, obstacles: {}});

  useEffect(() => {
    if (
      Object.keys(movementUpdateGroup.dancers).length === 0 &&
      Object.keys(movementUpdateGroup.props).length === 0 &&
      Object.keys(movementUpdateGroup.obstacles).length === 0
    ) return;

    if (
      (selectedIds.dancers.length > 0 && selectedIds.dancers.some(id => !movementUpdateGroup.dancers[id])) ||
      (selectedIds.props.length > 0 && selectedIds.props.some(id => !movementUpdateGroup.props[id])) ||
      (selectedIds.obstacles.length > 0 && selectedIds.obstacles.some(id => !movementUpdateGroup.obstacles[id]))
    ) return;

    commitState(moveObjectPositions(history.presentState.state, currentSection.id, movementUpdateGroup));
    setMovementUpdateGroup({props: {}, dancers: {}, obstacles: {}});
  }, [movementUpdateGroup]);

  const missingNames = useMemo(() => {
    const pool = new Set(Object.entries(props.dancerNamesByEvent[stringifyEvent(history.presentState.state)] ?? {})
      .filter(([id]) => id !== history.presentState.state.id)
      .flatMap(([, names]) => names));
    const currentNames = new Set(Object.values(history.presentState.state.dancers).map(x => x.name));
    return Array.from(new Set(pool).difference(currentNames)).sort();
  }, [props.dancerNamesByEvent, history.presentState.state.dancers, history.presentState.state.event, history.presentState.state.startDate, history.presentState.state.endDate]);

  const editMovement = useCallback((points: Coordinates[], tension: MovementType) => {
    if (!firstSelectedDancerProp) return;
    if (firstSelectedDancerProp.type === "dancer") {
      commitState(editDancerPath(
        history.presentState.state,
        currentSection.id,
        firstSelectedDancerProp.id,
        {
          points: points,
          tension: tension
        },
      ));
    } else {
      commitState(editPropPath(
        history.presentState.state,
        currentSection.id,
        firstSelectedDancerProp.id,
        {
          points: points,
          tension: tension
        },
      ));
    }
  }, [commitState, firstSelectedDancerProp, history.presentState.state, currentSection.id]);

  const toggleCurved = useCallback(() => {
    if (!firstSelectedDancerProp) return;
    let points: Coordinates[] = [];
    let tension: MovementType = "curved";
    if (firstSelectedDancerProp.type === "dancer") {
      points = currentSection.formation.dancerMovements?.[firstSelectedDancerProp.id]?.points ?? [];
      tension = currentSection.formation.dancerMovements?.[firstSelectedDancerProp.id]?.tension === "straight" ? "curved" : "straight";
    } else {
      points = currentSection.formation.propMovements?.[firstSelectedDancerProp.id]?.points ?? [];
      tension = currentSection.formation.propMovements?.[firstSelectedDancerProp.id]?.tension === "straight" ? "curved" : "straight";
    }
    editMovement(points, tension);
  }, [firstSelectedDancerProp, currentSection, editMovement]);

  const togglePointCount = useCallback(() => {
    if (!firstSelectedDancerProp) return;
    let tension: MovementType = "curved";
    if (firstSelectedDancerProp.type === "dancer") {
      tension = currentSection.formation.dancerMovements?.[firstSelectedDancerProp.id]?.tension ?? "curved";
    } else {
      tension = currentSection.formation.propMovements?.[firstSelectedDancerProp.id]?.tension ?? "curved";
    }
    let pointCount = firstSelectedDancerPropMovement?.points.length ?? 1;
    if (pointCount === 0) pointCount = 1;
    let newPoints = [] as Coordinates[];
    if (prevSection && pointCount < 3) {
      const prev = firstSelectedDancerProp.type === "dancer" ?
        prevSection.formation.dancerPositions[firstSelectedDancerProp.id] :
        cornerToCentreFromProp(prevSection.formation.propPositions[firstSelectedDancerProp.id], history.presentState.state.props[firstSelectedDancerProp.id], history.presentState.state.stageGeometry.yAxis);
      const curr = firstSelectedDancerProp.type === "dancer" ?
        currentSection.formation.dancerPositions[firstSelectedDancerProp.id] :
        cornerToCentreFromProp(currentSection.formation.propPositions[firstSelectedDancerProp.id], history.presentState.state.props[firstSelectedDancerProp.id], history.presentState.state.stageGeometry.yAxis);
      for (let i = 1; i <= pointCount + 1; i++) {
        const frac = i / (pointCount + 2);
        newPoints.push({
          x: prev.x + (curr.x - prev.x) * frac,
          y: prev.y + (curr.y - prev.y) * frac
        });
      }
    }
    editMovement(newPoints, tension);
  }, [firstSelectedDancerProp, firstSelectedDancerPropMovement, currentSection, prevSection, history.presentState.state, editMovement]);

  const resetPath = useCallback(() => {
    if(!firstSelectedDancerProp) return;
    let tension: MovementType = "curved";
    editMovement([], tension);
  }, [firstSelectedDancerProp, editMovement]);

  // ---- Header handlers ----
  const openEditChoreoInfoDialog = useCallback(() => setEditChoreoInfoDialogOpen(true), []);
  const openResizeDialog = useCallback(() => setResizeDialogOpen(true), []);
  const openExportDialog = useCallback(() => setExportDialogOpen(true), []);
  const openDancerManagerDialog = useCallback(() => setDancerManagerDialogOpen(true), []);
  const openPropManagerDialog = useCallback(() => setPropManagerDialogOpen(true), []);
  const openDancerWarningDialog = useCallback(() => setDancerWarningDialogOpen(true), []);

  const toggleShowGrid = useCallback(() => {
    setAppSettings(prev => ({...prev, showGrid: !prev.showGrid}));
  }, []);
  const toggleShowPrevious = useCallback(() => {
    setAppSettings(prev => ({...prev, showPreviousSection: !prev.showPreviousSection}));
  }, []);
  const toggleSnap = useCallback(() => {
    setAppSettings(prev => ({...prev, snapToGrid: !prev.snapToGrid}));
  }, []);
  const changeDancerSize = useCallback((showLarge: boolean) => {
    setAppSettings(prev => ({...prev, dancerDisplayType: showLarge ? "large" : "small"}));
  }, []);

  const goToView = useCallback(() => {
    props.goToViewPage(history.presentState.state);
  }, [props.goToViewPage, history.presentState.state]);

  const onExportChoreo = useCallback(() => {
    exportChoreo(history.presentState.state);
  }, [history.presentState.state]);

  const onPublish = useCallback(() => {
    if (props.teamId) {
      if (props.currentChoreoStatus === "localOnly") {
        setPublishConfirmationDialogOpen(true);
      } else {
        getChoreoPassword(props.teamId, props.currentChoreo.id, (svrPassword) => {
          setPublishConfirmationDialogOpen(true);
          setPassword(svrPassword);
        }, () => {}); // todo: on failure
      }
    }
  }, [props.teamId, props.currentChoreoStatus, props.currentChoreo.id]);

  // ---- MainStage handlers ----
  const updateDancerPosition = useCallback((x: number, y: number, dancerId: string) => {
    setMovementUpdateGroup(prev => ({...prev, dancers: {...prev.dancers, [dancerId]: {x, y}}}));
  }, []);

  const updatePropPosition = useCallback((x: number, y: number, propId: string) => {
    setMovementUpdateGroup(prev => ({...prev, props: {...prev.props, [propId]: {x, y}}}));
  }, []);

  const onUpdatePropSizeAndRotate = useCallback((width: number, length: number, rotation: number, x: number, y: number, propId: string) => {
    commitState(updatePropSizeAndRotate(history.presentState.state, currentSection.id, width, length, rotation, x, y, propId));
  }, [commitState, history.presentState.state, currentSection.id]);

  const updateObstaclePosition = useCallback((x: number, y: number, itemId: string) => {
    setMovementUpdateGroup(prev => ({...prev, obstacles: {...prev.obstacles, [itemId]: {x, y}}}));
  }, []);

  const onUpdateObstacleSizeAndRotate = useCallback((width: number, length: number, rotation: number, x: number, y: number, itemId: string) => {
    commitState(updateObstacleSizeAndRotate(history.presentState.state, width, length, rotation, x, y, itemId));
  }, [commitState, history.presentState.state]);

  const onCreateDancer = useCallback((x: number, y: number) => {
    commitState(addDancer(
      history.presentState.state,
      {
        id: crypto.randomUUID(),
        name: (entityCount.dancers + 1).toString()
      },
      x,
      y,
      entityCount.dancers
    ));
  }, [commitState, history.presentState.state, entityCount.dancers]);

  const onCreateProp = useCallback((x: number, y: number) => {
    commitState(addProp(
      history.presentState.state,
      {
        id: crypto.randomUUID(),
        name: (entityCount.props + 1).toString(),
        length: DEFAULT_PROP_LENGTH,
        width: DEFAULT_PROP_WIDTH,
        color: colorPalette.rainbow.blue[0],
      },
      x - 2,
      y - 0.5,
      entityCount.props
    ));
  }, [commitState, history.presentState.state, entityCount.props]);

  const onCreateObstacle = useCallback((x: number, y: number) => {
    commitState(addObstacle(
      history.presentState.state,
      {
        id: crypto.randomUUID(),
        name: (entityCount.obstacles + 1).toString(),
        length: DEFAULT_PROP_LENGTH,
        width: DEFAULT_PROP_WIDTH,
        color: colorPalette.greys[2],
        x: x - 2,
        y: y - 0.5,
        z: entityCount.obstacles + 1,
        rotation: 0,
        type: "obstacle",
        sectionId: "",
      },
    ));
  }, [commitState, history.presentState.state, entityCount.obstacles]);

  const toggleEditEnabled = useCallback(() => setEditEnabled(prev => !prev), []);

  const openNoteDialog = useCallback(() => {
    resetSelectedIds();
    setAddNoteToSectionDialogOpen(true);
  }, [resetSelectedIds]);

  const onMidpointEdit = useCallback((newMovement: Movement) => {
    editMovement(newMovement.points, newMovement.tension);
  }, [editMovement]);

  // ---- Toolbar handlers ----
  const onAddDancerToggle = useCallback(() => {
    resetSelectedIds();
    setIsAddingDancers(prev => !prev);
  }, [resetSelectedIds]);

  const onAddPropToggle = useCallback(() => {
    resetSelectedIds();
    setIsAddingProps(prev => !prev);
    setIsPropResizeLocked(false);
  }, [resetSelectedIds]);

  const onAddObstacleToggle = useCallback(() => {
    resetSelectedIds();
    setIsAddingObstacles(prev => !prev);
    setAreObstaclesLocked(false);
  }, [resetSelectedIds]);

  const onToggleInUse = useCallback(() => {
    const newIsInUse = !selectedObjects.props.every(x => x.inUse === true);
    commitState(changePropInUse(history.presentState.state, currentSection.id, selectedIds.props, newIsInUse));
  }, [commitState, selectedObjects.props, history.presentState.state, currentSection.id, selectedIds.props]);

  const openEditDancerColourDialog = useCallback(() => setEditDancerColourDialogOpen(true), []);

  const onSelectColor = useCallback(() => {
    const dancerPositions = Object.entries(currentSection.formation.dancerPositions);
    const dancerColours = new Set(dancerPositions.filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1].color));
    const newDancerIds = dancerPositions.filter(x => dancerColours.has(x[1].color)).map(x => x[0]);

    const propEntries = Object.entries(history.presentState.state.props);
    const propColours = new Set(propEntries.filter(x => selectedIds.props.includes(x[0])).map(x => x[1].color));
    const newPropIds = propEntries.filter(x => propColours.has(x[1].color)).map(x => x[0]);

    const obstacleEntries = Object.entries(history.presentState.state.obstacles ?? {});
    const obstacleColours = new Set(obstacleEntries.filter(x => selectedIds.obstacles.includes(x[0])).map(x => x[1].color));
    const newObstacleIds = obstacleEntries.filter(x => obstacleColours.has(x[1].color)).map(x => x[0]);

    setSelectedIds({ dancers: newDancerIds, props: newPropIds, obstacles: newObstacleIds });
  }, [currentSection.formation.dancerPositions, selectedIds, history.presentState.state.props, history.presentState.state.obstacles]);

  const onSelectName = useCallback(() => {
    const dancerPositions = Object.entries(currentSection.formation.dancerPositions);
    const dancerNames = new Set(dancerPositions.filter(x => selectedIds.dancers.includes(x[0])).map(x => history.presentState.state.dancers[x[0]]?.name));
    const newDancerIds = dancerPositions.filter(x => dancerNames.has(history.presentState.state.dancers[x[0]]?.name)).map(x => x[0]);

    const propEntries = Object.entries(history.presentState.state.props);
    const propNames = new Set(propEntries.filter(x => selectedIds.props.includes(x[0])).map(x => x[1].name));
    const newPropIds = propEntries.filter(x => propNames.has(x[1].name)).map(x => x[0]);

    const obstacleEntries = Object.entries(history.presentState.state.obstacles ?? {});
    const obstacleNames = new Set(obstacleEntries.filter(x => selectedIds.obstacles.includes(x[0])).map(x => x[1].name));
    const newObstacleIds = obstacleEntries.filter(x => obstacleNames.has(x[1].name)).map(x => x[0]);

    setSelectedIds({ dancers: newDancerIds, props: newPropIds, obstacles: newObstacleIds });
  }, [currentSection.formation.dancerPositions, selectedIds, history.presentState.state.dancers, history.presentState.state.props, history.presentState.state.obstacles]);

  const onSelectType = useCallback((selectDancers: boolean, selectProps: boolean, selectObstacles: boolean) => {
    setSelectedIds({
      props: selectProps ? Object.keys(history.presentState.state.props) : [],
      dancers: selectDancers ? Object.keys(history.presentState.state.dancers) : [],
      obstacles: (selectObstacles && !areObstaclesLocked) ? Object.keys(history.presentState.state.obstacles ?? {}) : []
    });
  }, [history.presentState.state.props, history.presentState.state.dancers, history.presentState.state.obstacles, areObstaclesLocked]);

  const onRearrange = useCallback((rearrangement: Rearrangement) => {
    commitState(rearrangePositions(history.presentState.state, currentSection.id, selectedIds, rearrangement));
  }, [commitState, history.presentState.state, currentSection.id, selectedIds]);

  const onDistribute = useCallback((distribution: Distribution) => {
    commitState(distributePositions(history.presentState.state, currentSection.id, selectedObjects, distribution));
  }, [commitState, history.presentState.state, currentSection.id, selectedObjects]);

  const onHorizontalAlign = useCallback((alignment: HorizontalAlignment) => {
    commitState(alignHorizontalPositions(history.presentState.state, currentSection.id, selectedObjects, alignment));
  }, [commitState, history.presentState.state, currentSection.id, selectedObjects]);

  const onVerticalAlign = useCallback((alignment: VerticalAlignment) => {
    commitState(alignVerticalPositions(history.presentState.state, currentSection.id, selectedObjects, alignment));
  }, [commitState, history.presentState.state, currentSection.id, selectedObjects]);

  const onDeleteObjects = useCallback(() => {
    commitState(removeObjects(history.presentState.state, selectedIds));
    resetSelectedIds();
  }, [commitState, history.presentState.state, selectedIds, resetSelectedIds]);

  const openEditDancerActionsDialog = useCallback(() => setEditDancerActionsDialogOpen(true), []);

  const onAssignActions = useCallback(() => {
    resetSelectedIds();
    setCurrentAction(undefined);
    setCurrentTiming(undefined);
    setIsAssigningActions(prev => !prev);
  }, [resetSelectedIds]);

  const openRenameDancerDialog = useCallback(() => setRenameDancerDialogOpen(true), []);
  const openRenamePropDialog = useCallback(() => setRenamePropDialogOpen(true), []);
  const openRenameObstacleDialog = useCallback(() => setRenameObstacleDialogOpen(true), []);

  const onDuplicateObstacle = useCallback(() => {
    const newObstacles = selectedObjects.obstacles.map(o => ({
      ...o,
      id: crypto.randomUUID(),
      x: o.x + 0.5,
      y: o.y + (history.presentState.state.stageGeometry.yAxis === "bottom-up" ? -0.5 : +0.5)
    }));
    const newIds = newObstacles.map(o => o.id);
    commitState(addObstacles(
      history.presentState.state,
      newObstacles,
    ));
    setSelectedIds({props: [], dancers: [], obstacles: newIds});
  }, [commitState, selectedObjects.obstacles, history.presentState.state]);

  const onDuplicateProp = useCallback(() => {
    const idMap = Object.fromEntries(selectedIds.props.map(id => [id, crypto.randomUUID()]));
    commitState(duplicateProps(history.presentState.state, idMap));
    setSelectedIds({props: Object.values(idMap), dancers: [], obstacles: []});
  }, [commitState, selectedIds.props, history.presentState.state]);

  const onToggleObstacleLock = useCallback(() => setAreObstaclesLocked(prev => !prev), []);
  const onToggleResizePropsLock = useCallback(() => setIsPropResizeLocked(prev => !prev), []);
  const openPropSizeDialog = useCallback(() => setPropSizeDialogOpen(true), []);
  const toggleShowPaths = useCallback(() => setShowPaths(prev => !prev), []);

  const onEditMovement = useCallback(() => {
    if (selectedIds.dancers.length > 1 ||
        selectedIds.obstacles.length > 0 ||
        selectedIds.props.length > 1 ||
        selectedIds.dancers.length + selectedIds.props.length > 1) {
      resetSelectedIds();
    }
    setIsEditingMovement(prev => !prev);
    setIsPropResizeLocked(true);
  }, [selectedIds, resetSelectedIds]);

  return (
    <div className='flex flex-col justify-between w-screen h-[100svh] max-h-[100svh]'>
      <Header
        returnHome={props.goToHomePage}
        hasSidebar
        currentChoreo={history.presentState.state}
        onSave={onSave}
        editName={openEditChoreoInfoDialog}
        editSize={openResizeDialog}
        onDownload={openExportDialog}
        showManageDancers={entityCount.dancers > 0}
        manageDancers={openDancerManagerDialog}
        showManageProps={entityCount.props > 0}
        manageProps={openPropManagerDialog}
        manageSections={manageSectionsTodo}
        exportChoreo={onExportChoreo}
        changeShowGrid={toggleShowGrid}
        changeShowPrevious={toggleShowPrevious}
        changeSnap={toggleSnap}
        changeDancerSize={changeDancerSize}
        appSettings={appSettings}
        goToView={goToView}
        showDancerWarningMessage={missingNames.length > 0 ? openDancerWarningDialog : undefined}
        dancerCount={entityCount.dancers}
        propCount={entityCount.props}
        stageWidth={history.presentState.state.stageGeometry.stageWidth}
        stageLength={history.presentState.state.stageGeometry.stageLength}
        version={props.currentChoreo.version}
        choreoStatus={props.currentChoreoStatus}
        showPublish={
          process.env.NODE_ENV === "development" ||
          (
            props.isLoggedIn &&
            !props.isViewer &&
            !strEquals(history.presentState.state.id, SAMPLE_PARADE_ID) &&
            !strEquals(history.presentState.state.id, SAMPLE_STAGE_ID) &&
            !isNullOrUndefinedOrBlank(props.teamId)
          )
        }
        publish={onPublish}
        />
      <div className="relative flex-1">
        <MainStage
          canEdit={!isAssigningActions}
          canSelectDancers={!isAssigningActions || currentTiming !== undefined}
          canSelectProps={!isAssigningActions}
          canSelectObstacles={!isAssigningActions && !areObstaclesLocked && !isEditingMovement}
          canToggleSelection={!isEditingMovement}
          appSettings={appSettings}
          isAddingDancer={isAddingDancers}
          isAddingProp={isAddingProps}
          isAddingObstacles={isAddingObstacles}
          canResizeProps={!isPropResizeLocked}
          hideTransformerBorder={isAssigningActions}
          currentChoreo={history.presentState.state}
          currentSection={currentSection}
          updateDancerPosition={updateDancerPosition}
          updatePropPosition={updatePropPosition}
          updatePropSizeAndRotate={onUpdatePropSizeAndRotate}
          updateObstaclePosition={updateObstaclePosition}
          updateObstacleSizeAndRotate={onUpdateObstacleSizeAndRotate}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          selectedObjects={selectedObjects}
          previousSection={prevSection}
          addDancer={onCreateDancer}
          addProp={onCreateProp}
          addObstacle={onCreateObstacle}
          editEnabled={editEnabled}
          toggleEditEnabled={toggleEditEnabled}
          openNoteDialog={openNoteDialog}
          showPaths={showPaths}
          isEditingMovement={isEditingMovement}
          dancerMovementCache={dancerMovementCache}
          dancerAnimationCache={dancerAnimationCache}
          propMovementCache={propMovementCache}
          propAnimationCache={propAnimationCache}
          currentMovement={firstSelectedDancerPropMovement}
          onMidpointEdit={onMidpointEdit}
        />
        <div className="absolute bottom-0 flex flex-col">
          <div className="absolute bottom-10">
            <UndoRedoToolbar
              undo={() => {dispatch({type: "UNDO"})}}
              redo={() => {dispatch({type: "REDO"})}}
              undoCount={history.undoStack.length}
              redoCount={history.redoStack.length}
            />
          </div>
          <div className="absolute bottom-0 w-screen">
            {
              !isAssigningActions &&
              <FormationSelectionToolbar
                currentSectionId={currentSection.id}
                sections={history.presentState.state.sections}
                showAddButton
                onClickAddButton={(id: string) => {
                  commitState(addSection(history.presentState.state, id), id);
                }}
                onChangeSection={(section) => {
                  setCurrentSection(section);
                }}
                onOpenSectionMenu={() => {
                  setSectionManagerDialogOpen(true);
                }}
                onReorder={(sections) => {
                  commitState(reorderSections(history.presentState.state, sections));
                }}
              />
            }
            {
              isAssigningActions &&
              <ActionSelectionToolbar
                actions={currentSection.formation.dancerActions}
                onSelectTiming={(action, timing) => {
                  setCurrentAction(action);
                  setCurrentTiming(timing);
                  if (timing) setSelectedIds({props: [], dancers: timing.dancerIds, obstacles: []});
                  else resetSelectedIds();
                }}
                selectedTimingId={currentTiming?.id}
                />
            }
          </div>
        </div>
      </div>
      <Toolbar
        isEnabled={editEnabled}
        onAddDancer={onAddDancerToggle}
        isAddingDancer={isAddingDancers}
        onAddProp={onAddPropToggle}
        isAddingProp={isAddingProps}
        onAddObstacle={onAddObstacleToggle}
        isAddingObstacle={isAddingObstacles}
        showInUse={selectedIds.props.length > 0 && selectedIds.dancers.length === 0 && selectedIds.obstacles.length === 0}
        isInUse={selectedObjects.props.every(x => x.inUse === true)}
        onToggleInUse={onToggleInUse}
        showChangeColour={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        onChangeColor={openEditDancerColourDialog}
        showCopyPosition={selectedIds.dancers.length > 0 || selectedIds.props.length > 0}
        onCopyPosition={onCopy}
        showPastePosition={Object.keys(copyBuffer.current.dancers).length > 0 || Object.keys(copyBuffer.current.props).length > 0}
        onPastePosition={onPaste}
        showSelectColour={(selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) > 0}
        onSelectColor={onSelectColor}
        showSelectName={(selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) > 0}
        onSelectName={onSelectName}
        onSelectType={onSelectType}
        showSelectDancersButton={entityCount.dancers > 0 && entityCount.dancers > selectedIds.dancers.length}
        showSelectPropsButton={entityCount.props > 0 && entityCount.props > selectedIds.props.length}
        showSelectObstaclesButton={!areObstaclesLocked && entityCount.obstacles > 0 && entityCount.obstacles > selectedIds.obstacles.length}
        showSelectAllButton={entityCount.dancers > selectedIds.dancers.length || entityCount.props > selectedIds.props.length || (!areObstaclesLocked && entityCount.obstacles > selectedIds.obstacles.length)}
        onDeselect={resetSelectedIds}
        onRearrange={onRearrange}
        showDistribute={(selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) >= 3}
        onDistribute={onDistribute}
        onHorizontalAlign={onHorizontalAlign}
        onVerticalAlign={onVerticalAlign}
        showArrange={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        showSwapPosition={
          ((selectedIds.dancers.length === 2 && selectedIds.props.length === 0) ||
          (selectedIds.dancers.length === 0 && selectedIds.props.length === 2)) &&
          selectedIds.obstacles.length === 0
        }
        onSwapPosition={onSwapPositions}
        showDeleteObjects={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        onDeleteObjects={onDeleteObjects}
        onOpenActionManager={openEditDancerActionsDialog}
        onAssignActions={onAssignActions}
        isAssigningActionsEnabled={currentSection.formation.dancerActions.length > 0}
        isAssigningActions={isAssigningActions}
        onRenameDancer={openRenameDancerDialog}
        showRenameDancer={selectedIds.dancers.length === 1 && (selectedIds.props.length + selectedIds.obstacles.length) === 0}
        onRenameProp={openRenamePropDialog}
        showRenameProp={selectedIds.props.length === 1 && (selectedIds.dancers.length + selectedIds.obstacles.length === 0)}
        onRenameObstacle={openRenameObstacleDialog}
        showRenameObstacle={selectedIds.obstacles.length === 1 && (selectedIds.dancers.length + selectedIds.props.length === 0)}
        showDuplicateObstacle={selectedIds.obstacles.length > 0 && selectedIds.dancers.length === 0 && selectedIds.props.length === 0}
        onDuplicateObstacle={onDuplicateObstacle}
        showDuplicateProp={selectedIds.props.length > 0 && selectedIds.dancers.length === 0 && selectedIds.obstacles.length === 0}
        onDuplicateProp={onDuplicateProp}
        showLockObstacle={entityCount.obstacles > 0}
        areObstaclesLocked={areObstaclesLocked}
        onToggleObstacleLock={onToggleObstacleLock}
        onToggleResizePropsLock={onToggleResizePropsLock}
        isResizePropsLocked={isPropResizeLocked}
        showLockResizeProps={entityCount.props > 0}
        onEditPropSize={openPropSizeDialog}
        showEditPropSize={selectedIds.props.length >= 1 && (selectedIds.dancers.length + selectedIds.obstacles.length) === 0}
        showMovementFunctions={(entityCount.dancers + entityCount.props) > 0}
        showPaths={showPaths}
        toggleShowPaths={toggleShowPaths}
        onEditMovement={onEditMovement}
        isEditingMovement={isEditingMovement}
        setIsEditingMovement={setIsEditingMovement}
        canEditMovement={(selectedIds.dancers.length | selectedIds.props.length) === 1 && currentSection.id !== history.presentState.state.sections[0].id}
        curved={firstSelectedDancerPropMovement?.tension !== "straight"}
        toggleCurved={toggleCurved}
        pointCount={firstSelectedDancerPropMovement?.points.length ?? 1}
        togglePointCount={togglePointCount}
        onResetPath={resetPath}
      />
      {
        isAddingDancers &&
        <InstructionMessage
          instruction={<>グリッドを押して<b>ダンサー</b>を追加する</>}
          onClose={() => setIsAddingDancers(false)}
        />
      }
      {
        isAddingProps &&
        <InstructionMessage
          instruction={<>グリッドを押して<b>道具</b>を追加する</>}
          onClose={() => setIsAddingProps(false)}
        />
      }
      {
        isAddingObstacles &&
        <InstructionMessage
          instruction={<>グリッドを押して<b>障害物</b>を追加する</>}
          onClose={() => setIsAddingObstacles(false)}
        />
      }
      {
        isAssigningActions &&
        <InstructionMessage
          instruction={
            <>
              { currentAction && currentTiming && <><b>「{currentAction.name} - {currentTiming.name}」</b>に入るダンサーをタップ</> }
              { (currentAction === undefined || currentTiming === undefined) && "カウントを選択してください" }
            </>
          }
          onClose={() => {
            resetSelectedIds();
            setCurrentAction(undefined);
            setCurrentTiming(undefined);
            if (currentAction === undefined || currentTiming === undefined) {
              setIsAssigningActions(false);
            }
          }}
        />
      }
      <Dialog.Root
        handle={resizeDialog}
        open={resizeDialogOpen}
        onOpenChange={handleResizeDialogOpen}>
        <EditChoreoSizeDialog
          currentChoreo={history.presentState.state}
          onSave={(geometry, stageType) => {
            commitState(changeStageGeometryAndType(history.presentState.state, geometry, stageType));
            resizeDialog.close();
            setResizeDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={editChoreoInfoDialog}
        open={editChoreoInfoDialogOpen}
        onOpenChange={handleEditChoreoInfoDialogOpen}>
        <EditChoreoInfoDialog
          choreo={getBasicChoreoDetails(history.presentState.state)}
          eventList={props.eventList}
          onSubmit={(name, event, startDate, endDate) => {
            commitState(renameChoreo(history.presentState.state, name, event, startDate, endDate));
            editChoreoInfoDialog.close();
            setEditChoreoInfoDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={sectionManagerDialog}
        open={sectionManagerDialogOpen}
        onOpenChange={handleSectionManagerDialogOpen}>
        <CustomDialog
          title={`${currentSection.name}管理`}
          hasX>
          <div className="flex flex-col gap-2">
            <Dialog.Close>
              <IconLabelButton
                icon="textFieldsAlt"
                label="名前変更"
                asDiv
                onClick={() => {
                  resetSelectedIds();
                  setRenameSectionDialogOpen(true);
                }}
                full />
            </Dialog.Close>

            <Dialog.Close>
              <IconLabelButton
                icon="speakerNotes"
                label="メモ編集"
                asDiv
                onClick={() => {
                  resetSelectedIds();
                  setAddNoteToSectionDialogOpen(true);
                }}
                full />
            </Dialog.Close>

            <Dialog.Close>
              <IconLabelButton
                icon="fileCopy"
                label="複製"
                asDiv
                onClick={() => {
                  resetSelectedIds();
                  commitState(duplicateSection(history.presentState.state, currentSection, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id))));
                }}
                full />
            </Dialog.Close>

            {
              history.presentState.state.sections.length > 1 &&
              <Dialog.Close>
                <IconLabelButton
                  icon="delete"
                  label="削除"
                  asDiv
                  primaryText
                  onClick={() => {
                    resetSelectedIds();
                    setDeleteSectionDialogOpen(true)
                  }}
                  full />
              </Dialog.Close>
            }
          </div>
        </CustomDialog>
      </Dialog.Root>
      <Dialog.Root
        handle={renameDancerDialog}
        open={renameDancerDialogOpen}
        onOpenChange={handleRenameDancerDialogOpen}>
        <EditDancerNameDialog
          name={history.presentState.state.dancers[firstSelectedDancerProp?.id ?? ""]?.name}
          otherNames={Object.values(history.presentState.state.dancers).map(x => x.name)}
          missingNames={missingNames}
          onSubmit={(name) => {
            commitState(renameDancer(history.presentState.state, firstSelectedDancerProp!.id, name));
            renameDancerDialog.close();
            setRenameDancerDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={editDancerColourDialog}
        open={editDancerColourDialogOpen}
        onOpenChange={handleEditDancerColourDialogOpen}>
        <EditDancerColourDialog
          selectedObjectColour={selectedColour}
          propOnly={selectedIds.dancers.length === 0 && (selectedIds.props.length + selectedIds.obstacles.length) > 0}
          onSubmit={(color, mode) => {
            if (!isNullOrUndefinedOrBlank(color)) {
              commitState(changeObjectColours(history.presentState.state, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id)), mode, selectedIds, color));
            }
            editDancerColourDialog.close();
            setEditDancerColourDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={editDancerActionsDialog}
        open={editDancerActionsDialogOpen}
        onOpenChange={handleEditDancerActionsDialogOpen}>
        <ActionManagerDialog
          section={currentSection}
          onSubmit={(actions) => {
            commitState(editDancerActions(history.presentState.state, currentSection.id, actions));
            editDancerActionsDialog.close();
            setEditDancerActionsDialogOpen(false);
          }}
          />
      </Dialog.Root>
      <Dialog.Root
        handle={dancerManagerDialog}
        open={dancerManagerDialogOpen}
        onOpenChange={handleDancerManagerDialogOpen}>
        <DancerManagerDialog
          dancers={history.presentState.state.dancers}
          onSubmit={(dancers, deletedDancerIds) => {
            commitState(renameAndDeleteDancers(history.presentState.state, indexByKey(dancers, "id"), new Set(deletedDancerIds)));
            dancerManagerDialog.close();
            setDancerManagerDialogOpen(false);
          }}
          />
      </Dialog.Root>
      <Dialog.Root
        handle={propManagerDialog}
        open={propManagerDialogOpen}
        onOpenChange={handlePropManagerDialogOpen}>
        <PropManagerDialog
          props={history.presentState.state.props}
          onSubmit={(props, deletedPropIds) => {
            commitState(editAndDeleteProps(history.presentState.state, indexByKey(props, "id"), new Set(deletedPropIds)));
            propManagerDialog.close();
            setPropManagerDialogOpen(false);
          }}
          />
      </Dialog.Root>
      <Dialog.Root
        handle={propSizeDialog}
        open={propSizeDialogOpen}
        onOpenChange={handlePropSizeDialogOpen}>
        <PropManagerDialog
          title="道具サイズ編集"
          props={history.presentState.state.props}
          visiblePropIds={selectedIds.props}
          showDelete={false}
          onSubmit={(updatedProps) => {
            dispatch({
              type: "SET_STATE",
              newState: editAndDeleteProps(
                history.presentState.state,
                { ...history.presentState.state.props, ...indexByKey(updatedProps, "id") },
                new Set()),
              currentSectionId: currentSection.id,
              commit: true});
            propSizeDialog.close();
            setPropSizeDialogOpen(false);
          }}
          />
      </Dialog.Root>
      <Dialog.Root
        handle={renamePropDialog}
        open={renamePropDialogOpen}
        onOpenChange={handleRenamePropDialogOpen}
        >
        <EditNameDialog
          name={history.presentState.state.props[selectedIds.props[0]]?.name}
          type="道具"
          onSubmit={(name) => {
            commitState(renameProp(history.presentState.state, selectedIds.props[0], name));
            renamePropDialog.close();
            setRenamePropDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={renameObstacleDialog}
        open={renameObstacleDialogOpen}
        onOpenChange={handleRenameObstacleDialogOpen}
        >
          {
            history.presentState.state.obstacles &&
            <EditNameDialog
              name={history.presentState.state.obstacles!![selectedIds.obstacles[0]]?.name}
              type="障害物"
              onSubmit={(name) => {
                commitState(renameObstacle(history.presentState.state, selectedIds.obstacles[0], name));
                renameObstacleDialog.close();
                setRenameObstacleDialogOpen(false);
              }}/>
          }
      </Dialog.Root>
      <Dialog.Root
        handle={renameSectionDialog}
        open={renameSectionDialogOpen}
        onOpenChange={handleRenameSectionDialogOpen}
        >
        <EditNameDialog
          name={currentSection?.name}
          type="セクション"
          onSubmit={(name) => {
            commitState(renameSection(history.presentState.state, currentSection.id, name));
            renameSectionDialog.close();
            setRenameSectionDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={addNoteToSectionDialog}
        open={addNoteToSectionDialogOpen}
        onOpenChange={handleAddNoteToSectionDialogOpen}
        >
        <EditSectionNoteDialog
          section={currentSection}
          personalNote={personalNote}
          onSubmit={(note: string) => {
            commitState(editSectionNote(history.presentState.state, currentSection.id, note));
            addNoteToSectionDialog.close();
            setAddNoteToSectionDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={deleteSectionDialog}
        open={deleteSectionDialogOpen}
        onOpenChange={handleDeleteSectionDialogOpen}
        >
        <ConfirmDeletionDialog
          name={currentSection.name}
          verb="削除"
          onSubmit={() => {
            const currentSectionIndex = history.presentState.state.sections
              .findIndex((s) => strEquals(s.id, currentSection.id));

            const newSectionIndex = currentSectionIndex > 0 ? currentSectionIndex - 1 : 1;

            commitState(removeSection(history.presentState.state, currentSection.id), history.presentState.state.sections[newSectionIndex].id);
            deleteSectionDialog.close();
            setDeleteSectionDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={exportDialog}
        open={exportDialogOpen}
        onOpenChange={handleExportDialogOpen}
      >
        {
          exportDialogOpen &&
          <ExportDialog
            choreo={history.presentState.state}
            selectedId={selectedIds.dancers.length === 1 ? firstSelectedDancerProp!.id : ""}
            onClose={() => setExportDialogOpen(false)}
          />
        }
      </Dialog.Root>
      <Dialog.Root
        open={dancerWarningDialogOpen}
        onOpenChange={handleDancerWarningDialogOpenChange}
        handle={dancerWarningDialog}>
        <AbsentDancersWarningDialog
          choreoName={history.presentState.state?.name}
          eventName={history.presentState.state?.event}
          dancerNames={missingNames}
        />
      </Dialog.Root>
      <Dialog.Root
        open={publishConfirmationDialogOpen}
        onOpenChange={handlePublishConfirmationDialogOpenChange}
        disablePointerDismissal
        handle={publishConfirmationDialog}>
        <PublishConfirmationDialog
          teamId={props.teamId!}
          onClose={() => {
            setPublishConfirmationDialogOpen(false);
          }}
          onSave={(newChoreo: Choreo) => onSaveAfterPublishRef.current(newChoreo)}
          oldVersion={props.serverChoreo}
          currentVersion={currentChoreoDetails}
          getChoreo={() => currentStateRef.current}
          svrPassword={password}
        />
      </Dialog.Root>
      <Dialog.Root
        open={publishSuccessDialogOpen}
        onOpenChange={handlePublishSuccessDialogOpenChange}
        handle={publishSuccessDialog}
        disablePointerDismissal
      >
        <BaseEditDialog
          title="公開成功"
          hasX={false}
          onSubmit={() => {window.location.reload()}}
          actionButtonText="ホーム画面へ戻る"
          showCloseButton={false}>
          <span className="text-nowrap">
            隊列表の公開が完了しました。
          </span>
        </BaseEditDialog>
      </Dialog.Root>
    </div>
  )
}
