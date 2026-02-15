import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { Choreo } from "../models/choreo";
import { EditHistory, StageEntities } from "../models/history";
import { addSection, assignDancersToTiming, duplicateSection, editDancerActions, editSectionNote, removeSection, renameSection, reorderSections } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection } from "../models/choreoSection";
import { debounce, indexByKey, isNullOrUndefinedOrBlank, strEquals } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportChoreo } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";
import IconButton from "../components/basic/IconButton";
import { DEFAULT_PROP_LENGTH, DEFAULT_PROP_WIDTH, ICON } from "../lib/consts/consts";
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
import { addDancer, addProp, alignHorizontalPositions, alignVerticalPositions, changeObjectColours, distributePositions, editAndDeleteProps, moveObjectPositions, pastePositions, removeObjects, renameAndDeleteDancers, renameDancer, renameProp, swapPositions, updatePropSizeAndRotate } from "../lib/editor/commands/objectCommands";
import { PropPosition } from "../models/prop";
import { DancerManagerDialog } from "../components/dialogs/DancerManagerDialog";
import ExportDialog from "../components/dialogs/ExportDialog";
import { PropManagerDialog } from "../components/dialogs/PropManagerDialog";
import EditNameDialog from "../components/dialogs/EditNameDialog";

const resizeDialog = Dialog.createHandle<Choreo>();
const editChoreoInfoDialog = Dialog.createHandle<string>();
const renameDancerDialog = Dialog.createHandle<string>();
const renamePropDialog = Dialog.createHandle<string>();
const editDancerColourDialog = Dialog.createHandle<string>();
const editDancerActionsDialog = Dialog.createHandle<string>();
const dancerManagerDialog = Dialog.createHandle<string>();
const propManagerDialog = Dialog.createHandle<string>();
const renameSectionDialog = Dialog.createHandle<ChoreoSection>();
const addNoteToSectionDialog = Dialog.createHandle<ChoreoSection>();
const deleteSectionDialog = Dialog.createHandle<ChoreoSection>();

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
  goToViewPage: (newChoreo: Choreo) => void,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [currentAction, setCurrentAction] = useState<DancerAction | undefined>();
  const [currentTiming, setCurrentTiming] = useState<DancerActionTiming | undefined>();
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: []});
  const [selectedObjects, setSelectedObjects] = useState<StageEntities<PropPosition[], DancerPosition[]>>({dancers: [], props: []});
  const [isAddingDancers, setIsAddingDancers] = useState<boolean>(false);
  const [isAddingProps, setIsAddingProps] = useState<boolean>(false);
  const [isAssigningActions, setIsAssigningActions] = useState<boolean>(false);
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
    history.presentState.state.sections,
    currentSection,
    appSettings
  ]);

  const resetSelectedIds = () => setSelectedIds({props: [], dancers: []});

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
        setSelectedIds({dancers: [...newTiming.dancerIds], props: []});
      }
    }
  }, [currentSection]);

  useEffect(() => {
    if ((selectedIds.dancers.length + selectedIds.props.length) > 0) {
      if (isAddingDancers) setIsAddingDancers(false);
      if (isAddingProps) setIsAddingProps(false);
    }
    if (currentSection.formation.dancerActions.length === 0 && isAssigningActions) {
      setIsAssigningActions(false);
      setCurrentAction(undefined);
      setCurrentTiming(undefined);
      resetSelectedIds();
    };

    setSelectedObjects({
      dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]),
      props: Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.props.includes(x[0])).map(x => x[1]),
    });
  }, [selectedIds]);

  const copyBuffer = useRef<StageEntities<Record<string, PropPosition>, Record<string, DancerPosition>>>({props: {}, dancers: {}});

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
      console.log("Saving state to db: ", history.presentState.state);
      saveChoreo(history.presentState.state, () => { isDirty.current = false }, true);
    }
  }, [history.presentState.state]);

  const onCopy = useCallback(() => {
    if ((selectedIds.dancers.length + selectedIds.props.length) === 0) {
      copyBuffer.current = ({props: {}, dancers: {}});
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

    copyBuffer.current = ({ props: copyRecordProp, dancers: copyRecordDancer });
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
  const [renameDancerDialogOpen, setRenameDancerDialogOpen] = useState(false);
  const [renamePropDialogOpen, setRenamePropDialogOpen] = useState(false);
  const [editDancerColourDialogOpen, setEditDancerColourDialogOpen] = useState(false);
  const [editDancerActionsDialogOpen, setEditDancerActionsDialogOpen] = useState(false);
  const [dancerManagerDialogOpen, setDancerManagerDialogOpen] = useState(false);
  const [propManagerDialogOpen, setPropManagerDialogOpen] = useState(false);
  const [renameSectionDialogOpen, setRenameSectionDialogOpen] = useState(false);
  const [addNoteToSectionDialogOpen, setAddNoteToSectionDialogOpen] = useState(false);
  const [deleteSectionDialogOpen, setDeleteSectionDialogOpen] = useState(false);
  
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

  const handleRenameDancerDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenameDancerDialogOpen(isOpen);
  };

  const handleRenamePropDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenamePropDialogOpen(isOpen);
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

  const [movementUpdateGroup, setMovementUpdateGroup] = useState<StageEntities<Record<string, Coordinates>>>({props: {}, dancers: {}});
  
  useEffect(() => {
    if (Object.keys(movementUpdateGroup.dancers).length === 0 && Object.keys(movementUpdateGroup.props).length === 0) return;
    if ((selectedIds.dancers.length > 0 && selectedIds.dancers.some(id => !movementUpdateGroup.dancers[id])) ||
      (selectedIds.props.length > 0 && selectedIds.props.some(id => !movementUpdateGroup.props[id]))) return;
    dispatch({
      type: "SET_STATE",
      newState: moveObjectPositions(history.presentState.state, currentSection.id, movementUpdateGroup),
      currentSectionId: currentSection.id,
      commit: true});
    setMovementUpdateGroup({props: {}, dancers: {}});
  }, [movementUpdateGroup]);

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
        showManageDancers={Object.keys(history.presentState.state.dancers).length > 0}
        manageDancers={() => {setDancerManagerDialogOpen(true);}}
        showManageProps={Object.keys(history.presentState.state.props).length > 0}
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
        />
      <div className="relative flex-1">
        <MainStage
          canEdit={!isAssigningActions}
          canSelectDancers={!isAssigningActions || currentTiming !== undefined}
          canSelectProps={!isAssigningActions}
          canToggleSelection
          appSettings={appSettings}
          isAddingDancer={isAddingDancers}
          isAddingProp={isAddingProps}
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
        />
        <div className="absolute bottom-0 z-10 flex flex-col">
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
                onClickAddButton={(id: string, newName: string) => {
                  resetSelectedIds();
                  dispatch({
                    type: "SET_STATE",
                    newState: addSection(history.presentState.state, id, newName),
                    currentSectionId: id,
                    commit: true
                  });
                }}
                onClickSection={(section) => {
                  setCurrentSection(section);
                  resetSelectedIds();
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
                  if (timing) setSelectedIds({props: [], dancers: timing.dancerIds});
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
        showChangeColour={selectedObjects.dancers.length > 0 || selectedObjects.props.length > 0}
        onChangeColor={() => {setEditDancerColourDialogOpen(true)}}
        showCopyPosition={selectedIds.dancers.length > 0 || selectedIds.props.length > 0}
        onCopyPosition={() => {onCopy()}}
        showPastePosition={Object.keys(copyBuffer.current.dancers).length > 0 || Object.keys(copyBuffer.current.props).length > 0}
        onPastePosition={() => {onPaste()}}
        showSelectDancer={selectedObjects.dancers.length > 0}
        onSelectColor={() => {
          var positions = Object.entries(currentSection.formation.dancerPositions);
          var currentColours = new Set(positions.filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1].color));
          setSelectedIds(prev => ({...prev, dancers: positions.filter(x => currentColours.has(x[1].color)).map(x => x[0])}));
        }}
        onSelectType={() => {
          setSelectedIds({props: [], dancers: Object.keys(history.presentState.state.dancers)});
        }}
        onDeselect={resetSelectedIds}
        showDistribute={(selectedIds.dancers.length + selectedIds.props.length) >= 3}
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
        showArrange={selectedIds.dancers.length > 0 || selectedIds.props.length > 0}
        showSwapPosition={selectedObjects.dancers.length === 2 && selectedObjects.props.length === 0}
        onSwapPosition={onSwapPositions}
        showDeleteObjects={selectedIds.dancers.length > 0 || selectedIds.props.length > 0}
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
        showRenameDancer={selectedObjects.dancers.length === 1 && selectedObjects.props.length === 0}
        onRenameProp={() => {setRenamePropDialogOpen(true)}}
        showRenameProp={selectedObjects.props.length === 1 && selectedObjects.dancers.length === 0}
        onRenameSection={() => {
          resetSelectedIds();
          setRenameSectionDialogOpen(true);
        }}
        onAddNoteToSection={() => {
          resetSelectedIds();
          setAddNoteToSectionDialogOpen(true);
        }}
        onDuplicateSection={() => {
          resetSelectedIds();
          dispatch({
            type: "SET_STATE",
            newState: duplicateSection(history.presentState.state, currentSection, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id))),
            currentSectionId: currentSection.id,
            commit: true,
          });
        }}
        canDeleteSection={history.presentState.state.sections.length > 1}
        onDeleteSection={() => {
          resetSelectedIds();
          setDeleteSectionDialogOpen(true)
        }}
      />
      {
        isAddingDancers &&
        <div className="absolute items-center w-max rounded-md flex gap-2 p-2 top-20 left-1/2 translate-x-[-50%] bg-white border-2 border-primary">
          <span>
            グリッドを押して<b>ダンサー</b>を追加する
          </span>
          <IconButton
            src={ICON.clear}
            size="sm"
            onClick={() => {setIsAddingDancers(false);}}/>
        </div>
      }
      {
        isAddingProps &&
        <div className="absolute items-center w-max rounded-md flex gap-2 p-2 top-20 left-1/2 translate-x-[-50%] bg-white border-2 border-primary">
          <span>
            グリッドを押して<b>道具</b>を追加する
          </span>
          <IconButton
            src={ICON.clear}
            size="sm"
            onClick={() => {setIsAddingProps(false);}}/>
        </div>
      }
      {
        isAssigningActions &&
        <div className="absolute items-center w-max max-w-full rounded-md flex gap-2 p-2 top-20 left-1/2 translate-x-[-50%] bg-white border-2 border-primary">
          <span className="text-center">
            {
              currentAction && currentTiming && `「${currentAction.name}-${currentTiming.name}」を割り当てるダンサーをタップ`
            }
            {
              (currentAction === undefined || currentTiming === undefined) && "カウントを選択してください"
            }
          </span>
          <IconButton
            src={ICON.clear}
            size="sm"
            onClick={() => {
              resetSelectedIds();
              setCurrentAction(undefined);
              setCurrentTiming(undefined);
              if (currentAction === undefined || currentTiming === undefined) {
                setIsAssigningActions(false);
              }
            }}/>
        </div>
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
          choreo={history.presentState.state}
          onSubmit={(name) => {
            dispatch({
              type: "SET_STATE",
              newState: renameChoreo(history.presentState.state, name),
              currentSectionId: currentSection.id,
              commit: true});
            editChoreoInfoDialog.close();
            setEditChoreoInfoDialogOpen(false);
          }}/>
      </Dialog.Root>
      <Dialog.Root
        handle={renameDancerDialog}
        open={renameDancerDialogOpen}
        onOpenChange={handleRenameDancerDialogOpen}>
        <EditNameDialog
          name={history.presentState.state.dancers[selectedIds.dancers[0]]?.name}
          type="ダンサー"
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
          propOnly={selectedIds.dancers.length === 0 && selectedIds.props.length > 0}
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
            dispatch({
              type: "SET_STATE",
              newState: removeSection(history.presentState.state, currentSection.id),
              currentSectionId: currentSection.id,
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
    </div>
  )
}