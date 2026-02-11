import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useEffect, useState } from "react";
import { Choreo } from "../models/choreo";
import { ChoreoSection } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";
import { AppSetting } from "../models/appSettings";
import { strEquals } from "../lib/helpers/globalHelper";
import ViewerSidebar from "../components/editor/ViewerSidebar";
import { StageEntities } from "../models/history";
import { DancerPosition } from "../models/dancer";
import { PropPosition } from "../models/prop";
import ExportDialog from "../components/dialogs/ExportDialog";
import { Dialog } from "@base-ui/react";

export default function ChoreoViewPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [nextSection, setNextSection] = useState<ChoreoSection | undefined>();
  const [showNotes, setShowNotes] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: []});
  const [selectedTimingId, setSelectedTimingId] = useState<string | undefined>();
  const [selectedObjects, setSelectedObjects] = useState<StageEntities<PropPosition[], DancerPosition[]>>({dancers: [], props: []});
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    showPreviousSection: false,
    dancerDisplayType: "large",
  });
  
  useEffect(() => {
    setSelectedObjects({
      dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]),
      props: Object.entries(currentSection.formation.propPositions).filter(x => selectedIds.props.includes(x[0])).map(x => x[1]),
    });
  }, [selectedIds]);

  useEffect(() => {
    var currentSectionIndex = props.currentChoreo.sections.findIndex(x => strEquals(x.id, currentSection.id));
    setNextSection(props.currentChoreo.sections[currentSectionIndex + 1]);
  }, [currentSection]);

  const resetSelectedIds = () => setSelectedIds({props: [], dancers: []});

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const exportDialog = Dialog.createHandle<{}>();
  const handleExportDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setExportDialogOpen(isOpen);
  };

  return (
    <div className='flex flex-col h-[100svh] max-h-[100svh] overflow-hidden'>
      <Header
        returnHome={props.goToHomePage}
        currentChoreo={props.currentChoreo}
        onDownload={() => {setExportDialogOpen(true)}}
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
          dancer={props.currentChoreo.dancers[selectedIds.dancers[0]]}
          position={currentSection.formation.dancerPositions[selectedIds.dancers[0]]}
          nextPosition={nextSection?.formation.dancerPositions[selectedIds.dancers[0]]}
          geometry={props.currentChoreo.stageGeometry}
          isPositionHintShown={
            selectedIds.dancers.length === 1 &&
            selectedTimingId === undefined &&
            selectedObjects.dancers.length === 1 &&
            selectedObjects.props.length === 0 &&
            props.currentChoreo.dancers[selectedIds.dancers[0]] !== undefined
          }
          deselectPosition={resetSelectedIds}
          hideNotes={() => setShowNotes(false)}
          onSelectTiming={(timing) => {
            if (timing) {
              setSelectedIds({props: [], dancers: timing.dancerIds});
              setSelectedTimingId(timing.id);
            } else {
              resetSelectedIds();
              setSelectedTimingId(undefined);
            }
          }}
          selectedTiming={selectedTimingId}
        />
        <MainStage
          appSettings={appSettings}
          canEdit={false}
          canSelectProps={false}
          hideTransformerBorder
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
              resetSelectedIds();
            }
            setCurrentSection(section);
          }}
        />
      </footer>
      
      <Dialog.Root
        handle={exportDialog}
        open={exportDialogOpen}
        onOpenChange={handleExportDialogOpen}
      >
        {
          exportDialogOpen &&
          <ExportDialog
            choreo={props.currentChoreo}
            selectedId={selectedIds.dancers.length === 1 ? selectedIds.dancers[0] : ""}
            onClose={() => setExportDialogOpen(false)}
          />
        }
      </Dialog.Root>
    </div>
  )
}