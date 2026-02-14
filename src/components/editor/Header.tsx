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
  onToggleNotes?: () => void;
  showNotes?: boolean;
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
};

export default function Header({
  returnHome,
  hasSidebar = false,
  currentChoreo,
  onToggleNotes,
  showNotes = false,
  onSave,
  onDownload,
  editName,
  editSize,
  showManageDancers,
  manageDancers,
  showManageProps,
  manageProps,
  manageSections,
  exportChoreo,
  changeSnap,
  changeShowGrid,
  changeShowPrevious,
  changeDancerSize,
  appSettings,
  goToEdit,
  goToView,
}: HeaderProps) {
  return <header className="z-10 grid grid-cols-[1fr,auto,1fr] items-center justify-between w-screen border-b-2 select-none bg-gradient-to-b from-white to-transparent ">
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
      className="font-semibold truncate"
      onDoubleClick={downloadLogs}>
      {currentChoreo.name}
    </div>
    <div className="flex justify-end">
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
        onToggleNotes &&
        <IconButton
          src={showNotes ? ICON.speakerNotesOff : ICON.speakerNotes}
          noBorder
          onClick={() => {onToggleNotes?.()}}
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