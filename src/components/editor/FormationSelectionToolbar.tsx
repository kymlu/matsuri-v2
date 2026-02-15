import { isNullOrUndefinedOrBlank, strEquals } from "../../lib/helpers/globalHelper";
import { ChoreoSection } from "../../models/choreoSection";
import Button from "../basic/Button";
import { useState } from "react";
import IconButton from "../basic/IconButton";
import { ICON } from "../../lib/consts/consts";
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { restrictToHorizontalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import Icon from "../basic/Icon";

type FormationSelectionToolbarProps = {
  currentSectionId: string,
  sections: ChoreoSection[],
  showAddButton?: boolean,
  onClickAddButton?: (id: string, newName: string) => void,
  onClickSection: (section: ChoreoSection) => void,
  onReorder?: (newSectionOrder: ChoreoSection[]) => void,
}

export default function FormationSelectionToolbar({
  currentSectionId, sections, showAddButton, onClickAddButton, onClickSection, onReorder
}: FormationSelectionToolbarProps) {

  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 100,
        tolerance: 50,
      },
    })
)

  return <div className="grid grid-cols-[1fr,auto] w-full max-w-full gap-2 p-2 overflow-scroll max-w-screen">
    <div className="flex gap-2 overflow-scroll">
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

          if (onReorder && over && active.id !== over.id) {
            const oldIndex = sections.findIndex((item) => strEquals(item.id, active.id.toString()));
            const newIndex = sections.findIndex((item) => strEquals(item.id, over.id.toString()));
            onReorder(arrayMove(sections, oldIndex, newIndex));
          }
          setIsDragging(false);
        }}
      >
        <SortableContext
          disabled={!showAddButton}
          items={sections}>
          {
            sections.map((section, i) => 
              <FormationSectionItem
                key={section.id}
                section={section}
                isSelected={strEquals(currentSectionId, section.id)}
                onClickSection={onClickSection}
                />
            )
          }
        </SortableContext>
      </DndContext>
    </div>
    {
      showAddButton &&
      <IconButton
        size="sm"
        src={ICON.add}
        onClick={() => {onClickAddButton?.(crypto.randomUUID(), "セクション" + (sections.length + 1))}}
      />
    }
  </div>
}

function FormationSectionItem (props: {
  section: ChoreoSection,
  isSelected: boolean,
  onClickSection: (section: ChoreoSection) => void,
}) {
  var {section, isSelected, onClickSection} = props;

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
    <Button
      primary={isSelected}
      fontSize="text-base"
      onClick={() => {
        if (!isSelected) {
          onClickSection(section)
        }
      }}>
      <div className="flex flex-row items-center justify-center gap-1 min-w-24 w-max">
        <span className="truncate">
          {section.name}
        </span>
        {
          !isNullOrUndefinedOrBlank(section.note) && 
          <Icon colour={ isSelected? "white" : "black" } src={ICON.speakerNotes} size="xs"/>
        }
        {
          section.formation.dancerActions.length > 0 && 
          <Icon colour={ isSelected? "white" : "black" } src={ICON[123]} size="sm"/>
        }
      </div>
    </Button>
  </div>
}