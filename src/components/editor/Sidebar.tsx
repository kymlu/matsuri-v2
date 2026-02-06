import { Dialog } from "@base-ui/react";
import Divider from "../basic/Divider";
import { IconLabelButton } from "../basic/Button";
import { AppSetting } from "../../models/appSettings";
import CustomSwitch from "../inputs/CustomSwitch";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

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
    <Dialog.Popup className="fixed w-4/5 h-full bg-white overflow-hidden right-0 z-30 top-0 min-w-64 max-w-[calc(100vw-3rem)]bg-gray-50 p-6 text-gray-900">
      <div className="flex flex-col h-full min-h-0 gap-2 overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr),auto] items-center max-w-full min-w-0 gap-2">
          <div className="flex flex-col min-w-0">
            <span className="max-w-full text-lg font-bold break-all text-wrap">
              {props.choreoName}
            </span>
            <span className="text-gray-400">
              {isNullOrUndefinedOrBlank(props.choreoEvent) ? "イベント不明" : props.choreoEvent}
            </span>
          </div>
          <div>
            <IconButton
              noBorder
              src={ICON.edit}
              size="sm"
              onClick={props.editName}
            />
          </div>
        </div>
        <Divider/>
        {
          props.editSize &&
          <>
            <IconLabelButton
              onClick={props.editSize}
              label="舞台サイズを変更"
              full icon={ICON.resize}/>
          </>
        }
        {/* {
          props.manageSections &&
          <Button onClick={props.manageSections}>セクション編集</Button>
        } */}
        {
          props.export &&
          <>
            <IconLabelButton
              onClick={props.export}
              label="エクスポート"
              full icon={ICON.fileExport}/>
          </>
        }
        <Divider/>
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
          <CustomSwitch label="大きいダンサー" defaultChecked={props.appSettings.dancerDisplayType === "large"} onChange={props.changeDancerSize}/>
        }
      </div>
    </Dialog.Popup>
  </Dialog.Portal>
}