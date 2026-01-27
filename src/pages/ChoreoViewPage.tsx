import Header from "../components/editor/Header"
import PositionHint from "../components/editor/PositionHint";
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useEffect, useState } from "react";
import { Choreo } from "../models/choreo";
import { ChoreoSection, SelectedObjectStats } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";
import { AppSetting } from "../models/appSettings";

export default function ChoreoEditPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedObjectStats, setSelectedObjectStats] = useState<SelectedObjectStats>({dancerCount: 0, propCount: 0});
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    dancerDisplayType: "large",
  });
  
  useEffect(() => {
    setSelectedObjectStats({
      dancerCount: selectedIds.filter(id => props.currentChoreo.dancers[id]).length,
      propCount: selectedIds.filter(id => props.currentChoreo.props[id]).length,
    });
  }, [selectedIds]);

  return (
    <div className='flex flex-col justify-between w-full h-screen max-h-screen'>
      <Header
        returnHome={props.goToHomePage}
        currentChoreo={props.currentChoreo}
        onDownload={() => {console.log("TODO: implement download")}}
        changeShowGrid={() => {
          setAppSettings(prev => {return {...prev, showGrid: !prev.showGrid}})
        }}
        appSettings={appSettings}
        />
      <div className="flex-1">
        <MainStage
          appSettings={appSettings}
          canEdit={false}
          currentChoreo={props.currentChoreo}
          currentSection={currentSection}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
        <div className="absolute bottom-0 z-10">
          {
            selectedIds.length > 0 &&
            selectedObjectStats.dancerCount === 1 &&
            selectedObjectStats.propCount === 0 &&
            props.currentChoreo.dancers[selectedIds[0]] !== undefined &&
            <PositionHint
              dancer={props.currentChoreo.dancers[selectedIds[0]]}
              position={currentSection.formation.dancerPositions[selectedIds[0]]}
              nextSectionName="TODO"
              nextPosition={{dancerId: selectedIds[0], x: 5, y: 5, rotation: 0, sectionId: crypto.randomUUID(), color: ""}}
              geometry={props.currentChoreo.stageGeometry}
            />
          }
          <FormationSelectionToolbar
            currentSectionId={currentSection.id}
            sections={props.currentChoreo.sections}
            onClickSection={(section) => {
              setCurrentSection(section);
            }}
          />
        </div>
      </div>
    </div>
  )
}