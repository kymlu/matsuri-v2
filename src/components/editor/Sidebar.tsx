import { Dialog } from "@base-ui/react";
import { IconLabelButton } from "../basic/Button";
import { AppSetting } from "../../models/appSettings";
import CustomSwitch from "../inputs/CustomSwitch";
import Icon from "../basic/Icon";
import { ICON } from "../../lib/consts/consts";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type SidebarProps = {
  choreoName: string;
  choreoEvent?: string;
  choreoDates?: string;
  stageSize?: React.ReactNode;
  dancerCount?: number;
  propCount?: number;

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
  stageSize, dancerCount, propCount,
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
    <Dialog.Popup className="fixed w-4/5 h-full bg-surface overflow-hidden right-0 z-30 top-0 min-w-64 max-w-[calc(100vw-3rem)] p-6 text-body">
      <div className="flex flex-col h-full min-h-0 gap-2 overflow-y-auto">
        <div className="grid grid-cols-[minmax(0,1fr),auto] items-start max-w-full min-w-0 gap-2">
          <div className="flex flex-col min-w-0">
            <span className="max-w-full text-lg font-bold break-all text-wrap">
              {choreoName}
            </span>
            <span className="text-faint">
              {isNullOrUndefinedOrBlank(choreoEvent) ? "イベント不明" : choreoEvent}
              {
                !isNullOrUndefinedOrBlank(choreoDates) &&
                <span className="pl-2 text-sm">
                  ({choreoDates})
                </span>
              }
            </span>
          </div>
          {
            editName &&
            <button className="flex items-center gap-1 text-sm text-primary" onClick={editName}>
              <Icon src="edit" size="xs" colour="primary"/>
              名前
            </button>
          }
        </div>
        <div className="flex flex-col border-t border-line">
          {editSize && <SettingsRow icon="resize" label="舞台サイズ" value={stageSize} onClick={editSize}/>}
          {showManageDancers && manageDancers && <SettingsRow icon="group" label="ダンサー" value={`${dancerCount ?? 0}人`} onClick={manageDancers}/>}
          {showManageProps && manageProps && <SettingsRow icon="flag" label="道具" value={`${propCount ?? 0}`} onClick={manageProps}/>}
        </div>
        <span className="mt-2 text-sm font-semibold text-muted">表示</span>
        {
          changeShowGrid &&
          <CustomSwitch label="グリッド表示" defaultChecked={appSettings.showGrid} onChange={changeShowGrid}/>
        }
        {
          changeSnap &&
          <CustomSwitch label="グリッドにスナップ" hint="動かすとマス目に合わせる" defaultChecked={appSettings.snapToGrid} onChange={changeSnap}/>
        }
        {
          changeShowPrevious &&
          <CustomSwitch label="前のセクションを見る" defaultChecked={appSettings.showPreviousSection} onChange={changeShowPrevious}/>
        }
        {
          changeDancerSize &&
          <CustomSwitch label="大きいダンサー" hint="名前を丸の中に表示" defaultChecked={appSettings.dancerDisplayType === "large"} onChange={changeDancerSize}/>
        }
        {
          showPublish && publish &&
          <div className="pt-2 mt-auto">
            <IconLabelButton
              onClick={publish}
              label="公開する"
              primary
              full
              icon="globe"/>
          </div>
        }
      </div>
    </Dialog.Popup>
  </Dialog.Portal>
}

function SettingsRow({ icon, label, value, onClick }: { icon: keyof typeof ICON, label: string, value?: React.ReactNode, onClick: () => void }) {
  return <button className="flex items-center gap-3 py-3 text-left border-b border-line" onClick={onClick}>
    <Icon src={icon} size="sm" colour="grey"/>
    <span className="shrink-0 text-nowrap">{label}</span>
    <span className="flex-1 min-w-0 text-sm text-right text-muted">{value}</span>
    <Icon src="chevronForward" size="sm" colour="grey"/>
  </button>;
}
