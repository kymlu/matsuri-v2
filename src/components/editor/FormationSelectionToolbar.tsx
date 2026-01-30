import { Dialog } from "@base-ui/react";
import { strEquals } from "../../lib/helpers/globalHelper";
import { ChoreoSection } from "../../models/choreoSection";
import Button from "../basic/Button";
import CustomMenu from "../inputs/CustomMenu";
import EditSectionNameDialog from "../dialogs/EditSectionNameDialog";
import React from "react";
import EditSectionNoteDialog from "../dialogs/EditSectionNoteDialog";
import ConfirmDeletionDialog from "../dialogs/ConfirmDeletionDialog";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";

const renameDialog = Dialog.createHandle<ChoreoSection>();
const addNoteDialog = Dialog.createHandle<ChoreoSection>();
const deleteDialog = Dialog.createHandle<ChoreoSection>();

export default function FormationSelectionToolbar(props: {
  currentSectionId: string,
  sections: ChoreoSection[],
  showAddButton?: boolean,
  onClickAddButton?: (id: string, newName: string) => void,
  onClickSection: (section: ChoreoSection) => void,
  onRename?: (section: ChoreoSection, name: string) => void,
  onAddNoteToSection?: (section: ChoreoSection, note: string) => void,
  onDeleteSection?: (section: ChoreoSection) => void,
  onDuplicate?: (section: ChoreoSection, index: number) => void, // TODO
}) {
  const [renameDialogOpen, setRenameDialogOpen] = React.useState(false);
  const [addNoteDialogOpen, setAddNoteDialogOpen] = React.useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  
  const handleRenameDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setRenameDialogOpen(isOpen);
  };

  const handleAddNoteDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setAddNoteDialogOpen(isOpen);
  };
  
  const handleDeleteDialogOpen = (isOpen: boolean, eventDetails: Dialog.Root.ChangeEventDetails) => {
    setDeleteDialogOpen(isOpen);
  };
  
  return <div className="flex w-screen gap-2 p-2 overflow-scroll max-w-screen">
    {
      props.sections.map((section, i) => 
        <React.Fragment key={section.id}>
          {
            (!strEquals(props.currentSectionId, section.id) || props.showAddButton !== true) &&
              <Button
                fixed
                compact
                primary={strEquals(props.currentSectionId, section.id)}
                fontSize="text-base"
                onClick={() => {
                  if (!strEquals(props.currentSectionId, section.id)) {
                    props.onClickSection(section)
                  }
                }}>
                <div className="overflow-hidden max-w-32 whitespace-nowrap text-ellipsis">
                  {section.name}
                </div>
              </Button>
          }
          {
            strEquals(props.currentSectionId, section.id) && props.showAddButton &&
            <CustomMenu
              position="top"
              trigger={
                <Button
                  compact
                  primary
                  fontSize="text-base"
                  fixed
                  asDiv>
                  <div className="overflow-hidden max-w-32 whitespace-nowrap text-ellipsis">
                    {section.name}
                  </div>
                </Button>
              }>
              <div className="flex flex-col space-y-2">
                <Dialog.Trigger handle={renameDialog} payload={section}>
                  <Button asDiv>
                    名前変更
                  </Button>
                </Dialog.Trigger>
                <Dialog.Trigger handle={addNoteDialog} payload={section}>
                  <Button asDiv>
                    メモ追加
                  </Button>
                </Dialog.Trigger>
                {/* <Button onClick={() => {props.onDuplicate?.(section, i)}}>
                  複製
                </Button> */}
                {
                  props.sections.length > 1 &&
                  <Dialog.Trigger handle={deleteDialog} payload={section}>
                    <Button
                      asDiv>
                      削除
                    </Button>
                  </Dialog.Trigger>
                }
              </div>
            </CustomMenu>
          }
        </React.Fragment>
      )
    }
    {
      props.showAddButton &&
      <IconButton
        size="sm"
        src={ICON.addBlack}
        alt="セクション追加"
        onClick={() => {props.onClickAddButton?.(crypto.randomUUID(), "セクション" + (props.sections.length + 1))}}
      />
    }
    <Dialog.Root
      handle={renameDialog}
      open={renameDialogOpen}
      onOpenChange={handleRenameDialogOpen}
      >
      {({ payload }) => (
        <EditSectionNameDialog
          section={payload as ChoreoSection}
          onSubmit={(name) => {
            props.onRename?.(payload as ChoreoSection, name);
            renameDialog.close();
            setRenameDialogOpen(false);
          }}/>
      )}
    </Dialog.Root>
    <Dialog.Root
      handle={addNoteDialog}
      open={addNoteDialogOpen}
      onOpenChange={handleAddNoteDialogOpen}
      >
      {
        ({ payload }) => (
        <EditSectionNoteDialog
          section={payload as ChoreoSection}
          onSubmit={(note: string) => {
            props.onAddNoteToSection?.(payload as ChoreoSection, note);
            addNoteDialog.close();
            setRenameDialogOpen(false);
          }}/>
      )}
    </Dialog.Root>
    <Dialog.Root
      handle={deleteDialog}
      open={deleteDialogOpen}
      onOpenChange={handleDeleteDialogOpen}
      >
      {({ payload }) => (
        <ConfirmDeletionDialog
          section={payload as ChoreoSection}
          onSubmit={() => {
            props.onDeleteSection?.(payload as ChoreoSection);
            deleteDialog.close();
            setDeleteDialogOpen(false);
          }}/>
      )}
    </Dialog.Root>
  </div>
}