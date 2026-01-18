import { ICON } from "../../lib/consts/consts";
import { ChoreoSection } from "../../models/choreoSection";
import IconButton from "../basic/IconButton";

export default function Header (props: {
  returnHome: () => void,
  openSettings: () => void,
  currentSection: ChoreoSection,
}
) {
  return <header className="absolute top-0 z-10 flex items-center justify-between w-screen px-2 py-4 bg-gradient-to-b from-white to-transparent ">
    <IconButton
      src={ICON.chevronBackwardBlack}
      alt="Return home"
      noBorder
      onClick={props.returnHome}/>
    <div className="font-semibold">{props.currentSection.name}</div>
    <IconButton
      src={ICON.settingsBlack}
      alt="Settings"
      noBorder
      onClick={props.openSettings}/>
  </header>
}