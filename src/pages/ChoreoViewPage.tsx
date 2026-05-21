import Header from "../components/editor/Header"
import FormationSelectionToolbar from "../components/editor/FormationSelectionToolbar";
import { useEffect, useState } from "react";
import { Choreo } from "../models/choreo";
import { ChoreoSection } from "../models/choreoSection";
import MainStage from "../components/grid/MainStage";
import { AppSetting } from "../models/appSettings";
import { isNullOrUndefinedOrBlank, strEquals } from "../lib/helpers/globalHelper";
import ViewerSidebar from "../components/editor/ViewerSidebar";
import { StageEntities } from "../models/history";
import { DancerPosition } from "../models/dancer";
import { PropPosition } from "../models/prop";
import ExportDialog from "../components/dialogs/ExportDialog";
import { Dialog } from "@base-ui/react";
import { exportChoreo } from "../lib/helpers/exportHelper";
import InstructionMessage from "../components/basic/InstructionMessage";

export default function ChoreoViewPage(props: {
  goToHomePage: () => void
  currentChoreo: Choreo,
  goToEditPage: () => void,
  userName: string | null,
}) {
  const [currentSection, setCurrentSection] = useState<ChoreoSection>(props.currentChoreo.sections[0]);
  const [nextSection, setNextSection] = useState<ChoreoSection | undefined>();
  const [selectedIds, setSelectedIds] = useState<StageEntities<string[]>>({props: [], dancers: [], obstacles: []});
  const [selectedTimingId, setSelectedTimingId] = useState<string | undefined>();
  const [selectedObjects, setSelectedObjects] = useState<StageEntities<PropPosition[], DancerPosition[]>>({dancers: [], props: [], obstacles: []});
  const [showPaths, setShowPaths] = useState<boolean>(true);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [hintManuallyClosed, setHintManuallyClosed] = useState<boolean>(false);
  const [appSettings, setAppSettings] = useState<AppSetting>({
    snapToGrid: true,
    showGrid: true,
    showPreviousSection: false,
    dancerDisplayType: "large",
  });

  useEffect(() => {
    setHintManuallyClosed(false);
    if (!isNullOrUndefinedOrBlank(props.userName)) {
      const dancer = Object.values(props.currentChoreo.dancers).find(x => strEquals(x.name, props.userName));
      if (dancer) {
        setSelectedIds({dancers: [dancer.id], props: [], obstacles: []});
        setShowHint(false);
      } else {
        resetSelectedIds();
        setShowHint(true);
      }
    }
  }, [props.currentChoreo, props.userName]);
  
  useEffect(() => {
    setSelectedObjects({
      dancers: Object.entries(currentSection.formation.dancerPositions).filter(x => selectedIds.dancers.includes(x[0])).map(x => x[1]),
      props: [],
      obstacles: []
    });
  }, [selectedIds]);

  useEffect(() => {
    var currentSectionIndex = props.currentChoreo.sections.findIndex(x => strEquals(x.id, currentSection.id));
    setNextSection(props.currentChoreo.sections[currentSectionIndex + 1]);
  }, [currentSection]);

  const resetSelectedIds = () => setSelectedIds({props: [], dancers: [], obstacles: []});

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
        exportChoreo={() => exportChoreo(props.currentChoreo)}
        changeShowGrid={() => {
          setAppSettings(prev => {return {...prev, showGrid: !prev.showGrid}})
        }}
        appSettings={appSettings}
        goToEdit={props.goToEditPage}
        toggleShowPath={() => setShowPaths(prev => !prev)}
        showPath={showPaths}
        isShowPathBtnDisabled={selectedIds.dancers.length !== 1 || selectedTimingId !== undefined}
        />
      <div className="relative flex-1 overflow-hidden border-b-2 md:flex">
        <ViewerSidebar
          actions={currentSection.formation.dancerActions}
          note={currentSection.note}
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
          deselectPosition={() => {
            resetSelectedIds();
            if (!hintManuallyClosed) {
              setShowHint(true);
            }
          }}
          onSelectTiming={(timing) => {
            if (timing) {
              setSelectedIds({props: [], dancers: timing.dancerIds, obstacles: []});
              setSelectedTimingId(timing.id);
            } else {
              resetSelectedIds();
              setSelectedTimingId(undefined);
            }
          }}
          selectedTiming={selectedTimingId}
          formationSelectionToolbar={
            <FormationSelectionToolbar
              currentSectionId={currentSection.id}
              sections={props.currentChoreo.sections}
              onChangeSection={(section) => {
                if (selectedTimingId) {
                  setSelectedTimingId(undefined);
                  resetSelectedIds();
                }
                setCurrentSection(section);
              }}
            />
          }
        />
        <MainStage
          appSettings={appSettings}
          canEdit={false}
          canSelectProps={false}
          canSelectObstacles={false}
          hideTransformerBorder
          canSelectDancers
          canToggleSelection={false}
          currentChoreo={props.currentChoreo}
          currentSection={currentSection}
          selectedIds={selectedIds}
          setSelectedIds={(action) => {
            setSelectedIds(action);
            setSelectedTimingId(undefined);
          }}
          selectedDancerMovement={
            showPaths && selectedIds.dancers.length === 1 && !selectedTimingId && nextSection ?
            {
              current: currentSection.formation.dancerPositions[selectedIds.dancers[0]],
              next: nextSection.formation.dancerPositions[selectedIds.dancers[0]]
             } :
            undefined
          }
          onDancerSelected={() => {
            if (showHint) setShowHint(false);
          }}
        />
      </div>

      {
        showHint &&
        <InstructionMessage
          instruction={<div className="text-center"><span>名前をタップすると、</span><br/><span>位置情報が表示されます。</span></div>}
          onClose={() => {
            setShowHint(false);
            setHintManuallyClosed(true);
          }}/>
      }
      
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
            showPaths={showPaths}
          />
        }
      </Dialog.Root>
    </div>
  )
}