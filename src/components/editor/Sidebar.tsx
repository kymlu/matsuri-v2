import { Dialog } from "@base-ui/react";
import Divider from "../basic/Divider";
import { IconLabelButton } from "../basic/Button";
import { AppSetting } from "../../models/appSettings";
import CustomSwitch from "../inputs/CustomSwitch";
import IconButton from "../basic/IconButton";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type SidebarProps = {
  choreoName: string;
  choreoEvent?: string;
  choreoDates?: string;

  editName?: () => void;
  editSize?: () => void;
  showManageDancers?: boolean;
  manageDancers?: () => void;
  showManageProps?: boolean;
  manageProps?: () => void;
  manageSections?: () => void;
  
  changeSnap?: () => void;
  changeShowGrid?: () => void;
  changeShowPrevious?: () => void;
  changeDancerSize?: (showLarge: boolean) => void;
  
  appSettings: AppSetting;

  showPublish?: boolean;
  publish?: () => void;
};

export function Sidebar({
  choreoName, choreoEvent, choreoDates,
  editName, editSize,
  showManageDancers, manageDancers,
  showManageProps, manageProps,
  manageSections,
  changeSnap,
  changeShowGrid,
  changeDancerSize,
  changeShowPrevious,
  appSettings,
  showPublish,  publish,
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
              {
                !isNullOrUndefinedOrBlank(choreoDates) &&
                <span className="pl-2 text-sm">
                  ({choreoDates})
                </span>
              }
            </span>
          </div>
          <div>
            <IconButton
              noBorder
              src="edit"
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
              full icon="resize"/>
          </>
        }
        {
          showManageDancers && manageDancers &&
          <>
            <IconLabelButton
              onClick={manageDancers}
              label="ダンサー管理"
              full icon="group"/>
          </>
        }
        {
          showManageProps && manageProps &&
          <>
            <IconLabelButton
              onClick={manageProps}
              label="道具管理"
              full icon="flag"/>
          </>
        }
        {/* {
          manageSections &&
          <Button onClick={manageSections}>セクション編集</Button>
        } */}
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
        {
          showPublish && publish &&
          <>
            <Divider/>
            <IconLabelButton
              onClick={publish}
              label="公開する"
              full
              icon="globe"/>
          </>
        }
      </div>
    </Dialog.Popup>
  </Dialog.Portal>
}