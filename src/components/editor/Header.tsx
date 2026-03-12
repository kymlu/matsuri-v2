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
  exportChoreo: () => void;
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
  showDancerWarningMessage
}: HeaderProps) {
  return <header className="flex items-center justify-between w-screen gap-2 p-2 border-b-2 select-none from-white to-transparent ">
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
      <p className="text-sm text-gray-400">{currentChoreo.event}</p>
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
          src={showPath ? ICON.doNotStep : ICON.podiatry}
          noBorder
          onClick={toggleShowPath}
          disabled={isShowPathBtnDisabled}
          />
      }
      {
        onDownload &&
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
          />
          {/* todo: add functions to the sidebar */}
        </Dialog.Root>
      }
    </div>
  </header>
}