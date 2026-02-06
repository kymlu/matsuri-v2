import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { Choreo } from "../models/choreo";
import { EditHistory } from "../models/history";
import { addSection, assignDancersToTiming, duplicateSection, editDancerActions, editSectionNote, removeSection, renameSection, reorderSections } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection, SelectedObjects } from "../models/choreoSection";
import { isNullOrUndefined, isNullOrUndefinedOrBlank, strEquals } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { alignHorizontalPositions, alignVerticalPositions, changeDancerColorAll, changeDancerColorCurrent, changeDancerColorCurrentAndFuture, distributePositions, moveDancerPositions, pasteDancerPositions, swapPositions } from "../lib/editor/commands/dancerPositionCommands";
import ObjectToolbar from "../components/editor/ObjectToolbar";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportToMtr } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";
import { addDancer, removeDancers, renameDancer } from "../lib/editor/commands/dancerCommands";
import IconButton from "../components/basic/IconButton";
import { ICON } from "../lib/consts/consts";
import { AppSetting } from "../models/appSettings";
import { changeStageGeometry, editChoreoInfo } from "../lib/editor/commands/choreoCommands";
import EditChoreoInfoDialog from "../components/dialogs/EditChoreoInfoDialog";
import EditDancerNameDialog from "../components/dialogs/EditDancerNameDialog";
import EditDancerColourDialog from "../components/dialogs/EditDancerColourDialog";
import { DancerPosition } from "../models/dancer";
import { ActionManagerDialog } from "../components/dialogs/ActionManagerDialog";
import { DancerAction, DancerActionTiming } from "../models/dancerAction";
import ActionSelectionToolbar from "../components/editor/ActionSelectionToolbar";
import ConfirmDeletionDialog from "../components/dialogs/ConfirmDeletionDialog";
import EditSectionNameDialog from "../components/dialogs/EditSectionNameDialog";
import EditSectionNoteDialog from "../components/dialogs/EditSectionNoteDialog";
import { Coordinates } from "../models/base";

const resizeDialog = Dialog.createHandle<Choreo>();
const editChoreoInfoDialog = Dialog.createHandle<string>();
const renameDancerDialog = Dialog.createHandle<string>();
const editDancerColourDialog = Dialog.createHandle<string>();
const editDancerActionsDialog = Dialog.createHandle<string>();
const renameSectionDialog = Dialog.createHandle<ChoreoSection>();
const addNoteToSectionDialog = Dialog.createHandle<ChoreoSection>();
const deleteSectionDialog = Dialog.createHandle<ChoreoSection>();

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [currentAction, setCurrentAction] = useState<DancerAction | undefined>();
  const [currentTiming, setCurrentTiming] = useState<DancerActionTiming | undefined>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<SelectedObjects>({dancers: [], props: []});
  const [isAddingDancers, setIsAddingDancers] = useState<boolean>(false);
  const [isAssigningActions, setIsAssigningActions] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    dancerDisplayType: "large",
  });
  const [history, dispatch] = useReducer(historyReducer,
    {
      undoStack: [],
      presentState: {state: props.currentChoreo, currentSectionId: props.currentChoreo.sections[0].id},
      redoStack: [],
    } as EditHistory<Choreo>);

  useEffect(() => {
    if (selectedIds.length > 0 && isAddingDancers) setIsAddingDancers(false);

    if (isAssigningActions && currentAction && currentTiming && currentTiming.dancerIds.length !== selectedIds.length) {
      dispatch({
        type: "SET_STATE",
        newState: assignDancersToTiming(history.presentState.state, currentSection.id, currentAction.id, currentTiming.id, selectedIds),
        currentSectionId: currentSection.id,
        commit: true,
      });
      setCurrentTiming({...currentTiming, dancerIds: selectedIds})
    }

    setSelectedObjects({
      dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.includes(x[0])).map(x => x[1]),
      props: Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.includes(x[0])).map(x => x[1]),
    });
  }, [selectedIds, history.presentState, currentSection]);

  const [copyBuffer, setCopyBuffer] = useState<Record<string, DancerPosition>>({});

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
    console.log("Saving state to db: ", history.presentState.state);
    saveChoreo(history.presentState.state, () => {});
  }, [history.presentState.state, saveChoreo]);

  const onCopy = useCallback(() => {
    if (selectedIds.length === 0) {
      console.log("Emptying copy buffer");
      setCopyBuffer({});
      return;
    }

    const copyRecord: Record<string, DancerPosition> = {};

    selectedIdsRef.current.forEach(id => {
      const dancerPosition = currentSection.formation.dancerPositions[id];
      if (dancerPosition) {
        copyRecord[id] = dancerPosition;
      }
    });

    setCopyBuffer({ ...copyRecord });
    console.log("New copy buffer", copyRecord);
  }, [
    selectedIds,
    currentSection.formation.dancerPositions,
    setCopyBuffer,
  ]);

  const onPaste = useCallback(() => {
    console.log("Pasting", copyBuffer, "to", currentSection.id);

    dispatch({
      type: "SET_STATE",
      newState: pasteDancerPositions(
        history.presentState.state,
        currentSection.id,
        copyBuffer
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
  const [editDancerColourDialogOpen, setEditDancerColourDialogOpen] = useState(false);
  const [editDancerActionsDialogOpen, setEditDancerActionsDialogOpen] = useState(false);
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
  
  const handleEditDancerColourDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditDancerColourDialogOpen(isOpen);
  };
  
  const handleEditDancerActionsDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setEditDancerActionsDialogOpen(isOpen);
  };

  const onSwapPositions = () => {
    dispatch({
      type: "SET_STATE",
      newState: swapPositions(history.presentState.state, currentSection.id, selectedIds[0], selectedIds[1]),
      currentSectionId: currentSection.id,
      commit: true});
  };


  const [movementUpdateGroup, setMovementUpdateGroup] = useState<Record<string, Coordinates>>({});
  
  useEffect(() => {
    console.log(movementUpdateGroup)
    if (selectedIds.some(id => isNullOrUndefined(movementUpdateGroup[id]))) return;
    dispatch({
      type: "SET_STATE",
      newState: moveDancerPositions(history.presentState.state, currentSection.id, movementUpdateGroup),
      currentSectionId: currentSection.id,
      commit: true});
    setMovementUpdateGroup({});
  }, [movementUpdateGroup]);

  return (
    <div className='flex flex-col justify-between w-screen h-[100svh] max-h-[100svh]'>
      <Header
        returnHome={props.goToHomePage}
        hasSidebar
        currentChoreo={history.presentState.state}
        onSave={() => {onSave()}}
        editName={() => {setEditChoreoInfoDialogOpen(true)}}
        manageSections={() => {console.log("TODO: implement Manage Sections")}}
        editSize={() => {setResizeDialogOpen(true);}}
        export={() => {
          console.log("TODO: implement choice of pdf or mtr");
          exportToMtr(history.presentState.state);
        }}
        changeShowGrid={() => {
          setAppSettings(prev => {return {...prev, showGrid: !prev.showGrid}})
        }}
        changeSnap={() => {
          setAppSettings(prev => {return {...prev, snapToGrid: !prev.snapToGrid}})
        }}
        changeDancerSize={(showLarge) => {
          setAppSettings(prev => {return {...prev, dancerDisplayType: showLarge ? "large" : "small"}})
        }}
        appSettings={appSettings}
        />
      <div className="relative flex-1">
        <MainStage
          canEdit={!isAssigningActions}
          canSelectDancers={!isAssigningActions || currentTiming !== undefined}
          canToggleSelection
          appSettings={appSettings}
          isAddingDancer={isAddingDancers}
          hideTransformerBorder={isAssigningActions}
          currentChoreo={history.presentState.state}
          currentSection={currentSection}
          updateDancerPosition={(x, y, dancerId) => {
            setMovementUpdateGroup(prev => ({...prev, [dancerId]: {x, y}}));
          }}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          addDancer={(x, y) => {
            console.log("Adding dancer at", x, y);
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
        />
        <div className="absolute bottom-0 z-10 flex flex-col">
          {
            !isAssigningActions &&
            <div className="absolute bottom-20">
              <ObjectToolbar
                openColorMenu={() => {setEditDancerColourDialogOpen(true)}}
                isColorVisible={selectedObjects.dancers.length > 0 && selectedObjects.props.length === 0}
                swapPositions={onSwapPositions}
                isSwapVisible={selectedObjects.dancers.length === 2 && selectedObjects.props.length === 0}
                openRenameMenu={() => {setRenameDancerDialogOpen(true)}}
                isRenameVisible={selectedObjects.dancers.length === 1 && selectedObjects.props.length === 0}
              />
            </div>
          }
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
                onClickAddButton={(id: string, newName: string) => {
                  setSelectedIds([]);
                  dispatch({
                    type: "SET_STATE",
                    newState: addSection(history.presentState.state, id, newName),
                    currentSectionId: id,
                    commit: true
                  });
                }}
                onClickSection={(section) => {
                  setCurrentSection(section);
                  setSelectedIds([]);
                }}
                onReorder={(sections) => {
                  setSelectedIds([]);
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
                  if (timing) setSelectedIds(timing.dancerIds);
                  else setSelectedIds([]);
                }}
                selectedTimingId={currentTiming?.id}
                />
            }
          </div>
        </div>
      </div>
      <Toolbar
        onAddDancer={() => {
          setSelectedIds([]);
          setIsAddingDancers(prev => !prev);
        }}
        isAddingDancer={isAddingDancers}
        showDancerColor={selectedObjects.dancers.length > 0}
        onChangeColor={() => {setEditDancerColourDialogOpen(true)}}
        showCopyPosition={selectedIds.length > 0}
        onCopyPosition={() => {onCopy()}}
        showPastePosition={Object.keys(copyBuffer).length > 0}
        onPastePosition={() => {onPaste()}}
        showSelectDancer={selectedObjects.dancers.length > 0}
        onSelectColor={() => {
          var positions = Object.entries(currentSection.formation.dancerPositions);
          var currentColours = new Set(positions.filter(x => selectedIds.includes(x[0])).map(x => x[1].color));
          setSelectedIds(positions.filter(x => currentColours.has(x[1].color)).map(x => x[0]));
        }}
        onSelectType={() => {
          setSelectedIds(Object.keys(currentSection.formation.dancerPositions));
        }}
        onDistribute={(distribution) => {
          dispatch({
            type: "SET_STATE",
            newState: distributePositions(history.presentState.state, currentSection.id, selectedObjects.dancers, distribution),
            currentSectionId: currentSection.id,
            commit: true,
          })
        }}
        onHorizontalAlign={(alignment) => {
          dispatch({
            type: "SET_STATE",
            newState: alignHorizontalPositions(history.presentState.state, currentSection.id, selectedObjects.dancers, alignment),
            currentSectionId: currentSection.id,
            commit: true,
          })
        }}
        onVerticalAlign={(alignment) => {
          dispatch({
            type: "SET_STATE",
            newState: alignVerticalPositions(history.presentState.state, currentSection.id, selectedObjects.dancers, alignment),
            currentSectionId: currentSection.id,
            commit: true,
          })
        }}
        showArrange={selectedIds.length === 0}
        showDeleteDancer={selectedObjects.dancers.length > 0}
        showSwapPosition={selectedObjects.dancers.length === 2 && selectedObjects.props.length === 0}
        onSwapPosition={onSwapPositions}
        onDeleteDancer={() => {
          dispatch({
            type: "SET_STATE",
            newState: removeDancers(history.presentState.state, selectedObjects.dancers.map(x => x.dancerId)),
            currentSectionId: currentSection.id,
            commit: true,
          });
          setSelectedIds([]);
        }}
        onOpenActionManager={() => setEditDancerActionsDialogOpen(true)}
        onAssignActions={() => {
          setSelectedIds([]);
          setCurrentAction(undefined);
          setCurrentTiming(undefined);
          setIsAssigningActions(prev => !prev);
        }}
        isAssigningActionsEnabled={currentSection.formation.dancerActions.length > 0}
        isAssigningActions={isAssigningActions}
        onRenameSection={() => {
          setSelectedIds([]);
          setRenameSectionDialogOpen(true);
        }}
        onAddNoteToSection={() => {
          setSelectedIds([]);
          setAddNoteToSectionDialogOpen(true);
        }}
        onDuplicateSection={() => {
          setSelectedIds([]);
          dispatch({
            type: "SET_STATE",
            newState: duplicateSection(history.presentState.state, currentSection, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id))),
            currentSectionId: currentSection.id,
            commit: true,
          });
        }}
        canDeleteSection={history.presentState.state.sections.length > 1}
        onDeleteSection={() => {
          setSelectedIds([]);
          setDeleteSectionDialogOpen(true)
        }}
      />
      {
        isAddingDancers &&
        <div className="absolute items-center w-max rounded-md flex gap-2 p-2 top-20 left-1/2 translate-x-[-50%] bg-white border-2 border-primary">
          <span>
            グリッドを押してダンサーを追加する
          </span>
          <IconButton
            src={ICON.clear}
            size="sm"
            onClick={() => {setIsAddingDancers(false);}}/>
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
              setSelectedIds([]);
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
          onSave={(geometry) => {
            dispatch({
              type: "SET_STATE",
              newState: changeStageGeometry(history.presentState.state, geometry),
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
          onSubmit={(name, event) => {
            dispatch({
              type: "SET_STATE",
              newState: editChoreoInfo(history.presentState.state, name, event),
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
        <EditDancerNameDialog
          dancer={history.presentState.state.dancers[selectedIds[0]]}
          onSubmit={(name) => {
            dispatch({
              type: "SET_STATE",
              newState: renameDancer(history.presentState.state, selectedIds[0], name),
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
          dancerIds={selectedIds}
          onSubmit={(color, mode) => {
            if (!isNullOrUndefinedOrBlank(color)) {
              switch (mode) {
                case "current":
                  dispatch({
                    type: "SET_STATE",
                    newState: changeDancerColorCurrent(history.presentState.state, currentSection.id, selectedIds, color),
                    currentSectionId: currentSection.id,
                    commit: true});
                  break;
                case "currentAndAfter":
                  dispatch({
                    type: "SET_STATE",
                    newState: changeDancerColorCurrentAndFuture(history.presentState.state, history.presentState.state.sections.findIndex(x => strEquals(x.id, currentSection.id)), selectedIds, color),
                    currentSectionId: currentSection.id,
                    commit: true});
                  break;
                case "all":
                  dispatch({
                    type: "SET_STATE",
                    newState: changeDancerColorAll(history.presentState.state, selectedIds, color),
                    currentSectionId: currentSection.id,
                    commit: true});
                  break;
              }
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
      handle={renameSectionDialog}
      open={renameSectionDialogOpen}
      onOpenChange={handleRenameSectionDialogOpen}
      >
      <EditSectionNameDialog
        section={currentSection}
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
          setRenameSectionDialogOpen(false);
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
    </div>
  )
}