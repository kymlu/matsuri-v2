import { Dialog } from "@base-ui/react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import EditChoreoMetaDialog from "../dialogs/EditChoreoMetaDialog";
import { Choreo } from "../../models/choreo";

export default function Header (props: {
  returnHome: () => void,
  openSettings: () => void,
  currentChoreo: Choreo,
}
) {
  return <header className="absolute top-0 z-10 flex items-center justify-between w-screen px-2 py-4 bg-gradient-to-b from-white to-transparent ">
    <IconButton
      src={ICON.chevronBackwardBlack}
      alt="Return home"
      noBorder
      onClick={props.returnHome}/>
    <div className="font-semibold">{props.currentChoreo.name}</div>
    <Dialog.Root>
      <Dialog.Trigger>
        <IconButton
          src={ICON.settingsBlack}
          alt="Settings"
          noBorder
          onClick={props.openSettings}
          asDiv/>
      </Dialog.Trigger>
      <EditChoreoMetaDialog currentChoreo={props.currentChoreo}/>
    </Dialog.Root>
  </header>
}