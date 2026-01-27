import { Dialog } from "@base-ui/react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { Choreo } from "../../models/choreo";
import { Sidebar } from "./Sidebar";
import { AppSetting } from "../../models/appSettings";

export default function Header (props: {
  returnHome: () => void,
  hasSidebar?: boolean,
  currentChoreo: Choreo,
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
  return <header className="absolute top-0 z-10 flex items-center justify-between w-screen px-2 py-4 bg-gradient-to-b from-white to-transparent ">
    <IconButton
      src={ICON.chevronBackwardBlack}
      alt="Return home" // if there is a history, verify save first?
      noBorder
      onClick={() => {
        props.onSave?.();
        props.returnHome();
      }}/>
    <div className="font-semibold">{props.currentChoreo.name}</div>
    <div className="flex gap-2">
      {
        props.onSave &&
        <IconButton
          src={ICON.saveBlack}
          alt="Save"
          noBorder
          onClick={() => {props.onSave?.()}}/>
      }
      {
        props.onDownload &&
        <IconButton
          src={ICON.downloadBlack}
          alt="Download"
          noBorder
          onClick={() => {props.onDownload?.()}}/>
      }
      {
        props.hasSidebar &&
        <Dialog.Root>
          <Dialog.Trigger>
            <IconButton
              src={ICON.settingsBlack}
              alt="Settings"
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