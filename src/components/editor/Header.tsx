import { Dialog } from "@base-ui/react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { Choreo } from "../../models/choreo";
import { Sidebar } from "./Sidebar";
import { AppSetting } from "../../models/appSettings";
import { downloadLogs } from "../../lib/helpers/logHelper";

export default function Header (props: {
  returnHome: () => void,
  hasSidebar?: boolean,
  currentChoreo: Choreo,
  onToggleNotes?: () => void,
  showNotes?: boolean,
  onSave?: () => void,
  onDownload?: () => void,
  editName?: () => void,
  editSize?: () => void,
  manageSections?: () => void,
  export?: () => void,
  changeSnap?: () => void,
  changeShowGrid?: () => void,
  changeDancerSize?: (showLarge: boolean) => void,
  appSettings: AppSetting,
}) {
  return <header className="z-10 grid grid-cols-[1fr,auto,1fr] items-center justify-between w-screen p-2 border-b-2 select-none bg-gradient-to-b from-white to-transparent ">
    <div className="flex">
      <IconButton
        src={ICON.chevronBackward} // if there is a history, verify save first?
        noBorder
        onClick={() => {
          props.onSave?.();
          props.returnHome();
        }}/>
    </div>
    <div className="font-semibold" onDoubleClick={downloadLogs}>{props.currentChoreo.name}</div>
    <div className="flex justify-end">
      {
        props.onToggleNotes &&
        <IconButton
          src={props.showNotes ? ICON.speakerNotesOff : ICON.speakerNotes}
          noBorder
          onClick={() => {props.onToggleNotes?.()}}
          />
      }
      {
        props.onSave &&
        <IconButton
          src={ICON.save}
          noBorder
          onClick={() => {props.onSave?.()}}/>
      }
      {
        props.onDownload &&
        <IconButton
          src={ICON.download}
          noBorder
          onClick={() => {props.onDownload?.()}}/>
      }
      {
        props.hasSidebar &&
        <Dialog.Root>
          <Dialog.Trigger>
            <IconButton
              src={ICON.settings}
              noBorder
              asDiv/>
          </Dialog.Trigger>
          <Sidebar
            choreoName={props.currentChoreo.name}
            choreoEvent={props.currentChoreo.event}
            editName={props.editName}
            editSize={props.editSize}
            manageSections={props.manageSections}
            export={props.export}
            changeSnap={props.changeSnap}
            changeShowGrid={props.changeShowGrid}
            changeDancerSize={props.changeDancerSize}
            appSettings={props.appSettings}
          />
          {/* todo: add functions to the sidebar */}
        </Dialog.Root>
      }
    </div>
  </header>
}