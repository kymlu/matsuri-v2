import Toolbar from "../components/editor/Toolbar"
import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import UndoRedoToolbar from "../components/editor/UndoRedoToolbar";
import { useEffect, useReducer, useState } from "react";
import { historyReducer } from "../lib/editor/historyReducer";
import { Choreo } from "../models/choreo";
import { EditHistory } from "../models/history";
import { addSection, editSectionNote, removeSection, renameSection } from "../lib/editor/commands/sectionCommands";
import { ChoreoSection } from "../models/choreoSection";
import { strEquals } from "../lib/helpers/globalHelpers";
import MainStage from "../components/grid/MainStage";

export default function ChoreoEditPage(props: {
  goToHomePage: () => void,
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);

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
    } else if (!strEquals(newSection.id, currentSection.id) || !strEquals(newSection.name, currentSection.name)) {
      setCurrentSection(newSection);
    }
  }, [history.presentState]);

  return (
    <div className='flex flex-col justify-between w-full h-screen max-h-screen'>
      <div className="relative flex-1">
        <Header
          returnHome={props.goToHomePage}
          openSettings={() => {console.log("TODO: implement");}}
          currentSection={currentSection}/>
        <MainStage/>
        <div className="absolute bottom-0 z-10">
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
              dispatch({
                type: "SET_STATE",
                newState: addSection(history.presentState.state, id, newName),
                currentSectionId: id,
                commit: true})}}
            onClickSection={(section) => {
              setCurrentSection(section);
            }}
            onRename={(section, name) => {
              dispatch({
                type: "SET_STATE",
                newState: renameSection(history.presentState.state, section.id, name),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
            onAddNoteToSection={(section, note) => {
              dispatch({
                type: "SET_STATE",
                newState: editSectionNote(history.presentState.state, section.id, note),
                currentSectionId: currentSection.id,
                commit: true,
              });
            }}
            onDeleteSection={(section) => {
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
    </div>
  )
}