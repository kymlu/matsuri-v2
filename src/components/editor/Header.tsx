import { memo } from "react";
import { Dialog, Menu } from "@base-ui/react";
import IconButton from "../basic/IconButton";
import { Choreo } from "../../models/choreo";
import { Sidebar } from "./Sidebar";
import { AppSetting } from "../../models/appSettings";
import { downloadLogs } from "../../lib/helpers/logHelper";
import CustomMenu from "../inputs/CustomMenu";
import { IconLabelButton } from "../basic/Button";
import Divider from "../basic/Divider";
import { formatDateRange } from "../../lib/helpers/dateHelper";
import { ChoreoStatus } from "../../pages/HomePage";
import { ChoreoStatusTag } from "../common/Tag";
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
  dancerCount: number,
  propCount: number,
  stageWidth: number,
  stageLength: number,
  version?: number,
  choreoStatus: ChoreoStatus,
  showPublish?: boolean;
  publish?: () => void;
};

function Header({
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
  dancerCount, propCount, stageLength, stageWidth, version, choreoStatus,
  showPublish, publish,
}: HeaderProps) {
  return <header className="flex items-center gap-3 px-3 py-2 border-b-2 select-none border-subtle bg-surface">
      <IconButton
        src="home"
        noBorder
        onClick={() => {
          onSave?.();
          returnHome();
        }}/>
      <div className="flex-1 min-w-0" onDoubleClick={downloadLogs}>
        {
          !isNullOrUndefinedOrBlank(currentChoreo.event) &&
          <p className="text-xs leading-tight truncate text-faint">{currentChoreo.event}</p>
        }
        <div className="flex items-center min-w-0 gap-1.5">
          <p className="font-bold leading-tight truncate">{currentChoreo.name}</p>
          <ChoreoStatusTag compact choreoStatus={choreoStatus} version={version}/>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        {
          (goToEdit || goToView) &&
          <IconButton
            colour="black"
            src={goToEdit ? "edit" : "visibility"}
            noBorder
            onClick={() => {
              if (goToEdit) {
                goToEdit();
              } else if (goToView) {
                goToView();
              } }}
            />
        }
        {
          toggleShowPath &&
          <IconButton
            colour="black"
            src="step"
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
              src="download"
              noBorder
              asDiv/>
          }>
            <div className="space-y-2">
              <Menu.Item>
                <IconLabelButton full noBorder icon="fileExport" label="共有用" onClick={exportChoreo}/>
              </Menu.Item>
              <Divider compact/>
              <Menu.Item>
                <IconLabelButton full noBorder icon="pictureAsPdf" label="PDF" onClick={onDownload}/>
              </Menu.Item>
            </div>
          </CustomMenu>
        }
        {
          onDownload && !exportChoreo &&
          <IconButton noBorder src="pictureAsPdf" onClick={onDownload}/>
        }
        {
          hasSidebar &&
          <Dialog.Root>
            <Dialog.Trigger>
              <IconButton
                src="settings"
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
              stageSize={<><span className="text-nowrap">縦{stageLength}m ×</span> <span className="text-nowrap">幅{stageWidth}m</span></>}
              dancerCount={dancerCount}
              propCount={propCount}
            />
          </Dialog.Root>
        }
      </div>
  </header>
}

export default memo(Header);