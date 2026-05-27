import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { BasicChoreoDetails, Choreo, EventDetails, getBasicChoreoDetails } from "../models/choreo";
import { EditHistory, StageEntities } from "../models/history";
import { addSection, assignDancersToTiming, duplicateSection, editDancerActions, editSectionNote, removeSection, renameSection, reorderSections } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection } from "../models/choreoSection";
import { debounce, indexByKey, isNullOrUndefinedOrBlank, strEquals, stringifyEvent } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportChoreo } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, ICON, SAMPLE_PARADE_ID, SAMPLE_STAGE_ID } from "../lib/consts/consts";
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
import { Coordinates } from "../models/base";
import { colorPalette } from "../lib/consts/colors";
import { addDancer, addObstacle, addObstacles, addProp, alignHorizontalPositions, alignVerticalPositions, changeObjectColours, distributePositions, editAndDeleteProps, moveObjectPositions, pastePositions, removeObjects, renameAndDeleteDancers, renameDancer, renameObstacle, renameProp, swapPositions, updateObstacleSizeAndRotate, updatePropSizeAndRotate } from "../lib/editor/commands/objectCommands";
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
import LoginDialog from "../components/dialogs/LoginDialog";
import UploadConfirmationDialog from "../components/dialogs/UploadConfirmationDialog";

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
const renameSectionDialog = Dialog.createHandle<ChoreoSection>();
const addNoteToSectionDialog = Dialog.createHandle<ChoreoSection>();
const deleteSectionDialog = Dialog.createHandle<ChoreoSection>();
const dancerWarningDialog = Dialog.createHandle<Choreo>();
const loginDialog = Dialog.createHandle<null>();
const uploadConfirmationDialog = Dialog.createHandle<null>();

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
  currentChoreoStatus: ChoreoStatus,
  goToViewPage: (newChoreo: Choreo) => void,
  eventList: EventDetails[],
  dancerNamesByEvent: Record<string, Record<string, string[]>>,
  onChoreoEdited: () => void,
  serverChoreo?: BasicChoreoDetails,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [currentAction, setCurrentAction] = useState<DancerAction | undefined>();
  const [currentTiming, setCurrentTiming] = useState<DancerActionTiming | undefined>();
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: [], obstacles: []});
  const [selectedObjects, setSelectedObjects] = useState<StageEntities<PropPosition[], DancerPosition[], Obstacle[]>>({dancers: [], props: [], obstacles: []});
  const [selectedColour, setSelectedColour] = useState<string | undefined>();
  const [isAddingDancers, setIsAddingDancers] = useState<boolean>(false);
  const [isAddingProps, setIsAddingProps] = useState<boolean>(false);
  const [isAddingObstacles, setIsAddingObstacles] = useState<boolean>(false);
  const [isAssigningActions, setIsAssigningActions] = useState<boolean>(false);
  const [areObstaclesLocked, setAreObstaclesLocked] = useState<boolean>(true);
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
      presentState: {state: props.currentChoreo, currentSectionId: props.currentChoreo.sections[0].id},
      redoStack: [],
    } as EditHistory<Choreo>);

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
      } as BasicChoreoDetails
    }
  , [history.presentState.state.name,
    history.presentState.state.event,
    history.presentState.state.startDate,
    history.presentState.state.endDate,
    history.presentState.state.dancers,
    history.presentState.state.props,
    history.presentState.state.stageGeometry]);

  const [prevSection, setPrevSection] = useState<ChoreoSection | undefined>();
  useEffect(() => {
    if (appSettings.showPreviousSection) {
      var currentSectionIndex = history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id));
      setPrevSection(history.presentState.state.sections[currentSectionIndex - 1]);
    } else {
      setPrevSection(undefined);
    }
  }, [
    history.presentState.state.dancers,
    history.presentState.state.props,
    history.presentState.state.obstacles,
    history.presentState.state.sections,
    currentSection,
    appSettings
  ]);

  const resetSelectedIds = () => setSelectedIds({props: [], dancers: [], obstacles: []});

  useEffect(() => {
    // assigning actions
    if (isAssigningActions && currentAction && currentTiming && currentTiming.dancerIds.length !== selectedIds.dancers.length) {
      dispatch({
        type: "SET_STATE",
        newState: assignDancersToTiming(history.presentState.state, currentSection.id, currentAction.id, currentTiming.id, selectedIds.dancers),
        currentSectionId: currentSection.id,
        commit: true,
      });
      setCurrentTiming({...currentTiming, dancerIds: selectedIds.dancers})
    }
  }, [selectedIds, history.presentState, currentSection]);

  useEffect(() => {
    // undo/redo timing
    if (currentAction && currentTiming) {
      var newTiming = currentSection.formation.dancerActions.find(x => strEquals(currentAction.id, x.id))?.timings.find(x => strEquals(currentTiming.id, x.id));
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

    const dancers = Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]);
    const props = Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.props.includes(x[0])).map(x => x[1]);
    const obstacles = history.presentState.state.obstacles ? Object.entries(history.presentState.state.obstacles).filter(x => selectedIds.obstacles.includes(x[0])).map(x => x[1]) : [];

    setSelectedObjects({
      dancers: dancers,
      props: props,
      obstacles: obstacles,
    });
    const colours = new Set([
      ...dancers.map(x => x.color),
      ...Object.entries(history.presentState.state.props).filter(x => selectedIds.props.includes(x[0])).map(x => x[1].color),
      ...obstacles.map(x => x.color)
    ]);
    
    setSelectedColour(colours.size === 1 ? Array.from(colours)[0] : undefined);
  }, [selectedIds]);

  const copyBuffer = useRef<StageEntities<Record<string, PropPosition>, Record<string, DancerPosition>>>({props: {}, dancers: {}, obstacles: {}});

  useEffect(() => {
    var newSection = history.presentState.state.sections.find(s => strEquals(s.id, history.presentState.currentSectionId));
    
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
    dispatch({
      type: "SET_STATE",
      newState: pastePositions(
        history.presentState.state,
        currentSection.id,
        copyBuffer.current
      ),
      currentSectionId: currentSection.id,
      commit: true,
    });
  }, [
    dispatch,
    history.presentState.state,
    currentSection.id,
    copyBuffer,
  ]);

  const onSaveRef = useRef(onSave);
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
  const [renameSectionDialogOpen, setRenameSectionDialogOpen] = useState(false);
  const [addNoteToSectionDialogOpen, setAddNoteToSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  const [dancerWarningDialogOpen, setDancerWarningDialogOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [uploadConfirmationDialogOpen, setUploadConfirmationDialog] = useState(false);
  
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

  const handleDancerWarningDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDancerWarningDialogOpen(isOpen);
  };

  const handleLoginDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setLoginDialogOpen(isOpen);
  };

  const handleUploadConfirmationDialogOpenChange = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setUploadConfirmationDialog(isOpen);
  };
  
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const exportDialog = Dialog.createHandle<{}>();
  const handleExportDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setExportDialogOpen(isOpen);
  };

  const onSwapPositions = () => {
    dispatch({
      type: "SET_STATE",
      newState: swapPositions(history.presentState.state, currentSection.id, selectedIds.dancers[0], selectedIds.dancers[1]),
      currentSectionId: currentSection.id,
      commit: true});
  };

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

    dispatch({
      type: "SET_STATE",
      newState: moveObjectPositions(history.presentState.state, currentSection.id, movementUpdateGroup),
      currentSectionId: currentSection.id,
      commit: true});
    setMovementUpdateGroup({props: {}, dancers: {}, obstacles: {}});
  }, [movementUpdateGroup]);

  const missingNames = useMemo(() => {
    const pool = new Set(Object.entries(props.dancerNamesByEvent[stringifyEvent(history.presentState.state)] ?? {})
      .filter(([id]) => id !== history.presentState.state.id)
      .flatMap(([, names]) => names));
    const currentNames = new Set(Object.values(history.presentState.state.dancers).map(x => x.name));
    return Array.from(new Set(pool).difference(currentNames)).sort();
  }, [props.dancerNamesByEvent, history.presentState.state.dancers, history.presentState.state.event, history.presentState.state.startDate, history.presentState.state.endDate]);

  return (
    <div className='flex flex-col justify-between w-screen h-[100svh] max-h-[100svh]'>
      <Header
        returnHome={props.goToHomePage}
        hasSidebar
        currentChoreo={history.presentState.state}
        onSave={() => {onSave()}}
        editName={() => {setEditChoreoInfoDialogOpen(true)}}
        editSize={() => {setResizeDialogOpen(true);}}
        onDownload={() => setExportDialogOpen(true)}
        showManageDancers={entityCount.dancers > 0}
        manageDancers={() => {setDancerManagerDialogOpen(true);}}
        showManageProps={entityCount.props > 0}
        manageProps={() => {setPropManagerDialogOpen(true);}}
        manageSections={() => {console.log("TODO: implement Manage Sections")}}
        exportChoreo={() => {
          exportChoreo(history.presentState.state);
        }}
        changeShowGrid={() => {
          setAppSettings(prev => {return {...prev, showGrid: !prev.showGrid}})
        }}
        changeShowPrevious={() => {
          setAppSettings(prev => {return {...prev, showPreviousSection: !prev.showPreviousSection}})
        }}
        changeSnap={() => {
          setAppSettings(prev => {return {...prev, snapToGrid: !prev.snapToGrid}})
        }}
        changeDancerSize={(showLarge) => {
          setAppSettings(prev => {return {...prev, dancerDisplayType: showLarge ? "large" : "small"}})
        }}
        appSettings={appSettings}
        goToView={() => {props.goToViewPage(history.presentState.state)}}
        showDancerWarningMessage={missingNames.length > 0 ? () => {setDancerWarningDialogOpen(true)} : undefined}
        dancerCount={entityCount.dancers}
        propCount={entityCount.props}
        stageWidth={history.presentState.state.stageGeometry.stageWidth}
        stageLength={history.presentState.state.stageGeometry.stageLength}
        version={props.currentChoreo.version}
        choreoStatus={props.currentChoreoStatus}
        showUpload={
          !strEquals(history.presentState.state.id, SAMPLE_PARADE_ID) &&
          !strEquals(history.presentState.state.id, SAMPLE_STAGE_ID) &&
          history.presentState.state.isDirty
        }
        upload={() => {setLoginDialogOpen(true)}}
        />
      <div className="relative flex-1">
        <MainStage
          canEdit={!isAssigningActions}
          canSelectDancers={!isAssigningActions || currentTiming !== undefined}
          canSelectProps={!isAssigningActions}
          canSelectObstacles={!isAssigningActions && !areObstaclesLocked}
          canToggleSelection
          appSettings={appSettings}
          isAddingDancer={isAddingDancers}
          isAddingProp={isAddingProps}
          isAddingObstacles={isAddingObstacles}
          hideTransformerBorder={isAssigningActions}
          currentChoreo={history.presentState.state}
          currentSection={currentSection}
          updateDancerPosition={(x, y, dancerId) => {
            setMovementUpdateGroup(prev => ({...prev, "dancers": {...prev.dancers, [dancerId]: {x, y}}}));
          }}
          updatePropPosition={(x, y, propId) => {
            setMovementUpdateGroup(prev => ({...prev, "props": {...prev.props, [propId]: {x, y}}}));
          }}
          updatePropSizeAndRotate={(width, length, rotation, x, y, propId) => {
            dispatch({
              type: "SET_STATE",
              newState: updatePropSizeAndRotate(
                history.presentState.state,
                currentSection.id,
                width, length, rotation, x, y, propId
              ),
              currentSectionId: currentSection.id,
              commit: true});
          }}
          updateObstaclePosition={(x, y, itemId) => {
            setMovementUpdateGroup(prev => ({...prev, "obstacles": {...prev.obstacles, [itemId]: {x, y}}}));
          }}
          updateObstacleSizeAndRotate={(width, length, rotation, x, y, itemId) => {
            dispatch({
              type: "SET_STATE",
              newState: updateObstacleSizeAndRotate(
                history.presentState.state,
                width, length, rotation, x, y, itemId
              ),
              currentSectionId: currentSection.id,
              commit: true});
          }}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          previousSection={prevSection}
          addDancer={(x, y) => {
            dispatch({
              type: "SET_STATE",
              newState: addDancer(
                history.presentState.state, 
                {
                  id: crypto.randomUUID(),
                  name: Object.keys(history.presentState.state.dancers).length.toString()
                },
                x,
                y
              ),
              currentSectionId: currentSection.id,
              commit: true});
            }
          }
          addProp={(x, y) => {
            dispatch({
              type: "SET_STATE",
              newState: addProp(
                history.presentState.state, 
                {
                  id: crypto.randomUUID(),
                  name: Object.keys(history.presentState.state.props).length.toString(),
                  length: DEFAULT_PROP_LENGTH,
                  width: DEFAULT_PROP_WIDTH,
                  color: colorPalette.rainbow.blue[0],
                },
                x - 2,
                y - 0.5
              ),
              currentSectionId: currentSection.id,
              commit: true});
            }
          }
          addObstacle={(x, y) => {
            dispatch({
              type: "SET_STATE",
              newState: addObstacle(
                history.presentState.state, 
                {
                  id: crypto.randomUUID(),
                  name: Object.keys(history.presentState.state.obstacles ?? {}).length.toString(),
                  length: DEFAULT_PROP_LENGTH,
                  width: DEFAULT_PROP_WIDTH,
                  color: colorPalette.greys[2],
                  x: x - 2,
                  y: y - 0.5,
                  rotation: 0,
                  type: "obstacle",
                  sectionId: "",
                },
              ),
              currentSectionId: currentSection.id,
              commit: true});
            }
          }
        />
        <div className="absolute bottom-0 flex flex-col">
          <div className="absolute bottom-12">
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
                  resetSelectedIds();
                  dispatch({
                    type: "SET_STATE",
                    newState: addSection(history.presentState.state, id),
                    currentSectionId: id,
                    commit: true
                  });
                }}
                onChangeSection={(section) => {
                  setCurrentSection(section);
                  resetSelectedIds();
                }}
                onOpenSectionMenu={() => {
                  setSectionManagerDialogOpen(true);
                }}
                onReorder={(sections) => {
                  resetSelectedIds();
                  dispatch({
                    type: "SET_STATE",
                    newState: reorderSections(history.presentState.state, sections),
                    currentSectionId: currentSection.id,
                    commit: true,
                  })
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
        onAddDancer={() => {
          resetSelectedIds();
          setIsAddingDancers(prev => !prev);
        }}
        isAddingDancer={isAddingDancers}
        onAddProp={() => {
          resetSelectedIds();
          setIsAddingProps(prev => !prev);
        }}
        isAddingProp={isAddingProps}
        onAddObstacle={() => {
          resetSelectedIds();
          setIsAddingObstacles(prev => !prev);
          setAreObstaclesLocked(false);
        }}
        isAddingObstacle={isAddingObstacles}
        showChangeColour={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        onChangeColor={() => {setEditDancerColourDialogOpen(true)}}
        showCopyPosition={selectedIds.dancers.length > 0 || selectedIds.props.length > 0}
        onCopyPosition={() => {onCopy()}}
        showPastePosition={Object.keys(copyBuffer.current.dancers).length > 0 || Object.keys(copyBuffer.current.props).length > 0}
        onPastePosition={() => {onPaste()}}
        showSelectDancer={selectedIds.dancers.length > 0}
        onSelectColor={() => {
          var positions = Object.entries(currentSection.formation.dancerPositions);
          var currentColours = new Set(positions.filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1].color));
          setSelectedIds(prev => ({...prev, dancers: positions.filter(x => currentColours.has(x[1].color)).map(x => x[0])}));
        }}
        onSelectType={(selectDancers: boolean, selectProps: boolean) => {
          setSelectedIds({
            props: selectProps ? Object.keys(history.presentState.state.props) : [],
            dancers: selectDancers ? Object.keys(history.presentState.state.dancers) : [],
            obstacles: []
          });
        }}
        showSelectDancersButton={entityCount.dancers > 0 && entityCount.dancers > selectedIds.dancers.length}
        showSelectPropsButton={entityCount.props > 0 && entityCount.props > selectedIds.props.length}
        showSelectAllButton={entityCount.dancers > selectedIds.dancers.length || entityCount.props > selectedIds.props.length}
        onDeselect={resetSelectedIds}
        showDistribute={(selectedIds.dancers.length + selectedIds.props.length + selectedIds.obstacles.length) >= 3}
        onDistribute={(distribution) => {
          dispatch({
            type: "SET_STATE",
            newState: distributePositions(history.presentState.state, currentSection.id, selectedObjects, distribution),
            currentSectionId: currentSection.id,
            commit: true,
          })
        }}
        onHorizontalAlign={(alignment) => {
          dispatch({
            type: "SET_STATE",
            newState: alignHorizontalPositions(history.presentState.state, currentSection.id, selectedObjects, alignment),
            currentSectionId: currentSection.id,
            commit: true,
          })
        }}
        onVerticalAlign={(alignment) => {
          dispatch({
            type: "SET_STATE",
            newState: alignVerticalPositions(history.presentState.state, currentSection.id, selectedObjects, alignment),
            currentSectionId: currentSection.id,
            commit: true,
          });
        }}
        showArrange={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        showSwapPosition={selectedIds.dancers.length === 2 && selectedIds.props.length === 0 && selectedIds.obstacles.length === 0}
        onSwapPosition={onSwapPositions}
        showDeleteObjects={selectedIds.dancers.length > 0 || selectedIds.props.length > 0 || selectedIds.obstacles.length > 0}
        onDeleteObjects={() => {
          dispatch({
            type: "SET_STATE",
            newState: removeObjects(history.presentState.state, selectedIds),
            currentSectionId: currentSection.id,
            commit: true,
          });
          resetSelectedIds();
        }}
        onOpenActionManager={() => setEditDancerActionsDialogOpen(true)}
        onAssignActions={() => {
          resetSelectedIds();
          setCurrentAction(undefined);
          setCurrentTiming(undefined);
          setIsAssigningActions(prev => !prev);
        }}
        isAssigningActionsEnabled={currentSection.formation.dancerActions.length > 0}
        isAssigningActions={isAssigningActions}
        onRenameDancer={() => {setRenameDancerDialogOpen(true)}}
        showRenameDancer={selectedIds.dancers.length === 1 && (selectedIds.props.length + selectedIds.obstacles.length) === 0}
        onRenameProp={() => {setRenamePropDialogOpen(true)}}
        showRenameProp={selectedIds.props.length === 1 && (selectedIds.dancers.length + selectedIds.obstacles.length === 0)}
        onRenameObstacle={() => {setRenameObstacleDialogOpen(true)}}
        showRenameObstacle={selectedIds.obstacles.length === 1 && (selectedIds.dancers.length + selectedIds.props.length === 0)}
        showDuplicateObstacle={selectedIds.obstacles.length > 0 && selectedIds.dancers.length === 0 && selectedIds.props.length === 0}
        onDuplicateObstacle={() => {
          var newObstacles = selectedObjects.obstacles.map(o => ({
            ...o,
            id: crypto.randomUUID(),
            x: o.x + 0.5,
            y: o.y + (history.presentState.state.stageGeometry.yAxis === "bottom-up" ? -0.5 : +0.5)
          }));
          var newIds = newObstacles.map(o => o.id);
          dispatch({
            type: "SET_STATE",
            newState: addObstacles(
              history.presentState.state, 
              newObstacles,
            ),
            currentSectionId: currentSection.id,
            commit: true});
          setSelectedIds({props: [], dancers: [], obstacles: newIds});
        }}
        showLockObstacle={entityCount.obstacles > 0}
        areObstaclesLocked={areObstaclesLocked}
        onToggleObstacleLock={() => {setAreObstaclesLocked(prev => !prev)}}
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
            dispatch({
              type: "SET_STATE",
              newState: changeStageGeometryAndType(history.presentState.state, geometry, stageType),
              currentSectionId: currentSection.id,
              commit: true});
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
            dispatch({
              type: "SET_STATE",
              newState: renameChoreo(history.presentState.state, name, event, startDate, endDate),
              currentSectionId: currentSection.id,
              commit: true});
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
                icon={ICON.textFieldsAlt}
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
                icon={ICON.speakerNotes}
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
                icon={ICON.fileCopy}
                label="複製"
                asDiv
                onClick={() => {
                  resetSelectedIds();
                  dispatch({
                    type: "SET_STATE",
                    newState: duplicateSection(history.presentState.state, currentSection, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id))),
                    currentSectionId: currentSection.id,
                    commit: true,
                  });
                }}
                full />
            </Dialog.Close>

            {
              history.presentState.state.sections.length > 1 &&
              <Dialog.Close>
                <IconLabelButton
                  icon={ICON.delete}
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
          name={history.presentState.state.dancers[selectedIds.dancers[0]]?.name}
          otherNames={Object.values(history.presentState.state.dancers).map(x => x.name)}
          missingNames={missingNames}
          onSubmit={(name) => {
            dispatch({
              type: "SET_STATE",
              newState: renameDancer(history.presentState.state, selectedIds.dancers[0], name),
              currentSectionId: currentSection.id,
              commit: true});
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
              dispatch({
                type: "SET_STATE",
                newState: changeObjectColours(history.presentState.state, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id)), mode, selectedIds, color),
                currentSectionId: currentSection.id,
                commit: true});
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
            dispatch({
              type: "SET_STATE",
              newState: editDancerActions(history.presentState.state, currentSection.id, actions),
              currentSectionId: currentSection.id,
              commit: true});
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
            dispatch({
              type: "SET_STATE",
              newState: renameAndDeleteDancers(history.presentState.state, indexByKey(dancers, "id"), new Set(deletedDancerIds)),
              currentSectionId: currentSection.id,
              commit: true});
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
            dispatch({
              type: "SET_STATE",
              newState: editAndDeleteProps(history.presentState.state, indexByKey(props, "id"), new Set(deletedPropIds)),
              currentSectionId: currentSection.id,
              commit: true});
            propManagerDialog.close();
            setPropManagerDialogOpen(false);
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
            dispatch({
              type: "SET_STATE",
              newState: renameProp(history.presentState.state, selectedIds.props[0], name),
              currentSectionId: currentSection.id,
              commit: true,
            });
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
                dispatch({
                  type: "SET_STATE",
                  newState: renameObstacle(history.presentState.state, selectedIds.obstacles[0], name),
                  currentSectionId: currentSection.id,
                  commit: true,
                });
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
            dispatch({
              type: "SET_STATE",
              newState: renameSection(history.presentState.state, currentSection.id, name),
              currentSectionId: currentSection.id,
              commit: true,
            });
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
          onSubmit={(note: string) => {
            dispatch({
              type: "SET_STATE",
              newState: editSectionNote(history.presentState.state, currentSection.id, note),
              currentSectionId: currentSection.id,
              commit: true,
            });
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
          section={currentSection}
          onSubmit={() => {
            const currentSectionIndex = history.presentState.state.sections
              .findIndex((s) => strEquals(s.id, currentSection.id));
            
            const newSectionIndex = currentSectionIndex > 0 ? currentSectionIndex - 1 : 1;

            dispatch({
              type: "SET_STATE",
              newState: removeSection(history.presentState.state, currentSection.id),
              currentSectionId: history.presentState.state.sections[newSectionIndex].id,
              commit: true,
            });
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
            selectedId={selectedIds.dancers.length === 1 ? selectedIds.dancers[0] : ""}
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
        open={loginDialogOpen}
        onOpenChange={handleLoginDialogOpenChange}
        handle={loginDialog}>
        <LoginDialog
          onClose={() => {
            setLoginDialogOpen(false);
            setUploadConfirmationDialog(true);
          }}
        />
      </Dialog.Root>
      <Dialog.Root
        open={uploadConfirmationDialogOpen}
        onOpenChange={handleUploadConfirmationDialogOpenChange}
        handle={uploadConfirmationDialog}>
        <UploadConfirmationDialog
          onClose={() => {}}
          oldVersion={props.serverChoreo}
          currentVersion={currentChoreoDetails}
        />
      </Dialog.Root>
    </div>
  )
}