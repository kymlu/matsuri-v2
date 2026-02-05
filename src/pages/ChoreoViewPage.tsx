import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useEffect, useState } from "react";
import { Choreo } from "../models/choreo";
import { ChoreoSection, SelectedObjects } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";
import { AppSetting } from "../models/appSettings";
import { strEquals } from "../lib/helpers/globalHelper";
import ViewerSidebar from "../components/editor/ViewerSidebar";

export default function ChoreoViewPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [nextSection, setNextSection] = useState<ChoreoSection | undefined>();
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTimingId, setSelectedTimingId] = useState<string | undefined>();
  const [selectedObjects, setSelectedObjects] = useState<SelectedObjects>({dancers: [], props: []});
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    dancerDisplayType: "large",
  });
  
  useEffect(() => {
    setSelectedObjects({
      dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.includes(x[0])).map(x => x[1]),
      props: Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.includes(x[0])).map(x => x[1]),
    });
  }, [selectedIds]);

  useEffect(() => {
    var currentSectionIndex = props.currentChoreo.sections.findIndex(x => strEquals(x.id, currentSection.id));
    setNextSection(props.currentChoreo.sections[currentSectionIndex + 1]);
  }, [currentSection])

  return (
    <div className='flex flex-col h-screen max-h-screen overflow-hidden'>
      <Header
        returnHome={props.goToHomePage}
        currentChoreo={props.currentChoreo}
        // onDownload={() => {console.log("TODO: implement download")}}
        changeShowGrid={() => {
          setAppSettings(prev => {return {...prev, showGrid: !prev.showGrid}})
        }}
        appSettings={appSettings}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes(prev => !prev)}
        />
      <div className="relative flex-1 overflow-hidden border-b-2 md:flex">
        <ViewerSidebar
          actions={currentSection.formation.dancerActions}
          note={currentSection.note}
          showNotes={showNotes}
          dancer={props.currentChoreo.dancers[selectedIds[0]]}
          position={currentSection.formation.dancerPositions[selectedIds[0]]}
          nextSectionName={nextSection?.name}
          nextPosition={nextSection?.formation.dancerPositions[selectedIds[0]]}
          geometry={props.currentChoreo.stageGeometry}
          isPositionHintShown={
            selectedIds.length > 0 &&
            selectedTimingId === undefined &&
            selectedObjects.dancers.length === 1 &&
            selectedObjects.props.length === 0 &&
            props.currentChoreo.dancers[selectedIds[0]] !== undefined
          }
          deselectPosition={() => setSelectedIds([])}
          hideNotes={() => setShowNotes(false)}
          onSelectTiming={(timing) => {
            if (timing) {
              setSelectedIds(timing.dancerIds);
              setSelectedTimingId(timing.id);
            } else {
              setSelectedIds([]);
              setSelectedTimingId(undefined);
            }
          }}
          selectedTiming={selectedTimingId}
        />
        <MainStage
          appSettings={appSettings}
          canEdit={false}
          canSelectDancers={selectedTimingId === undefined}
          canToggleSelection={false}
          currentChoreo={props.currentChoreo}
          currentSection={currentSection}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>
      <footer
        className="pb-8"
        >
        <FormationSelectionToolbar
          currentSectionId={currentSection.id}
          sections={props.currentChoreo.sections}
          onClickSection={(section) => {
            if (selectedTimingId) {
              setSelectedTimingId(undefined);
              setSelectedIds([]);
            }
            setCurrentSection(section);
          }}
        />
      </footer>
    </div>
  )
}