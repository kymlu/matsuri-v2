import Header from "../components/editor/Header"
import PositionHint from "../components/editor/PositionHint";
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useState } from "react";
import { Choreo } from "../models/choreo";
import { ChoreoSection } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";

export default function ChoreoEditPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);

  return (
    <div className='flex flex-col justify-between w-full h-screen max-h-screen'>
      <Header
        returnHome={props.goToHomePage}
        openSettings={() => {console.log("TODO: implement");}}
        currentSection={currentSection}/>
      <div className="flex-1">
        <MainStage/>
      </div>
      <FormationSelectionToolbar
        currentSectionId={currentSection.id}
        sections={props.currentChoreo.sections}
        onClickSection={(section) => {
          setCurrentSection(section);
        }}
      />
      <PositionHint/>
    </div>
  )
}