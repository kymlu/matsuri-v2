import { Dialog, Menu } from "@base-ui/react";
import { ICON } from "../../lib/consts/consts";
import IconButton from "../basic/IconButton";
import { Choreo } from "../../models/choreo";
import { Sidebar } from "./Sidebar";
import { AppSetting } from "../../models/appSettings";
import { downloadLogs } from "../../lib/helpers/logHelper";
import CustomMenu from "../inputs/CustomMenu";
import { IconLabelButton } from "../basic/Button";
import Divider from "../basic/Divider";
import { formatDateRange } from "../../lib/helpers/dateHelper";
import Icon from "../basic/Icon";
import { ChoreoStatus } from "../../pages/HomePage";
import { Tag } from "../common/Tag";
import { isNullOrUndefinedOrBlank } from "../../lib/helpers/globalHelper";

type HeaderProps = {
  returnHome: () => void;
  hasSidebar?: boolean;
  currentChoreo: Choreo;
  onSave?: () => void;
  onDownload?: () => void;
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
  goToEdit?: () => void;
  goToView?: () => void;
  toggleShowPath?: () => void;
  showPath?: boolean,
  isShowPathBtnDisabled?: boolean,
  showDancerWarningMessage?: () => void;
  dancerCount: number,
  propCount: number,
  stageWidth: number,
  stageLength: number,
  version?: number,
  choreoStatus: ChoreoStatus,
  showPublish?: boolean;
  publish?: () => void;
};

export default function Header({
  returnHome,
  hasSidebar = false,
  currentChoreo,
  onSave, onDownload,
  editName, editSize,
  showManageDancers, manageDancers,
  showManageProps, manageProps, 
  manageSections,
  exportChoreo,
  changeSnap, changeShowGrid, changeShowPrevious, changeDancerSize,
  appSettings,
  goToEdit, goToView,
  toggleShowPath, showPath, isShowPathBtnDisabled,
  showDancerWarningMessage,
  dancerCount, propCount, stageLength, stageWidth, version, choreoStatus,
  showPublish, publish,
}: HeaderProps) {
  return <header className="py-2 space-y-1.5 border-b-2 select-none from-white to-transparent">
    <div className="flex items-center justify-between w-screen gap-2 px-2">
      <div className="flex">
        <IconButton
          src={ICON.home}
          noBorder
          onClick={() => {
            onSave?.();
            returnHome();
          }}/>
      </div>
      <div
        className="w-full text-center truncate"
        onDoubleClick={downloadLogs}>
        <p className="text-sm text-gray-400">{isNullOrUndefinedOrBlank(currentChoreo.event) ? "イベント不明" : currentChoreo.event}</p>
        <p className="font-bold">{currentChoreo.name}</p>
      </div>
      <div className="flex justify-end gap-2">
        <IconButton
          colour="primary"
          src={goToEdit ? ICON.edit : ICON.visibility}
          noBorder
          onClick={() => {
            if (goToEdit) {
              goToEdit();
            } else if (goToView) {
              goToView();
            } }}
          />
        {
          showDancerWarningMessage &&
          <IconButton
            colour="primary"
            src={ICON.personAlert}
            noBorder
            onClick={showDancerWarningMessage}
          />
        }
        {
          toggleShowPath &&
          <IconButton
            colour="black"
            src={ICON.step}
            noBorder
            onClick={toggleShowPath}
            disabled={isShowPathBtnDisabled}
            crossedOut={showPath}
            vertFlip
            />
        }
        {
          onDownload && exportChoreo &&
          <CustomMenu trigger={
            <IconButton
              src={ICON.download}
              noBorder
              asDiv/>
          }>
            <div className="space-y-2">
              <Menu.Item>
                <IconLabelButton full noBorder icon={ICON.fileExport} label="共有用" onClick={exportChoreo}/>
              </Menu.Item>
              <Divider compact/>
              <Menu.Item>
                <IconLabelButton full noBorder icon={ICON.pictureAsPdf} label="PDF" onClick={onDownload}/>
              </Menu.Item>
            </div>
          </CustomMenu>
        }
        {
          onDownload && !exportChoreo &&
          <IconButton noBorder src={ICON.pictureAsPdf} onClick={onDownload}/>
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
              choreoDates={formatDateRange(currentChoreo.startDate, currentChoreo.endDate)}
              editName={editName}
              editSize={editSize}
              showManageDancers={showManageDancers}
              manageDancers={manageDancers}
              showManageProps={showManageProps}
              manageProps={manageProps}
              manageSections={manageSections}
              changeSnap={changeSnap}
              changeShowGrid={changeShowGrid}
              changeDancerSize={changeDancerSize}
              appSettings={appSettings}
              changeShowPrevious={changeShowPrevious}
              showPublish={showPublish}
              publish={publish}
            />
          </Dialog.Root>
        }
      </div>
    </div>
    <div className="flex items-center justify-between px-3 text-sm text-gray-500">
      <div className="flex gap-1">
        <div className="flex items-center gap-0.5">
          <Icon
            src={ICON.resize}
            colour="grey"
            size="xs"
          />
          <span>{stageLength}m×{stageWidth}m</span>
        </div>

        {
          dancerCount > 0 &&
          <div className="flex items-center gap-0.5">
            <Icon
              src={ICON.group}
              colour="grey"
              size="xs"
            />
            <span>{dancerCount}人</span>
          </div>
        }
        {
          propCount > 0 &&
          <div className="flex items-center gap-0.5">
            <Icon
              src={ICON.flag}
              colour="grey"
              size="xs"
            />
            <span>{propCount}</span>
          </div>
        }
      </div>
      <div>
        {
          choreoStatus === "upToDate" &&
          <Tag compact type="grey" text={`v${version}`}/>
        }
        {
          choreoStatus === "edited" &&
          <Tag compact type="grey" text={`v${version}`} icon={ICON.edit}/>
        }
        {
          (choreoStatus === "localOnly") &&
          <Tag compact type="grey" text="未公開"/>
        }
      </div>
    </div>
  </header>
}