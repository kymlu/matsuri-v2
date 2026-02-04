import { Dialog } from "@base-ui/react";
import { strEquals } from "../../lib/helpers/globalHelper";
import { ChoreoSection } from "../../models/choreoSection";
import Button from "../basic/Button";
import CustomMenu from "../inputs/CustomMenu";
import EditSectionNameDialog from "../dialogs/EditSectionNameDialog";
import React, { useState } from "react";
import EditSectionNoteDialog from "../dialogs/EditSectionNoteDialog";
import ConfirmDeletionDialog from "../dialogs/ConfirmDeletionDialog";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";

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
  onDuplicate?: (section: ChoreoSection, index: number) => void,
  onReorder?: (newSectionOrder: ChoreoSection[]) => void,
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

  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
        delay: 100,
      },
    })
)

  return <div className="flex w-screen gap-2 p-2 overflow-scroll max-w-screen">
    <DndContext
      sensors={sensors}
      modifiers={[restrictToHorizontalAxis, restrictToParentElement]}
      onDragMove={(event) => {
        if (!isDragging) {
          setIsDragging(true);
        }
      }}
      onDragEnd={(event) => {
        if (!isDragging) return;

        const { active, over } = event;

        if (props.onReorder && over && active.id !== over.id) {
          const oldIndex = props.sections.findIndex((item) => strEquals(item.id, active.id.toString()));
          const newIndex = props.sections.findIndex((item) => strEquals(item.id, over.id.toString()));
          props.onReorder(arrayMove(props.sections, oldIndex, newIndex));
        }
        setIsDragging(false);
      }}
    >
      <SortableContext
        disabled={!props.showAddButton}
        items={props.sections}>
        {
          props.sections.map((section, i) => 
            <FormationSectionItem
              key={section.id}
              section={section}
              isSelected={strEquals(props.currentSectionId, section.id)}
              canEdit={props.showAddButton === true && !isDragging}
              canDelete={props.sections.length > 1}
              onClickSection={props.onClickSection}
              onDuplicateSection={() => props.onDuplicate?.(section, i)}
              />
          )
        }
      </SortableContext>
    </DndContext>
    {
      props.showAddButton &&
      <IconButton
        size="sm"
        src={ICON.add}
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

function FormationSectionItem (props: {
  section: ChoreoSection,
  isSelected: boolean,
  canEdit: boolean,
  canDelete: boolean,
  onClickSection: (section: ChoreoSection) => void,
  onDuplicateSection?: () => void,
}) {
  var {section, isSelected, canEdit, canDelete, onClickSection} = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({id: section.id});

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return <div style={style} ref={setNodeRef} {...attributes} {...listeners}>
    {
      (!isSelected || !canEdit) &&
        <Button
          fixed
          compact
          primary={isSelected}
          fontSize="text-base"
          onClick={() => {
            if (!isSelected) {
              onClickSection(section)
            }
          }}>
          <div className="overflow-hidden max-w-32 whitespace-nowrap text-ellipsis">
            {section.name}
          </div>
        </Button>
    }
    {
      isSelected && canEdit &&
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
          <Button onClick={props.onDuplicateSection}>
            複製
          </Button>
          {
            canDelete &&
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
  </div>
}