import { Dialog } from "@base-ui/react";
import Divider from "../basic/Divider";
import { IconLabelButton } from "../basic/Button";
import { AppSetting } from "../../models/appSettings";
import CustomSwitch from "../inputs/CustomSwitch";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type SidebarProps = {
  choreoName: string;
  choreoEvent?: string;

  editName?: () => void;
  editSize?: () => void;
  showManageDancers?: boolean;
  manageDancers?: () => void;
  showManageProps?: boolean;
  manageProps?: () => void;
  manageSections?: () => void;
  exportChoreo?: () => void;
  
  changeSnap?: () => void;
  changeShowGrid?: () => void;
  changeShowPrevious?: () => void;
  changeDancerSize?: (showLarge: boolean) => void;
  
  appSettings: AppSetting;
};

export function Sidebar({
  choreoName,
  choreoEvent,
  editName,
  editSize,
  showManageDancers,
  manageDancers,
  showManageProps,
  manageProps,
  manageSections,
  changeSnap,
  changeShowGrid,
  changeDancerSize,
  changeShowPrevious,
  exportChoreo, // avoid keyword confusion
  appSettings,
}: SidebarProps) {
  return <Dialog.Portal>
    <Dialog.Backdrop className="fixed inset-0 bg-black transition-all duration-150 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 opacity-20 z-20" />
    <Dialog.Popup className="fixed w-4/5 h-full bg-white overflow-hidden right-0 z-30 top-0 min-w-64 max-w-[calc(100vw-3rem)]bg-gray-50 p-6 text-gray-900">
      <div className="flex flex-col h-full min-h-0 gap-2 overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr),auto] items-center max-w-full min-w-0 gap-2">
          <div className="flex flex-col min-w-0">
            <span className="max-w-full text-lg font-bold break-all text-wrap">
              {choreoName}
            </span>
            <span className="text-gray-400">
              {isNullOrUndefinedOrBlank(choreoEvent) ? "イベント不明" : choreoEvent}
            </span>
          </div>
          <div>
            <IconButton
              noBorder
              src={ICON.edit}
              size="sm"
              onClick={editName}
            />
          </div>
        </div>
        <Divider/>
        {
          editSize &&
          <>
            <IconLabelButton
              onClick={editSize}
              label="舞台サイズを変更"
              full icon={ICON.resize}/>
          </>
        }
        {
          showManageDancers && manageDancers &&
          <>
            <IconLabelButton
              onClick={manageDancers}
              label="ダンサー管理"
              full icon={ICON.person}/>
          </>
        }
        {
          showManageProps && manageProps &&
          <>
            <IconLabelButton
              onClick={manageProps}
              label="道具管理"
              full icon={ICON.flag}/>
          </>
        }
        {/* {
          manageSections &&
          <Button onClick={manageSections}>セクション編集</Button>
        } */}
        {
          exportChoreo &&
          <>
            <IconLabelButton
              onClick={exportChoreo}
              label="隊列表を書き出し (.mtr)"
              full icon={ICON.fileExport}/>
          </>
        }
        <Divider/>
        {
          changeSnap &&
          <CustomSwitch label="グリッドにスナップ" defaultChecked={appSettings.snapToGrid} onChange={changeSnap}/>
        }
        {
          changeShowGrid &&
          <CustomSwitch label="グリッド表示" defaultChecked={appSettings.showGrid} onChange={changeShowGrid}/>
        }
        {
          changeShowPrevious &&
          <CustomSwitch label="前のセクションを見る" defaultChecked={appSettings.showPreviousSection} onChange={changeShowPrevious}/>
        }
        {
          changeDancerSize &&
          <CustomSwitch label="大きいダンサー" defaultChecked={appSettings.dancerDisplayType === "large"} onChange={changeDancerSize}/>
        }
      </div>
    </Dialog.Popup>
  </Dialog.Portal>
}