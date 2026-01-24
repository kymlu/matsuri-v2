import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useEffect, useReducer, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { Choreo } from "../models/choreo";
import { EditHistory } from "../models/history";
import { addSection, editSectionNote, removeSection, renameSection } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection, SelectedObjectStats } from "../models/choreoSection";
import { strEquals } from "../lib/helpers/globalHelper";
import MainStage from "../components/grid/MainStage";
import { moveDancerPositions, moveDancerPositionsDelta } from "../lib/editor/commands/dancerPositionCommands";
import ObjectToolbar from "../components/editor/ObjectToolbar";
import { Dialog } from "@base-ui/react";
import EditChoreoSizeDialog from "../components/dialogs/EditChoreoSizeDialog";
import { exportToMtr } from "../lib/helpers/exportHelper";
import { saveChoreo } from "../lib/dataAccess/DataController";

const resizeDialog = Dialog.createHandle<ChoreoSection>();

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedObjectStats, setSelectedObjectStats] = useState<SelectedObjectStats>({dancerCount: 0, propCount: 0});

  useEffect(() => {
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
  
  const handleResizeDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setResizeDialogOpen(isOpen);
  };

  return (
    <div className='flex flex-col justify-between w-full h-screen max-h-screen'>
      <div className="relative flex-1">
        <Header
          returnHome={props.goToHomePage}
          hasSidebar
          currentChoreo={props.currentChoreo}
          onSave={() => {onSave()}}
          editName={() => {console.log("TODO: implement")}}
          manageSections={() => {console.log("TODO: implement Manage Sections")}}
          editSize={() => {setResizeDialogOpen(true);}}
          export={() => {
            console.log("TODO: implement choice of pdf or mtr");
            exportToMtr(history.presentState.state);
          }}
          />
        <MainStage
          canEdit
          currentChoreo={history.presentState.state}
          currentSection={currentSection}
          updateDancerPosition={(x, y, dancerId) => {
            dispatch({
              type: "SET_STATE",
              newState: moveDancerPositions(history.presentState.state, currentSection.id, [dancerId], x, y),
              currentSectionId: currentSection.id,
              commit: true})
          }}
          updateDancerPositions={(dx, dy) => {
            dispatch({
              type: "SET_STATE",
              newState: moveDancerPositionsDelta(history.presentState.state, currentSection.id, selectedIds, dx, dy),
              currentSectionId: currentSection.id,
              commit: true})
          }}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
          />
        <div className="absolute bottom-0 z-10">
          <ObjectToolbar
            openArrangeMenu={() => {console.log("TODO")}}
            isArrangeVisible={(selectedObjectStats.dancerCount + selectedObjectStats.propCount) > 1}
            openColorMenu={() => {console.log("TODO")}}
            isColorVisible={selectedObjectStats.dancerCount > 0 && selectedObjectStats.propCount === 0}
            swapPositions={() => {console.log("TODO")}}
            isSwapVisible={selectedObjectStats.dancerCount === 2 && selectedObjectStats.propCount === 0}
            openRenameMenu={() => {console.log("TODO")}}
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
      <Toolbar/>
      <Dialog.Root
        handle={resizeDialog}
        open={resizeDialogOpen}
        onOpenChange={handleResizeDialogOpen}>
        <EditChoreoSizeDialog
          currentChoreo={history.presentState.state}
          onSave={() => {
            console.log("TODO: implement save");
            resizeDialog.close();
            setResizeDialogOpen(false);
          }}/>
      </Dialog.Root>
    </div>
  )
}