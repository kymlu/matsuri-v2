import { Dialog } from "@base-ui/react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { Choreo } from "../../models/choreo";
import { Sidebar } from "./Sidebar";
import { AppSetting } from "../../models/appSettings";
import { downloadLogs } from "../../lib/helpers/logHelper";

type HeaderProps = {
  returnHome: () => void;
  hasSidebar?: boolean;
  currentChoreo: Choreo;
  onToggleNotes?: () => void;
  showNotes?: boolean;
  onSave?: () => void;
  onDownload?: () => void;
  editName?: () => void;
  editSize?: () => void;
  manageDancers?: () => void;
  manageSections?: () => void;
  exportChoreo?: () => void;
  changeSnap?: () => void;
  changeShowGrid?: () => void;
  changeShowPrevious?: () => void;
  changeDancerSize?: (showLarge: boolean) => void;
  appSettings: AppSetting;
};

export default function Header({
  returnHome,
  hasSidebar = false,
  currentChoreo,
  onToggleNotes,
  showNotes = false,
  onSave,
  onDownload,
  editName,
  editSize,
  manageDancers,
  manageSections,
  exportChoreo,
  changeSnap,
  changeShowGrid,
  changeShowPrevious,
  changeDancerSize,
  appSettings,
}: HeaderProps) {
  return <header className="z-10 grid grid-cols-[1fr,auto,1fr] items-center justify-between w-screen border-b-2 select-none bg-gradient-to-b from-white to-transparent ">
    <div className="flex">
      <IconButton
        src={ICON.chevronBackward} // if there is a history, verify save first?
        noBorder
        onClick={() => {
          onSave?.();
          returnHome();
        }}/>
    </div>
    <div
      className="font-semibold truncate"
      onDoubleClick={downloadLogs}>
      {currentChoreo.name}
    </div>
    <div className="flex justify-end">
      {
        onToggleNotes &&
        <IconButton
          src={showNotes ? ICON.speakerNotesOff : ICON.speakerNotes}
          noBorder
          onClick={() => {onToggleNotes?.()}}
          />
      }
      {
        onDownload &&
        <IconButton
          src={ICON.download}
          noBorder
          onClick={() => {onDownload?.()}}/>
      }
      {
        hasSidebar &&
        <Dialog.Root>
          <Dialog.Trigger>
            <IconButton
              src={ICON.settings}
              noBorder
              asDiv/>
          </Dialog.Trigger>
          <Sidebar
            choreoName={currentChoreo.name}
            choreoEvent={currentChoreo.event}
            editName={editName}
            editSize={editSize}
            manageDancers={manageDancers}
            manageSections={manageSections}
            exportChoreo={exportChoreo}
            changeSnap={changeSnap}
            changeShowGrid={changeShowGrid}
            changeDancerSize={changeDancerSize}
            appSettings={appSettings}
            changeShowPrevious={changeShowPrevious}
          />
          {/* todo: add functions to the sidebar */}
        </Dialog.Root>
      }
    </div>
  </header>
}