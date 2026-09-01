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
import { DancerCount, PropCount, StageSize } from "../common/IconInfo";

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
  showDancerWarningMessage,
  dancerCount, propCount, stageLength, stageWidth, version, choreoStatus,
  showPublish, publish,
}: HeaderProps) {
  return <header className="py-2 space-y-1.5 border-b-2 select-none from-white to-transparent">
    <div className="flex items-center justify-between w-screen gap-2 px-2">
      <div className="flex">
        <IconButton
          src="home"
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
          src={goToEdit ? "edit" : "visibility"}
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
            src="personAlert"
            noBorder
            onClick={showDancerWarningMessage}
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
            />
          </Dialog.Root>
        }
      </div>
    </div>
    <div className="flex items-center justify-between px-3 text-sm text-gray-600">
      <div className="flex gap-1">
        <StageSize stageLength={stageLength} stageWidth={stageWidth}/>

        {
          dancerCount > 0 &&
          <DancerCount dancerCount={dancerCount}/>
        }
        {
          propCount > 0 &&
          <PropCount propCount={propCount}/>
        }
      </div>
      <ChoreoStatusTag compact choreoStatus={choreoStatus} version={version}/>
    </div>
  </header>
}

export default memo(Header);