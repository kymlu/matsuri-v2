import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useEffect, useReducer, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { Choreo } from "../models/choreo";
import { EditHistory } from "../models/history";
import { addSection, duplicateSection, editSectionNote, removeSection, renameSection } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection, SelectedObjectStats } from "../models/choreoSection";
import { isNullOrUndefinedOrBlank, strEquals } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { changeDancerColorAll, changeDancerColorCurrent, changeDancerColorCurrentAndFuture, moveDancerPositions, moveDancerPositionsDelta } from "../lib/editor/commands/dancerPositionCommands";
import ObjectToolbar from "../components/editor/ObjectToolbar";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportToMtr } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";
import { addDancer, renameDancer } from "../lib/editor/commands/dancerCommands";
import IconButton from "../components/basic/IconButton";
import { ICON } from "../lib/consts/consts";
import { AppSetting } from "../models/appSettings";
import { changeStageGeometry, editChoreoInfo } from "../lib/editor/commands/choreoCommands";
import EditChoreoInfoDialog from "../components/dialogs/EditChoreoInfoDialog";
import EditDancerNameDialog from "../components/dialogs/EditDancerNameDialog";
import EditDancerColourDialog from "../components/dialogs/EditDancerColourDialog";

const resizeDialog = Dialog.createHandle<Choreo>();
const editChoreoInfoDialog = Dialog.createHandle<string>();
const renameDancerDialog = Dialog.createHandle<string>();
const editDancerColourDialog = Dialog.createHandle<string>();

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedObjectStats, setSelectedObjectStats] = useState<SelectedObjectStats>({dancerCount: 0, propCount: 0});
  const [isAddingDancers, setIsAddingDancers] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    dancerDisplayType: "small",
  });

  useEffect(() => {
    if (selectedIds.length > 0) setIsAddingDancers(false);

    setSelectedObjectStats({
      dancerCount: selectedIds.filter(id => props.currentChoreo.dancers[id]).length,
      propCount: selectedIds.filter(id => props.currentChoreo.props[id]).length,
    });
  }, [selectedIds]);
  
  const [history, dispatch] = useReducer(historyReducer,
    {
      undoStack: [],
      presentState: {state: props.currentChoreo, currentSectionId: props.currentChoreo.sections[0].id},
      redoStack: [],
    } as EditHistory<Choreo>);

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
        e.preventDefault();
        // UNDO
        dispatch({ type: "UNDO" });
      }

      if (e.key === "y") {
        e.preventDefault();
        // REDO
        dispatch({ type: "REDO" });
      }

      if (e.key === "s") {
        e.preventDefault();
        // SAVE
        onSave();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSave = () => {
    console.log("Saving state to db: ", history.presentState.state);
    saveChoreo(history.presentState.state, () => {});
  }

  // dialogs
  const [resizeDialogOpen, setResizeDialogOpen] = useState(false);
  const [editChoreoInfoDialogOpen, setEditChoreoInfoDialogOpen] = useState(false);
  const [renameDancerDialogOpen, setRenameDancerDialogOpen] = useState(false);
  const [editDancerColourDialogOpen, setEditDancerColourDialogOpen] = useState(false);
  
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

  return (
    <div className='flex flex-col justify-between w-full h-screen max-h-screen'>
      <div className="relative flex-1">
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
        <MainStage
          canEdit
          appSettings={appSettings}
          isAddingDancer={isAddingDancers}
          currentChoreo={history.presentState.state}
          currentSection={currentSection}
          updateDancerPosition={(x, y, dancerId) => {
            dispatch({
              type: "SET_STATE",
              newState: moveDancerPositions(history.presentState.state, currentSection.id, [dancerId], x, y),
              currentSectionId: currentSection.id,
              commit: true});
          }}
          updateDancerPositions={(dx, dy) => {
            dispatch({
              type: "SET_STATE",
              newState: moveDancerPositionsDelta(history.presentState.state, currentSection.id, selectedIds, dx, dy),
              currentSectionId: currentSection.id,
              commit: true});
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
        <div className="absolute bottom-0 z-10">
          <ObjectToolbar
            openArrangeMenu={() => {console.log("TODO")}}
            isArrangeVisible={(selectedObjectStats.dancerCount + selectedObjectStats.propCount) > 1}
            openColorMenu={() => {setEditDancerColourDialogOpen(true)}}
            isColorVisible={selectedObjectStats.dancerCount > 0 && selectedObjectStats.propCount === 0}
            swapPositions={() => {console.log("TODO")}}
            isSwapVisible={selectedObjectStats.dancerCount === 2 && selectedObjectStats.propCount === 0}
            openRenameMenu={() => {setRenameDancerDialogOpen(true)}}
            isRenameVisible={selectedObjectStats.dancerCount === 1 && selectedObjectStats.propCount === 0}
          />
          <UndoRedoToolbar
            undo={() => {dispatch({type: "UNDO"})}}
            redo={() => {dispatch({type: "REDO"})}}
            undoCount={history.undoStack.length}
            redoCount={history.redoStack.length}/>
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
            onRename={(section, name) => {
              setSelectedIds([]);
              dispatch({
                type: "SET_STATE",
                newState: renameSection(history.presentState.state, section.id, name),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
            onAddNoteToSection={(section, note) => {
              setSelectedIds([]);
              dispatch({
                type: "SET_STATE",
                newState: editSectionNote(history.presentState.state, section.id, note),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
            onDuplicate={(section, index) => {
              setSelectedIds([]);
              dispatch({
                type: "SET_STATE",
                newState: duplicateSection(history.presentState.state, section, index),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
            onDeleteSection={(section) => {
              setSelectedIds([]);
              dispatch({
                type: "SET_STATE",
                newState: removeSection(history.presentState.state, section.id),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
          />
        </div>
      </div>
      <Toolbar
        onAddDancer={() => {
          setSelectedIds([]);
          setIsAddingDancers(true);
        }}
      />
      {
        isAddingDancers &&
        <div className="absolute items-center w-max rounded-md flex gap-2 p-2 top-20 left-1/2 translate-x-[-50%] bg-white border border-primary">
          <span>
            グリッドを押して踊り子を追加する
          </span>
          <IconButton
            src={ICON.clearBlack}
            alt="Stop adding dancers"
            size="sm"
            onClick={() => {setIsAddingDancers(false);}}/>
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
          colours={Object.values(currentSection.formation.dancerPositions).map(x => x.color)}
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
    </div>
  )
}