import { Dialog } from "@base-ui/react";
import Divider from "../basic/Divider";
import Button from "../basic/Button";
import { AppSetting } from "../../models/appSettings";
import CustomSwitch from "../inputs/CustomSwitch";

export function Sidebar (props: {
  choreoName: string
  choreoEvent?: string,
  editName?: () => void,
  editSize?: () => void,
  manageSections?: () => void,
  changeSnap?: () => void,
  changeShowGrid?: () => void,
  changeDancerSize?: (showLarge: boolean) => void,
  export?: () => void,
  appSettings: AppSetting,
}) {
  return <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 bg-black transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 opacity-20 z-20" />
    <Dialog.Popup className="fixed w-4/5 h-full bg-white overflow-hidden right-0 z-30 top-0 min-w-64 max-w-[calc(100vw-3rem)]bg-gray-50 p-6 text-gray-900 transition-all duration-150 data-[ending-style]:scale-90 data-[ending-style]:opacity-0 data-[starting-style]:scale-90 data-[starting-style]:opacity-0">
      <div className="flex flex-col h-full min-h-0 overflow-y-auto">
        <span className="text-lg font-bold">
          {props.choreoName}
        </span>
        {
          props.choreoEvent &&
          <span className="font-light">
            {props.choreoEvent}
          </span>
        }
        <Divider/>
        {
          props.editName &&
          <>
            <Button onClick={props.editName}>Edit Name</Button>
            <Divider/>
          </>
        }
        {
          props.editSize &&
          <>
            <Button onClick={props.editSize}>Edit Size</Button>
            <Divider/>
          </>
        }
        {
          props.manageSections &&
          <Button onClick={props.manageSections}>Manage Sections</Button>
        }
        {
          props.changeSnap &&
          <CustomSwitch label="グリッドにスナップ" defaultChecked={props.appSettings.snapToGrid} onChange={props.changeSnap}/>
        }
        {
          props.changeShowGrid &&
          <CustomSwitch label="グリッド表示" defaultChecked={props.appSettings.showGrid} onChange={props.changeShowGrid}/>
        }
        {
          props.changeDancerSize &&
          <CustomSwitch label="踊り子大きい" defaultChecked={props.appSettings.dancerDisplayType === "large"} onChange={props.changeDancerSize}/>
        }
        {
          props.export &&
          <Button onClick={props.export}>Export</Button>
        }
      </div>
    </Dialog.Popup>
  </Dialog.Portal>
}